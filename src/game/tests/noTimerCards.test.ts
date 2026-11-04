import { describe, expect, it } from "vitest";
import { CARDS_BY_ID } from "../cards";
import { loadCardDefinitions } from "../data/cards";
import { resolveCardEffects } from "../engine/EffectResolver";
import { createInitialMatchState, playCard } from "../engine/MatchEngine";
import type { CardInstance, MatchState, PlayerId } from "../core/types";

const definitions = new Map(loadCardDefinitions().map((card) => [card.id, card]));

function instance(id: string, ownerId: PlayerId, suffix = id): CardInstance {
  const definition = definitions.get(id);
  if (!definition) throw new Error("Missing card " + id);
  return {
    instanceId: ownerId + "_" + suffix,
    baseId: id,
    definition,
    ownerId,
    currentAttack: definition.attack,
    currentHealth: definition.health,
  };
}

function scenario(id: "seventy_one" | "double_speed"): MatchState {
  const state = createInitialMatchState({ seed: 491, startingPlayerId: "player" });
  return {
    ...state,
    activePlayerId: "player",
    phase: "main",
    player: { ...state.player, hp: 20, will: 5, shield: 0, hand: [instance(id, "player")], effects: [] },
    enemy: { ...state.enemy, effects: [] },
    board: { ...state.board, playerSlots: [null, null, null, null, null], enemySlots: [null, null, null, null, null] },
    currentTurn: {
      playerId: "player", d20Limit: "unlimited", playsUsed: 0, cardsPlayed: 0,
      destroyedOwnCard: false, freeCards: false, skipDamageApplied: false, timerSeconds: 60, playedCosts: [],
    },
  };
}

describe("71 and 2X have meaningful effects without a match timer", () => {
  it("preserves rarity-based costs and removes timer descriptions", () => {
    expect(CARDS_BY_ID.seventy_one.rarity).toBe("epic");
    expect(CARDS_BY_ID.seventy_one.cost).toBe(3);
    expect(CARDS_BY_ID.double_speed.rarity).toBe("rare");
    expect(CARDS_BY_ID.double_speed.cost).toBe(2);
    for (const id of ["seventy_one", "double_speed"]) {
      expect(CARDS_BY_ID[id].description).not.toMatch(/секунд|таймер|время матча/i);
    }
  });

  it("71 restores 7 HP when critically wounded and costs 3 Will", () => {
    const initial = scenario("seventy_one");
    const state = { ...initial, player: { ...initial.player, hp: 7 } };
    const next = playCard(state, "player", state.player.hand[0].instanceId);
    expect(next.player.hp).toBe(14);
    expect(next.player.will).toBe(2);
    expect(next.player.shield).toBe(0);
    expect(next.player.hand).toHaveLength(0);
    expect((next as unknown as Record<string, unknown>).matchSecondsBonus).toBeUndefined();
  });

  it("71 grants a shield and one draw above the threshold", () => {
    const initial = scenario("seventy_one");
    const state = {
      ...initial,
      player: { ...initial.player, deck: [instance("omega", "player", "draw")], hp: 8 },
    };
    const next = playCard(state, "player", state.player.hand[0].instanceId);
    expect(next.player.hp).toBe(8);
    expect(next.player.shield).toBe(1);
    expect(next.player.hand.map((card) => card.baseId)).toEqual(["omega"]);
    expect(next.player.will).toBe(2);
  });

  it("71 cannot overheal or exceed the hand limit", () => {
    const initial = scenario("seventy_one");
    const low: MatchState = { ...initial, player: { ...initial.player, hp: 6, maxHp: 10 } };
    const treated = resolveCardEffects(low, "player", instance("seventy_one", "player"));
    expect(treated.player.hp).toBe(10);
    const full: MatchState = {
      ...initial,
      player: { ...initial.player, hand: Array(7).fill(instance("omega", "player")) },
    };
    const after = resolveCardEffects(full, "player", instance("seventy_one", "player"));
    expect(after.player.hand).toHaveLength(7);
    expect(after.player.shield).toBe(1);
  });

  it("2X hits two enemy cards for 2 each and costs 2 Will", () => {
    const state = scenario("double_speed");
    const pair: MatchState = {
      ...state,
      board: {
        ...state.board,
        enemySlots: [instance("conjurer", "enemy", "a"), instance("conjurer", "enemy", "b"), null, null, null],
      },
    };
    const next = playCard(pair, "player", pair.player.hand[0].instanceId);
    expect(next.enemy.hp).toBe(pair.enemy.hp);
    expect(next.board.enemySlots[0]?.currentHealth).toBe(pair.board.enemySlots[0]!.currentHealth - 2);
    expect(next.board.enemySlots[1]?.currentHealth).toBe(pair.board.enemySlots[1]!.currentHealth - 2);
    expect(next.player.will).toBe(3);
    expect((next as unknown as Record<string, unknown>).matchSpeedMultiplierBonus).toBeUndefined();
  });

  it("2X strikes a lone card twice without redirecting excess damage to the hero", () => {
    const state = scenario("double_speed");
    const alone: MatchState = {
      ...state,
      board: { ...state.board, enemySlots: [instance("oreon", "enemy"), null, null, null, null] },
    };
    const next = resolveCardEffects(alone, "player", instance("double_speed", "player"));
    expect(next.board.enemySlots[0]?.currentHealth).toBe(0);
    expect(next.enemy.hp).toBe(alone.enemy.hp);
  });

  it("2X deals just 1 damage to the enemy hero if their board is empty", () => {
    const state = scenario("double_speed");
    const next = resolveCardEffects(state, "player", instance("double_speed", "player"));
    expect(state.enemy.hp - next.enemy.hp).toBe(1);
  });
});
