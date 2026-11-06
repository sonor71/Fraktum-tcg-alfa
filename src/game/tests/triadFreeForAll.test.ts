import { describe, expect, it } from "vitest";
import type { CardDefinition } from "../core/types";
import {
  TRIAD_VICTORIES_TO_WIN, createTriadMatch, reduceTriad,
  triadCanPlay, triadIsSupport, type TriadLoadout,
} from "../triad/triadEngine";

function card(id: string, attack = 3, hp = 0): CardDefinition {
  return {
    id, title: id, type: "attack", rarity: "common", cost: 1, attack, health: hp,
    description: "", image: "/cards/card-back.png", effectKey: "",
  };
}
const cards = Array.from({ length: 20 }, (_, index) => card("triad_fixture_" + index));
const hero = { ...card("triad_hero", 0, 30), type: "character" as const };
const loadouts: Record<"a" | "b" | "c", TriadLoadout> = {
  a: { name: "A", deck: cards, hero, maxWill: 20 },
  b: { name: "B", deck: cards, hero, maxWill: 20 },
  c: { name: "C", deck: cards, hero, maxWill: 20 },
};
function battle() {
  return createTriadMatch(loadouts, 123456);
}
function ready() {
  const state = battle();
  return { ...state, phase: "main" as const, playLimit: "unlimited" as const };
}

describe("1x1x1 independent free-for-all", () => {
  it("uses the same fixed A -> B -> C order for each turn", () => {
    let state = battle();
    expect(state.active).toBe("a");
    state = reduceTriad(state, { type: "ROLL", seat: "a" }, loadouts);
    state = reduceTriad(state, { type: "END", seat: "a" }, loadouts);
    expect(state.active).toBe("b");
    state = reduceTriad(state, { type: "ROLL", seat: "b" }, loadouts);
    state = reduceTriad(state, { type: "END", seat: "b" }, loadouts);
    expect(state.active).toBe("c");
    state = reduceTriad(state, { type: "ROLL", seat: "c" }, loadouts);
    state = reduceTriad(state, { type: "END", seat: "c" }, loadouts);
    expect(state.active).toBe("a");
  });
  it("directed cards affect only the chosen opponent", () => {
    let state = ready();
    const source = state.players.a.hand[0];
    expect(triadCanPlay(state, "a", source, "b", 0)).toBe(true);
    expect(triadCanPlay(state, "a", source, "a", 0)).toBe(false);
    state = reduceTriad(state, { type: "PLAY", seat: "a", lane: "b", slot: 0, cardId: source.instanceId }, loadouts);
    expect(state.players.b.hp).toBeLessThan(30);
    expect(state.players.c.hp).toBe(30);
  });
  it("a defeated player is skipped while the remaining two continue", () => {
    let state = ready();
    state = { ...state, players: {
      ...state.players, b: { ...state.players.b, hp: 1 },
    } };
    const source = state.players.a.hand[0];
    state = reduceTriad(state, { type: "PLAY", seat: "a", lane: "b", slot: 0, cardId: source.instanceId }, loadouts);
    expect(state.players.b.eliminated).toBe(true);
    expect(state.phase).toBe("main");
    state = reduceTriad(state, { type: "END", seat: "a" }, loadouts);
    expect(state.active).toBe("c");
  });
  it("advances to the next alive player if the active hero is killed by a counterattack", () => {
    let state = ready();
    const attacker = { ...state.players.a.hand[0], hp: 1, playedTurn: -2,
      definition: card("attacker", 0, 1) };
    const defender = { ...state.players.b.hand[0], hp: 4, playedTurn: -2,
      definition: card("defender", 4, 4) };
    state = { ...state, phase: "roll", players: {
      ...state.players,
      a: { ...state.players.a, hp: 1, turnsTaken: 1,
        lanes: { ...state.players.a.lanes, b: [attacker, null, null] } },
      b: { ...state.players.b, turnsTaken: 1,
        lanes: { ...state.players.b.lanes, a: [defender, null, null] } },
    } };
    state = reduceTriad(state, { type: "ROLL", seat: "a" }, loadouts);
    expect(state.players.a.eliminated).toBe(true);
    expect(state.active).toBe("b");
    expect(state.phase).toBe("roll");
  });
  it("requires explicit friendly target for Healing and restores only owner card HP", () => {
    let state = ready();
    const damaged = { ...state.players.a.hand[1], hp: 2,
      definition: card("damaged_friendly", 2, 7), playedTurn: -2 };
    const spell = { ...state.players.a.hand[0], definition: card("healing", 0, 0) };
    state = { ...state, players: { ...state.players, a: {
      ...state.players.a, hand: [spell],
      lanes: { ...state.players.a.lanes, b: [damaged, null, null] },
    } } };
    const rejected = reduceTriad(state, { type: "PLAY", seat: "a", lane: "support", slot: 0,
      cardId: spell.instanceId }, loadouts);
    expect(rejected).toBe(state);
    const treated = reduceTriad(state, { type: "PLAY", seat: "a", lane: "support", slot: 0,
      cardId: spell.instanceId, targetSeat: "b", targetSlot: 0 }, loadouts);
    expect(treated.players.a.lanes.b[0]?.hp).toBe(5);
    expect(treated.players.b.hp).toBe(30);
    expect(treated.players.c.hp).toBe(30);
  });
  it("Clean Sheet chooses a different hand card to discard then draws two", () => {
    let state = ready();
    const spell = { ...state.players.a.hand[0], definition: card("clean_sheet", 0, 0) };
    const target = state.players.a.hand[1];
    state = { ...state, players: { ...state.players, a: {
      ...state.players.a, hand: [spell, target],
    } } };
    const next = reduceTriad(state, { type: "PLAY", seat: "a", lane: "support", slot: 0,
      cardId: spell.instanceId, targetCardId: target.instanceId }, loadouts);
    expect(next.players.a.discard.some((c) => c.instanceId === target.instanceId)).toBe(true);
    expect(next.players.a.hand).toHaveLength(2);
    expect(next.players.a.deck).toHaveLength(state.players.a.deck.length - 2);
  });
  it("uses the dedicated support slots for global cards", () => {
    const tsunami = card("tsunami", 0, 0);
    let state = ready();
    state = { ...state, players: { ...state.players, a: {
      ...state.players.a, hand: [
        { ...state.players.a.hand[0], definition: tsunami },
      ],
    } } };
    const source = state.players.a.hand[0];
    expect(triadIsSupport(source)).toBe(true);
    expect(triadCanPlay(state, "a", source, "support", 0)).toBe(true);
    expect(triadCanPlay(state, "a", source, "b", 0)).toBe(false);
    // Both rivals have a defending card in the lane directed at player A.
    const block = { ...source, definition: card("triad_defender", 0, 4), hp: 4 };
    state = { ...state, players: { ...state.players,
      b: { ...state.players.b, lanes: { ...state.players.b.lanes, a: [block, null, null] } },
      c: { ...state.players.c, lanes: { ...state.players.c.lanes, a: [block, null, null] } },
    } };
    state = reduceTriad(state, { type: "PLAY", seat: "a", lane: "support", slot: 0, cardId: source.instanceId }, loadouts);
    expect(state.players.a.support[0]).toBeNull();
    expect(state.players.b.lanes.a[0]?.hp).toBe(2);
    expect(state.players.c.lanes.a[0]?.hp).toBe(2);
    expect(state.players.a.discard.some((c) => c.instanceId === source.instanceId)).toBe(true);
  });
  it("requires three battle victories, not one elimination, to win the series", () => {
    let state = createTriadMatch(loadouts, 123456, 3, { a: TRIAD_VICTORIES_TO_WIN - 1, b: 0, c: 0 });
    state = { ...state, phase: "main", playLimit: "unlimited",
      players: { ...state.players, b: { ...state.players.b, hp: 0, eliminated: true },
        c: { ...state.players.c, hp: 1 } } };
    const source = state.players.a.hand[0];
    state = reduceTriad(state, { type: "PLAY", seat: "a", lane: "c", slot: 0, cardId: source.instanceId }, loadouts);
    expect(state.phase).toBe("ended");
    expect(state.winner).toBe("a");
    expect(state.players.a.victories).toBe(3);
  });
});
