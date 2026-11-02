import { afterEach, describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { CARDS, CARDS_BY_ID, getRandomCardIdsFromPool } from "../cards";
import { CARD_IDENTITIES, createUniqueCardId, getDefinitionIdByUniqueId } from "../cardIdentity";
import { PACKS } from "../../data/packs";
import { useGameStore } from "../../useGameStore";
import { loadCardDefinitions } from "../data/cards";
import { resolveCardEffects } from "../engine/EffectResolver";
import { createInitialMatchState } from "../engine/MatchEngine";
import type { CardInstance, PlayerId } from "../core/types";

export const ALPHA_16 = [
  "ice_boulders", "omega", "origin_shard", "oreon",
  "spear_tribesman", "conjurer", "revolver", "shadow_assassin",
  "static_pilgrim", "ten_thousand_volts", "king_peleus",
  "betrayal", "velvet_tide", "primordial_tree", "black_archive",
  "dawnless_winter",
];

const gameDefinitions = new Map(loadCardDefinitions().map((card) => [card.id, card]));
function instance(id: string, ownerId: PlayerId, suffix = ""): CardInstance {
  const definition = gameDefinitions.get(id);
  if (!definition) throw new Error("Missing " + id);
  return { instanceId: ownerId + "_" + id + suffix, baseId: id, definition,
    currentAttack: definition.attack, currentHealth: definition.health, ownerId };
}

describe("16 alpha card artworks: full game wiring", () => {
  afterEach(() => useGameStore.getState().resetProgress());

  it("registers all 16 new cards with existing images, consistent rarities and round-trip serial IDs", () => {
    expect(CARDS).toHaveLength(64);
    for (const id of ALPHA_16) {
      const definition = CARDS_BY_ID[id];
      expect(definition, id).toBeDefined();
      expect(definition.image).toMatch(/^\/cards\//);
      expect(existsSync(join(process.cwd(), "public", definition.image.replace(/^\//, ""))), "Artwork missing: " + id).toBe(true);
      expect(CARD_IDENTITIES[id], "Identity missing: " + id).toBeDefined();
      expect(CARD_IDENTITIES[id].definitionId).toBe(id);
      expect(CARD_IDENTITIES[id].image).toBe(definition.image);
      const generated = createUniqueCardId(id, 1);
      expect(generated).toMatch(/^[A-Z0-9]{3}-\d{3}-\d{6}$/);
      expect(getDefinitionIdByUniqueId(generated)).toBe(id);
      expect(gameDefinitions.get(id)?.rarity).toBe(definition.rarity);
      expect(gameDefinitions.get(id)?.cost).toBe(definition.cost);
    }
  });

  it("includes all 16 cards in the normal pack and keeps themed pack pools valid", () => {
    const normal = PACKS.find((pack) => pack.id === "normal")!;
    for (const id of ALPHA_16) expect(normal.cardPool).toContain(id);
    for (const pack of PACKS) {
      expect(new Set(pack.cardPool).size).toBe(pack.cardPool.length);
      for (const id of pack.cardPool) expect(CARDS_BY_ID[id], pack.id + ": " + id).toBeDefined();
      const outcome = getRandomCardIdsFromPool(pack.cardPool, 5);
      expect(outcome).toHaveLength(5);
      expect(new Set(outcome).size).toBe(5);
    }
  });

  it("purchases all 16 cards with Premium and stores the new serial instances", () => {
    useGameStore.setState({ premium: 200_000, ownedCards: [], cardSerials: {} });
    for (const id of ALPHA_16) {
      const result = useGameStore.getState().purchaseMarketCard(id, "serial");
      if (!result.ok) throw new Error("Cannot purchase " + id + ": " + result.reason);
      expect(result.card.baseId).toBe(id);
      expect(getDefinitionIdByUniqueId(result.card.instanceId)).toBe(id);
      expect(useGameStore.getState().ownedCards.some((owned) => owned.instanceId === result.card.instanceId)).toBe(true);
    }
    expect(useGameStore.getState().ownedCards).toHaveLength(16);
  });

  it("awards five new registered cards when an actual normal pack is purchased", () => {
    const normal = PACKS.find((pack) => pack.id === "normal")!;
    useGameStore.setState({ coins: 1000, free: 1000, ownedCards: [], cardSerials: {}, pendingPackPurchases: {}, packOpenHistory: {} });
    const session = useGameStore.getState().purchasePack(normal.id, normal.price);
    expect(session).toBeTruthy();
    const issued = useGameStore.getState().openPurchasedPack(session!, normal.id, ALPHA_16.slice(0, 5));
    expect(issued?.map((card) => card.baseId)).toEqual(ALPHA_16.slice(0, 5));
    expect(useGameStore.getState().ownedCards).toHaveLength(5);
  });

  it("resolves Ice Boulders against only two cards, freezing the first survivor", () => {
    const state = createInitialMatchState({ startingPlayerId: "player" });
    const enemyA = instance("conjurer", "enemy", "_a");
    const enemyB = instance("shadow_assassin", "enemy", "_b");
    const enemyC = instance("primordial_tree", "enemy", "_c");
    const playing = { ...state, board: { ...state.board, enemySlots: [enemyA, enemyB, enemyC, null, null] } };
    const done = resolveCardEffects(playing, "player", instance("ice_boulders", "player"), undefined, 0);
    expect(done.board.enemySlots[0]?.currentHealth).toBe(enemyA.currentHealth - 2);
    expect(done.board.enemySlots[1]?.currentHealth).toBe(enemyB.currentHealth - 2);
    expect(done.board.enemySlots[2]?.currentHealth).toBe(enemyC.currentHealth);
    expect(done.board.enemySlots[0]?.statuses).toContain("alpha_frozen");
  });

  it("resolves Revolver within a deterministic one-to-six damage range", () => {
    const state = createInitialMatchState({ startingPlayerId: "player" });
    const resolved = resolveCardEffects(state, "player", instance("revolver", "player"), undefined, 0);
    const damage = state.enemy.hp - resolved.enemy.hp;
    expect(damage).toBeGreaterThanOrEqual(1);
    expect(damage).toBeLessThanOrEqual(6);
  });
});
