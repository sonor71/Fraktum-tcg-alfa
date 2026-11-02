import { afterEach, describe, expect, it } from "vitest";
import { CARDS, CARDS_BY_ID, getRandomCardIdsFromPool } from "../cards";
import { createUniqueCardId, getDefinitionIdByUniqueId, CARD_IDENTITIES } from "../cardIdentity";
import { useGameStore } from "../../useGameStore";
import { matchesMarketCardSearch } from "../marketCatalog";
import { PACKS } from "../../data/packs";

const NEW_CARDS = {
  elite_knight: ["Элитный рыцарь", "Elite Knight"],
  hero_silhouette: ["Силуэт героя", "Hero Silhouette"],
  healing: ["Исцеление", "Healing"],
  prime: ["Прайм", "Prime"],
  clean_sheet: ["Чистый лист", "Clean Sheet"],
  tsunami: ["Цунами", "Tsunami"],
} as const;

describe("new cards in packs and the market catalog", () => {
  it("makes all six cards available in the normal pack and market catalog", () => {
    const normalPool = PACKS.find((pack) => pack.id === "normal")?.cardPool ?? [];
    for (const id of Object.keys(NEW_CARDS)) {
      expect(CARDS_BY_ID[id]).toBeDefined();
      expect(CARDS.some((card) => card.id === id)).toBe(true);
      expect(normalPool).toContain(id);
    }
  });

  it("finds every new card by Russian and English name", () => {
    for (const [id, [russian, english]] of Object.entries(NEW_CARDS)) {
      const definition = CARDS_BY_ID[id];
      expect(definition).toBeDefined();
      expect(matchesMarketCardSearch(definition, russian)).toBe(true);
      expect(matchesMarketCardSearch(definition, english.toLowerCase())).toBe(true);
      expect(matchesMarketCardSearch(definition, id)).toBe(true);
    }
  });

  it("keeps collection search and excludes unrelated names", () => {
    const definition = CARDS_BY_ID.healing;
    expect(matchesMarketCardSearch(definition, "  ")).toBe(true);
    expect(matchesMarketCardSearch(definition, definition.collection)).toBe(true);
    expect(matchesMarketCardSearch(definition, "цУнАмИ")).toBe(false);
  });
});


describe("card catalog, pack issuance and market purchase integration", () => {
  afterEach(() => {
    useGameStore.getState().resetProgress();
  });

  it("has a matching unique identity for every card in the catalog", () => {
    const identityPairs = new Set<string>();
    for (const definition of CARDS) {
      const identity = CARD_IDENTITIES[definition.id];
      expect(identity, `Missing identity for ${definition.id}`).toBeDefined();
      expect(identity.definitionId).toBe(definition.id);
      expect(identity.image).toBe(definition.image);
      const pair = `${identity.code}:${identity.number}`;
      expect(identityPairs.has(pair), `Repeated identity: ${pair}`).toBe(false);
      identityPairs.add(pair);
      const instanceId = createUniqueCardId(definition.id, 1);
      expect(getDefinitionIdByUniqueId(instanceId)).toBe(definition.id);
    }
  });

  it("only lists registered card IDs in all pack pools", () => {
    for (const pack of PACKS) {
      expect(pack.cardPool.length).toBeGreaterThanOrEqual(5);
      expect(new Set(pack.cardPool).size).toBe(pack.cardPool.length);
      for (const id of pack.cardPool) {
        expect(CARDS_BY_ID[id], `Unknown ${id} in pack ${pack.id}`).toBeDefined();
      }
      const selected = getRandomCardIdsFromPool(pack.cardPool, 5);
      expect(selected).toHaveLength(5);
      expect(new Set(selected).size).toBe(5);
      expect(selected.every((id) => pack.cardPool.includes(id))).toBe(true);
    }
    expect(PACKS.find((pack) => pack.id === "electric")?.cardPool).toContain("Stun_Gun");
  });

  it("purchases all six new cards using real market IDs and adds them to inventory", () => {
    useGameStore.setState({ premium: 100000, ownedCards: [], cardSerials: {} });
    for (const id of Object.keys(NEW_CARDS)) {
      const result = useGameStore.getState().purchaseMarketCard(id, "serial");
      if (!result.ok) throw new Error(`Cannot buy ${id}: ${result.reason}`);
      expect(result.card.baseId).toBe(id);
      expect(getDefinitionIdByUniqueId(result.card.instanceId)).toBe(id);
      expect(useGameStore.getState().ownedCards.some((card) => card.instanceId === result.card.instanceId)).toBe(true);
    }
  });

  it("issues new cards from a purchased pack without dropping them from inventory", () => {
    const normal = PACKS.find((pack) => pack.id === "normal");
    expect(normal).toBeDefined();
    const cardIds = Object.keys(NEW_CARDS).slice(0, 5);
    expect(cardIds.every((id) => normal!.cardPool.includes(id))).toBe(true);
    useGameStore.setState({ coins: 1000, free: 1000, ownedCards: [], pendingPackPurchases: {}, packOpenHistory: {}, cardSerials: {} });
    const sessionId = useGameStore.getState().purchasePack("normal", normal!.price);
    expect(sessionId).toBeTruthy();
    const issued = useGameStore.getState().openPurchasedPack(sessionId!, "normal", cardIds);
    expect(issued?.map((card) => card.baseId)).toEqual(cardIds);
    expect(issued).toHaveLength(5);
    for (const card of issued ?? []) {
      expect(getDefinitionIdByUniqueId(card.instanceId)).toBe(card.baseId);
      expect(useGameStore.getState().ownedCards.some((owned) => owned.instanceId === card.instanceId)).toBe(true);
    }
  });
});
