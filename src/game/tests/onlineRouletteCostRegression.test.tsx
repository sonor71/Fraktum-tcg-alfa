import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CardView } from "../../components/match/CardView";
import { createInitialMatchState, dispatch, playCard } from "../engine/MatchEngine";
import { getEffectiveCardCost, canPlayCardWithCurrentResources } from "../engine/TurnManager";
import { loadCardDefinitions } from "../data/cards";
import { getOnlineMatchSeeds } from "../../services/onlineMatchSeed";
import type { CardDefinition, CardInstance, MatchState, PlayerId, StartMatchPayload } from "../core/types";

const definitions = new Map(loadCardDefinitions().map(card => [card.id, card]));

function instance(baseId: string, ownerId: PlayerId): CardInstance {
  const definition = definitions.get(baseId);
  if (!definition) throw new Error("Unknown card: " + baseId);
  return {
    baseId, definition, ownerId, instanceId: ownerId + "_" + baseId,
    currentAttack: definition.attack, currentHealth: definition.health,
  };
}

function mirroredStates(seed: number) {
  const mains = loadCardDefinitions().filter((card: CardDefinition) => !["character", "hero", "bonus", "upgrade"].includes(card.type)).slice(0, 20);
  const aDeck = mains;
  const bDeck = [...mains].reverse();
  const host: StartMatchPayload = {
    seed, playerDeck: aDeck, enemyDeck: bDeck, startingPlayerId: "player",
    ...getOnlineMatchSeeds(seed, "a"),
  };
  const guest: StartMatchPayload = {
    seed, playerDeck: bDeck, enemyDeck: aDeck, startingPlayerId: "enemy",
    ...getOnlineMatchSeeds(seed, "b"),
  };
  return { host: createInitialMatchState(host), guest: createInitialMatchState(guest) };
}

describe("online roulette id and action synchronization", () => {
  it.each([15, 16] as const)("mirrors roll %i through spin, reveal and confirmation from host seat", (rolled) => {
    const start = mirroredStates(1793900000012 + rolled);
    let a = dispatch(start.host, { type: "ROLL_D20", playerId: "player", forcedRoll: rolled });
    let b = dispatch(start.guest, { type: "ROLL_D20", playerId: "enemy", forcedRoll: rolled });
    const id = a.rouletteState?.id;
    expect(id).toBeTruthy();
    expect(b.rouletteState?.id).toBe(id);
    expect(a.rouletteState?.ownerId).toBe("player");
    expect(b.rouletteState?.ownerId).toBe("enemy");
    a = dispatch(a, { type: "SPIN_FATE_ROULETTE", playerId: "player", rouletteId: id! });
    b = dispatch(b, { type: "SPIN_FATE_ROULETTE", playerId: "enemy", rouletteId: id! });
    expect(a.rouletteState?.stage).toBe("spinning");
    expect(b.rouletteState?.stage).toBe("spinning");
    expect(a.rouletteState?.resultIndex).toBe(b.rouletteState?.resultIndex);
    expect(a.rouletteState?.event).toBe(b.rouletteState?.event);
    const revealedAtMs = 1793900002000;
    // Guest is not authorized to reveal or confirm the owner's roulette.
    const notOwner = dispatch(b, { type: "REVEAL_FATE_ROULETTE_RESULT", playerId: "player", rouletteId: id!, revealedAtMs });
    expect(notOwner.rouletteState?.stage).toBe("spinning");
    a = dispatch(a, { type: "REVEAL_FATE_ROULETTE_RESULT", playerId: "player", rouletteId: id!, revealedAtMs });
    b = dispatch(b, { type: "REVEAL_FATE_ROULETTE_RESULT", playerId: "enemy", rouletteId: id!, revealedAtMs });
    expect(a.rouletteState?.stage).toBe("result");
    expect(b.rouletteState?.stage).toBe("result");
    expect(a.rouletteState?.confirmAvailableAt).toBe(b.rouletteState?.confirmAvailableAt);
    const confirmedAtMs = revealedAtMs + 15_100;
    a = dispatch(a, { type: "CONFIRM_FATE_ROULETTE_RESULT", playerId: "player", rouletteId: id!, confirmedAtMs });
    b = dispatch(b, { type: "CONFIRM_FATE_ROULETTE_RESULT", playerId: "enemy", rouletteId: id!, confirmedAtMs });
    expect(a.rouletteState).toBeUndefined();
    expect(b.rouletteState).toBeUndefined();
    expect(a.phase).toBe("main");
    expect(b.phase).toBe("enemy");
    expect(a.lastRoll).toBe(b.lastRoll);
    expect(a.activeRouletteEvent).toBe(b.activeRouletteEvent);
    expect(a.rngSeed).toBe(b.rngSeed);
  });

  it("keeps the same roulette id when guest seat is active", () => {
    const start = mirroredStates(1793900100000);
    const a = dispatch({ ...start.host, activePlayerId: "enemy", phase: "enemy" } as MatchState,
      { type: "ROLL_D20", playerId: "enemy", forcedRoll: 15 });
    const b = dispatch({ ...start.guest, activePlayerId: "player", phase: "roll" } as MatchState,
      { type: "ROLL_D20", playerId: "player", forcedRoll: 15 });
    expect(a.rouletteState?.id).toBe(b.rouletteState?.id);
    const id = a.rouletteState!.id;
    expect(dispatch(a, { type: "SPIN_FATE_ROULETTE", playerId: "enemy", rouletteId: id }).rouletteState?.stage).toBe("spinning");
    expect(dispatch(b, { type: "SPIN_FATE_ROULETTE", playerId: "player", rouletteId: id }).rouletteState?.stage).toBe("spinning");
  });
});

describe("effective Will price must match actual payment", () => {
  it("shows x2 price on a common card, blocks insufficient Will and logs exactly what was spent", () => {
    const base = createInitialMatchState({ seed: 309, startingPlayerId: "player" });
    const card = instance("oreon", "player");
    const state: MatchState = {
      ...base, phase: "main", activePlayerId: "player",
      player: { ...base.player, hand: [card], will: 1 },
      board: { ...base.board, playerSlots: [null, null, null, null, null] },
      currentTurn: {
        playerId: "player", d20Limit: "unlimited", playsUsed: 0, cardsPlayed: 0,
        destroyedOwnCard: false, freeCards: false, skipDamageApplied: false,
        willCostMultiplier: 2, timerSeconds: 60, playedCosts: [],
      },
    };
    expect(card.definition.cost).toBe(1);
    expect(getEffectiveCardCost(state, "player", card)).toBe(2);
    expect(canPlayCardWithCurrentResources(state, "player", card)).toBe(false);
    const html = renderToStaticMarkup(<CardView card={card} size="hand" effectiveCost={2} blockedReason="НУЖНО 2 ВОЛИ" />);
    expect(html).toContain('data-card-cost="2"');
    expect(html).toContain('data-card-printed-cost="1"');
    expect(html).toContain("ЦЕНА 1 → 2");
    expect(html).toContain("НУЖНО 2 ВОЛИ");
    const blocked = playCard(state, "player", card.instanceId, { type: "slot", playerId: "player", slotIndex: 0 });
    expect(blocked.player.hand).toHaveLength(1);
    expect(blocked.player.will).toBe(1);
    const affordable: MatchState = { ...state, player: { ...state.player, will: 2 } };
    const played = playCard(affordable, "player", card.instanceId, { type: "slot", playerId: "player", slotIndex: 0 });
    expect(played.player.hand).toHaveLength(0);
    expect(played.player.will).toBe(0);
    expect(played.currentTurn?.playedCosts.at(-1)?.cost).toBe(2);
    expect(played.log.some(entry => entry.includes("spent 2 Will; printed cost 1"))).toBe(true);
  });
});
