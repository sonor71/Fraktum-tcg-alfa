import { afterEach, describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { CARDS, CARDS_BY_ID, getRandomCardIdsFromPool } from "../cards";
import { CARD_IDENTITIES, createUniqueCardId, getDefinitionIdByUniqueId } from "../cardIdentity";
import { getWillCostByRarity } from "../rarityWillCost";
import { matchesMarketCardSearch } from "../marketCatalog";
import { loadCardDefinitions } from "../data/cards";
import { PACKS } from "../../data/packs";
import { SEASON_CARD_ARTWORK } from "../../data/seasonCardArtwork";
import { useGameStore } from "../../useGameStore";

const ART = [...SEASON_CARD_ARTWORK];
const PACK_GROUPS = ["flame", "ice", "electric", "desert", "void", "normal"] as const;

describe("38 new FRAKTUM season cards: live market, booster and match registration", () => {
  afterEach(() => useGameStore.getState().resetProgress());

  it("makes every card visible in market and available to the game engine", () => {
    const engine = new Map(loadCardDefinitions().map(card => [card.id, card]));
    expect(ART).toHaveLength(38);
    expect(CARDS).toHaveLength(102); // 64 existing + 38 new
    for (const art of ART) {
      const card = CARDS_BY_ID[art.id];
      expect(card, art.title).toBeDefined();
      expect(card.title).toBe(art.title);
      expect(card.image).toBe(art.image);
      expect(card.cost).toBe(getWillCostByRarity(card.rarity));
      expect(card.description).toMatch(/ТЕСТОВЫЕ ПАРАМЕТРЫ/);
      expect(matchesMarketCardSearch(card, art.title)).toBe(true);
      expect(existsSync(resolve("public", card.image.slice(1)))).toBe(true);
      expect(engine.get(art.id)?.image).toBe(card.image);
      expect(engine.get(art.id)?.attack).toBe(card.attack);
    }
  });

  it("issues collision-free serial identities for every card", () => {
    const ids = new Set<string>();
    for (const art of ART) {
      const identity = CARD_IDENTITIES[art.id];
      expect(identity).toBeDefined();
      expect(identity.definitionId).toBe(art.id);
      expect(identity.image).toBe(art.image);
      const unique = createUniqueCardId(art.id, 1);
      expect(getDefinitionIdByUniqueId(unique)).toBe(art.id);
      expect(ids.has(unique)).toBe(false);
      ids.add(unique);
    }
  });

  it("distributes every artwork to its thematic booster and the mixed normal pack", () => {
    const all = PACKS.find(pack => pack.id === "normal");
    expect(all).toBeDefined();
    const desert = PACKS.find(pack => pack.id === "desert");
    expect(desert?.title).toBe("Пустынный пак");
    expect(desert?.cardPool.length).toBeGreaterThanOrEqual(8);

    for (const pack of PACKS) {
      expect(new Set(pack.cardPool).size).toBe(pack.cardPool.length);
      for (const id of pack.cardPool) expect(CARDS_BY_ID[id], pack.id + ":" + id).toBeDefined();
      const drawn = getRandomCardIdsFromPool(pack.cardPool, 5);
      expect(drawn).toHaveLength(5);
      expect(new Set(drawn).size).toBe(5);
    }
    for (const card of ART) {
      const themed = PACKS.find(pack => pack.id === card.proposedPack);
      expect(themed?.cardPool).toContain(card.id);
      expect(all?.cardPool).toContain(card.id);
    }
    for (const kind of PACK_GROUPS) {
      expect(PACKS.find(pack => pack.id === kind)).toBeDefined();
    }
  });

  it("actually buys each of the 38 unique cards and adds them to the inventory", () => {
    useGameStore.setState({ premium: 1_000_000, ownedCards: [], cardSerials: {} });
    for (const art of ART) {
      const purchase = useGameStore.getState().purchaseMarketCard(art.id, "serial");
      if (!purchase.ok) throw Error(art.title + ": " + purchase.reason);
      expect(purchase.card.baseId).toBe(art.id);
      expect(getDefinitionIdByUniqueId(purchase.card.instanceId)).toBe(art.id);
      expect(purchase.card.frontSrc).toBe(art.image);
      expect(purchase.card.description).toContain("ТЕСТОВЫЕ ПАРАМЕТРЫ");
    }
    expect(useGameStore.getState().ownedCards).toHaveLength(38);
  });

  it("sells and opens a Desert booster, delivering five matching cards", () => {
    const desert = PACKS.find(pack => pack.id === "desert")!;
    const chosen = desert.cardPool.slice(0, 5);
    useGameStore.setState({ coins: 1000, free: 1000, cardSerials: {},
      ownedCards: [], pendingPackPurchases: {}, packOpenHistory: {} });
    const session = useGameStore.getState().purchasePack("desert", desert.price);
    expect(session).toBeTruthy();
    const earned = useGameStore.getState().openPurchasedPack(session!, "desert", chosen);
    expect(earned?.map(card => card.baseId)).toEqual(chosen);
    expect(earned).toHaveLength(5);
    for (const card of earned ?? []) {
      expect(card.packId).toBe("desert");
      expect(getDefinitionIdByUniqueId(card.instanceId)).toBe(card.baseId);
    }
    expect(useGameStore.getState().ownedCards).toHaveLength(5);
  });
});
