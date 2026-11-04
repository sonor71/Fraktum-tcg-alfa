import { describe, expect, it } from "vitest";
import { CARDS_BY_ID } from "../cards";
import { loadCardDefinitions } from "../data/cards";
import { resolveCardEffects } from "../engine/EffectResolver";
import { createInitialMatchState, dispatch, playCard } from "../engine/MatchEngine";
import { BASE_BATTLE_SECONDS, MAX_BATTLE_CLOCK_SPEED } from "../engine/Rules";
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

describe("2-minute battle timer with 71 and 2X", () => {
  it("starts every battle at 120 seconds with a normal countdown", () => {
    const s = createInitialMatchState({ seed: 1 });
    expect(BASE_BATTLE_SECONDS).toBe(120);
    expect(s.battleClockExtraSeconds).toBe(0);
    expect(s.battleClockSpeed).toBe(1);
  });

  it("71 adds exactly 71 seconds for both sides and spends 3 Will", () => {
    const s = scenario("seventy_one");
    expect(CARDS_BY_ID.seventy_one.rarity).toBe("epic");
    expect(CARDS_BY_ID.seventy_one.cost).toBe(3);
    expect(CARDS_BY_ID.seventy_one.description).toContain("71 секунду");
    const next = playCard(s, "player", s.player.hand[0].instanceId);
    expect(next.battleClockExtraSeconds).toBe(71);
    expect(next.battleClockSpeed).toBe(1);
    expect(next.player.will).toBe(2);
    expect(next.enemy.hp).toBe(s.enemy.hp);
    expect(next.player.hp).toBe(s.player.hp);
  });

  it("2X doubles countdown speed to ×2, ×4 and ×8 with an ×8 cap", () => {
    const s = scenario("double_speed");
    expect(CARDS_BY_ID.double_speed.rarity).toBe("rare");
    expect(CARDS_BY_ID.double_speed.cost).toBe(2);
    const first = playCard(s, "player", s.player.hand[0].instanceId);
    expect(first.player.will).toBe(3);
    expect(first.battleClockSpeed).toBe(2);
    expect(first.enemy.hp).toBe(s.enemy.hp);
    expect(first.board.enemySlots).toEqual(s.board.enemySlots);
    const second = resolveCardEffects(first, "enemy", instance("double_speed", "enemy", "second"));
    const third = resolveCardEffects(second, "player", instance("double_speed", "player", "third"));
    const fourth = resolveCardEffects(third, "enemy", instance("double_speed", "enemy", "fourth"));
    expect(second.battleClockSpeed).toBe(4);
    expect(third.battleClockSpeed).toBe(MAX_BATTLE_CLOCK_SPEED);
    expect(fourth.battleClockSpeed).toBe(MAX_BATTLE_CLOCK_SPEED);
  });

  it("time expiration finishes battle using remaining hero HP, and does not double-count", () => {
    const s = scenario("double_speed");
    const ahead = { ...s, player: { ...s.player, hp: 17 }, enemy: { ...s.enemy, hp: 12 } };
    const expired = dispatch(ahead, { type: "EXPIRE_BATTLE_CLOCK", battleNumber: 1 });
    expect(expired.phase).toBe("betweenBattles");
    expect(expired.battleResult).toBe("player");
    expect(expired.seriesScore?.player).toBe(1);
    expect(expired.log.some(x => x.includes("[BATTLE_CLOCK_EXPIRED]"))).toBe(true);
    const again = dispatch(expired, { type: "EXPIRE_BATTLE_CLOCK", battleNumber: 1 });
    expect(again.seriesScore?.player).toBe(1);
    const next = dispatch(expired, { type: "START_NEXT_BATTLE", battleNumber: 1 });
    expect(next.battleNumber).toBe(2);
    expect(next.battleClockExtraSeconds).toBe(0);
    expect(next.battleClockSpeed).toBe(1);
    expect(dispatch(next, { type: "EXPIRE_BATTLE_CLOCK", battleNumber: 1 }).battleResult).toBeUndefined();
  });

  it("equal hero HP at expiration is a draw", () => {
    const s = scenario("seventy_one");
    const drawn = dispatch(s, { type: "EXPIRE_BATTLE_CLOCK", battleNumber: 1 });
    expect(drawn.battleResult).toBe("draw");
    expect(drawn.seriesScore).toEqual({ player: 1, enemy: 1 });
  });
});
