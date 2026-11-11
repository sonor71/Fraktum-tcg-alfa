import { afterEach, describe, expect, it } from "vitest";
import { CARDS, CARDS_BY_ID } from "../cards";
import { CARD_IDENTITIES, createUniqueCardId, getDefinitionIdByUniqueId } from "../cardIdentity";
import { getWillCostByRarity } from "../rarityWillCost";
import { getMarketCardPrice, useGameStore } from "../../useGameStore";
import { SEASON_CARD_ARTWORK } from "../../data/seasonCardArtwork";
import { PACKS } from "../../data/packs";
import type { CardRarity } from "../types";

/** Correct tiers are cross-checked with the uploaded contact sheet.
 * Primary table records and the author's Forgotten Ray override are authoritative.
 * Remainder is an explicit color-coded-art inference pending author signoff.
 */
const EXPECTED: Record<CardRarity, readonly string[]> = {
  forgotten: ["ray_of_creation"],
  exotic: ["entropy", "prism_felix"],
  legendary: [
    "king_nem", "king_of_sand_tombs", "buried_obelisk",
    "queen_of_frost_bridges", "stormborn_crown", "meridian_arc_spear",
    "heart_of_the_caldera", "reliquary_of_the_war_sun",
  ],
  mythic: ["last_city_conductor", "ashen_halo"],
  epic: [
    "caravan_of_the_last_night", "wardens_hourglass",
    "frozen_pulpit", "seal_of_white_silence",
    "storm_raptor", "stormglass_relay", "volcano",
  ],
  rare: [
    "devouring_dune", "mirage_well", "glass_scorpion",
    "permafrost_fracture", "frozen_sentinel", "arc_snare",
    "lava", "fire_raven", "ashen_blade",
  ],
  common: [
    "sun_scarab", "dune_scout", "ice_needle",
    "snow_wanderer", "frost_shard", "charge_spike",
    "spark_beetle", "furnace_breath", "ember_imp",
  ],
  chromatic: [], divine: [], archaic: [],
};

describe("season rarity migration: all 38 cards", () => {
  afterEach(() => useGameStore.getState().resetProgress());

  it("assigns the correct visual tier to 38 cards without missing or duplicate IDs", () => {
    const list = Object.entries(EXPECTED).flatMap(([rarity, ids]) => ids.map(id => ({ id, rarity })));
    expect(list).toHaveLength(38);
    expect(new Set(list.map(item => item.id)).size).toBe(38);
    expect(new Set(SEASON_CARD_ARTWORK.map(item => item.id))).toEqual(new Set(list.map(item => item.id)));

    for (const { id, rarity } of list) {
      const entry = SEASON_CARD_ARTWORK.find(card => card.id === id);
      expect(entry?.visualRarity).toBe(rarity);
      expect(CARDS_BY_ID[id]?.rarity).toBe(rarity);
      expect(CARDS_BY_ID[id]?.cost).toBe(getWillCostByRarity(rarity));
      expect(CARD_IDENTITIES[id]?.rarity).toBeTruthy();
    }
  });

  it("preserves the 7 verified sheet tiers, records the user correction and labels 30 inferences", () => {
    const source = SEASON_CARD_ARTWORK.filter(card => card.rarityEvidence === "primary_sheet");
    const creator = SEASON_CARD_ARTWORK.filter(card => card.rarityEvidence === "user_confirmed");
    const inferred = SEASON_CARD_ARTWORK.filter(card => card.rarityEvidence === "art_border");
    expect([source.length, creator.length, inferred.length]).toEqual([7, 1, 30]);
    for (const item of source) expect(item.visualRarity).toBe(item.sourceRarity);
    expect(creator.map(card => card.id)).toEqual(["ray_of_creation"]);
    for (const card of inferred) expect(card.sourceRarity).toBeNull();
  });

  it("puts Forgotten Ray at 9 Will, keeps proper collectible price and Russian search title", () => {
    const ray = CARDS_BY_ID.ray_of_creation;
    expect(ray.rarity).toBe("forgotten");
    expect(ray.cost).toBe(9);
    expect(ray.ruTitle).toBe("Луч мироздания");
    expect(CARD_IDENTITIES.ray_of_creation.rarity).toBe("забытая");
    expect(CARD_IDENTITIES.ray_of_creation.ruName).toBe("Луч мироздания");
    expect(getMarketCardPrice(ray.rarity)).toBe(22000);
    expect(PACKS.find(pack => pack.id === "normal")?.cardPool).toContain(ray.id);
  });

  it("keeps each card in packs, and can buy a corrected Forgotten Ray", () => {
    for (const card of SEASON_CARD_ARTWORK) {
      expect(CARDS.some(entry => entry.id === card.id)).toBe(true);
      expect(PACKS.find(pack => pack.id === card.proposedPack)?.cardPool).toContain(card.id);
      expect(PACKS.find(pack => pack.id === "normal")?.cardPool).toContain(card.id);
      const serialId = createUniqueCardId(card.id, 42);
      expect(getDefinitionIdByUniqueId(serialId)).toBe(card.id);
    }
    useGameStore.setState({ premium: 100_000, ownedCards: [], cardSerials: {} });
    const purchase = useGameStore.getState().purchaseMarketCard("ray_of_creation");
    expect(purchase.ok).toBe(true);
    if (!purchase.ok) return;
    expect(purchase.price).toBe(22000);
    expect(purchase.card.rarity).toBe("forgotten");
    expect(purchase.card.cost).toBe(9);
    expect(purchase.card.marketValue).toBe(22000);
  });
});
