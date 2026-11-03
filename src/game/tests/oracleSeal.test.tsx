import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TacticalRevealLayer, type TacticalRevealEvent } from "../../components/match/TacticalRevealLayer";
import { CARDS_BY_ID } from "../cards";
import { createInitialMatchState, playCard } from "../engine/MatchEngine";
import { resolveCardEffects } from "../engine/EffectResolver";
import { loadCardDefinitions } from "../data/cards";
import type { CardInstance, MatchState, PlayerId } from "../core/types";

const definitions = new Map(loadCardDefinitions().map((card) => [card.id, card]));

function instance(id: string, ownerId: PlayerId, suffix: string): CardInstance {
  const definition = definitions.get(id);
  if (!definition) throw new Error("Missing test card " + id);
  return {
    instanceId: ownerId + "_" + suffix,
    baseId: id,
    definition,
    ownerId,
    currentAttack: definition.attack,
    currentHealth: definition.health,
  };
}

function readyWithSeal(shield = 0): MatchState {
  const state = createInitialMatchState({ seed: 117, startingPlayerId: "player" });
  return {
    ...state,
    activePlayerId: "player",
    phase: "main",
    player: { ...state.player, will: 5, effects: [], hand: [instance("seal_of_forgotten_souls", "player", "seal")] },
    enemy: { ...state.enemy, hand: [], effects: [], shield },
    board: {
      playerSlots: [
        instance("omega", "player", "omega"),
        instance("oreon", "player", "oreon"),
        null, null, null,
      ],
      enemySlots: [
        instance("omega", "enemy", "omega"),
        instance("oreon", "enemy", "oreon"),
        instance("spear_tribesman", "enemy", "spear"),
        instance("betrayal", "enemy", "betrayal"),
        null,
      ],
    },
    currentTurn: {
      playerId: "player",
      d20Limit: "unlimited",
      playsUsed: 0,
      cardsPlayed: 0,
      destroyedOwnCard: false,
      freeCards: false,
      skipDamageApplied: false,
      timerSeconds: 60,
      playedCosts: [],
    },
  };
}

describe("Seal of the Forgotten Souls: one-time field damage", () => {
  it("uses its mythic Will price and the correct description", () => {
    expect(CARDS_BY_ID.seal_of_forgotten_souls.rarity).toBe("mythic");
    expect(CARDS_BY_ID.seal_of_forgotten_souls.cost).toBe(4);
    expect(CARDS_BY_ID.seal_of_forgotten_souls.description).toContain("Разовый эффект");
  });

  it("counts 3 occupied friendly slots INCLUDING the Seal and 4 enemy slots for exactly 7 damage", () => {
    const before = readyWithSeal();
    const played = playCard(before, "player", before.player.hand[0].instanceId, {
      type: "slot", playerId: "player", slotIndex: 2,
    });

    expect(played.player.will).toBe(1);
    expect(played.board.playerSlots.filter(Boolean)).toHaveLength(3);
    expect(played.board.enemySlots.filter(Boolean)).toHaveLength(4);
    expect(before.enemy.hp - played.enemy.hp).toBe(7);
    expect(played.player.hp).toBe(before.player.hp);
    expect(played.enemy.effects.some((effect) => effect.id === "every_second_card_self_damage")).toBe(false);
    expect(played.log.some((entry) => entry.includes("3 friendly + 4 enemy occupied slots = 7"))).toBe(true);
  });

  it("respects a shield and does not additionally hurt the opponent on later card plays", () => {
    const before = readyWithSeal(2);
    const played = playCard(before, "player", before.player.hand[0].instanceId, {
      type: "slot", playerId: "player", slotIndex: 2,
    });
    expect(played.enemy.shield).toBe(0);
    expect(before.enemy.hp - played.enemy.hp).toBe(5);

    const filler = instance("oreon", "enemy", "after-seal");
    const next = {
      ...played,
      activePlayerId: "enemy" as const,
      phase: "enemy" as const,
      enemy: { ...played.enemy, will: 5, hand: [filler] },
      currentTurn: { ...played.currentTurn!, playerId: "enemy" as const },
    };
    const afterEnemyPlay = playCard(next, "enemy", filler.instanceId, {
      type: "slot", playerId: "enemy", slotIndex: 4,
    });
    expect(afterEnemyPlay.enemy.hp).toBe(played.enemy.hp);
  });

  it("does not damage hero when Seal is reflected and its source is protected", () => {
    const state = readyWithSeal();
    expect(state.board.playerSlots.filter(Boolean)).toHaveLength(2);
    // Raw count for a standalone effect cast: two cards on our board, four on enemy board.
    // A played Seal adds itself before resolving and therefore deals one extra point.
    const result = resolveCardEffects(state, "player", instance("seal_of_forgotten_souls", "player", "virtual"));
    expect(state.enemy.hp - result.enemy.hp).toBe(6);
  });
});

describe("Oracle: choose exactly one concealed enemy hand card", () => {
  function castOracle() {
    const state = createInitialMatchState({ seed: 33, startingPlayerId: "player" });
    const withHand: MatchState = {
      ...state,
      player: { ...state.player, effects: [] },
      enemy: {
        ...state.enemy,
        effects: [],
        hand: [
          instance("omega", "enemy", "omega"),
          instance("oreon", "enemy", "oreon"),
          instance("revolver", "enemy", "revolver"),
        ],
      },
    };
    const resolved = resolveCardEffects(withHand, "player", instance("oracle", "player", "oracle"));
    const revealEvents = (resolved as MatchState & {
      tacticalRevealEvents?: TacticalRevealEvent[];
    }).tacticalRevealEvents ?? [];
    return { withHand, resolved, event: revealEvents.at(-1) };
  }

  it("has the correct legendary description and creates a hidden-choice event, not an all-hand reveal", () => {
    expect(CARDS_BY_ID.oracle.rarity).toBe("legendary");
    expect(CARDS_BY_ID.oracle.description).toContain("одну закрытую");
    const { withHand, resolved, event } = castOracle();
    expect(event?.kind).toBe("oracle-pick");
    expect(event?.viewer).toBe("player");
    expect(event?.owner).toBe("enemy");
    expect(event?.cards).toHaveLength(3);
    expect(resolved.enemy.hand.map((card) => card.instanceId)).toEqual(withHand.enemy.hand.map((card) => card.instanceId));
    // No card names from the enemy's hand are placed in the public match log.
    expect(resolved.log.slice(-1).join(" ")).not.toContain("Revolver");
  });

  it("initially shows only selectable backs and no hidden card titles or images", () => {
    const { event } = castOracle();
    expect(event).toBeDefined();
    const html = renderToStaticMarkup(<TacticalRevealLayer events={[event!]} />);
    expect(html).toContain("Открыть закрытую карту 1");
    expect(html).toContain("Открыть закрытую карту 2");
    expect(html).toContain("Открыть закрытую карту 3");
    expect(html).toContain("/cards/card-back.png");
    expect(html).not.toContain("/cards/Revolver.png");
    expect(html).not.toContain(">Revolver<");
    expect(html).not.toContain(">Oreon<");
    expect(html).not.toContain(">Omega<");
  });

  it("hides an enemy Oracle reveal from the local human", () => {
    const { event } = castOracle();
    expect(event).toBeDefined();
    const enemyEvent = { ...event!, viewer: "enemy" as const };
    expect(renderToStaticMarkup(<TacticalRevealLayer events={[enemyEvent]} />)).toBe("");
  });
});
