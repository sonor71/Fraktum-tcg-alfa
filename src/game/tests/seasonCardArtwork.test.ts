import { describe, expect, it } from "vitest";
import { readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { CARDS_BY_ID } from "../cards";
import { getWillCostByRarity } from "../rarityWillCost";
import { SEASON_CARD_ARTWORK, SEASON_CANDIDATE_POOLS } from "../../data/seasonCardArtwork";

const cardFolder = resolve(process.cwd(), "public/cards/fraktum-new");
const preExisting = new Set([
  "clean_sheet.png", "elite_knight.png", "healing.png",
  "hero_silhouette.png", "prime.png", "tsunami.png",
]);

describe("2026 uploaded season art integrity", () => {
  it("lists exactly the 38 new PNGs, with no omitted assets", () => {
    const uploaded = readdirSync(cardFolder).filter((name) =>
      name.toLowerCase().endsWith(".png") && !preExisting.has(name)).sort();
    const registered = SEASON_CARD_ARTWORK.map((card) => decodeURIComponent(card.image.split("/").pop() ?? "")).sort();
    expect(registered).toEqual(uploaded);
    expect(SEASON_CARD_ARTWORK).toHaveLength(38);
  });

  it("references existing PNG paths with unique IDs", () => {
    expect(new Set(SEASON_CARD_ARTWORK.map((card) => card.id)).size).toBe(SEASON_CARD_ARTWORK.length);
    expect(new Set(SEASON_CARD_ARTWORK.map((card) => card.image)).size).toBe(SEASON_CARD_ARTWORK.length);
    for (const card of SEASON_CARD_ARTWORK) {
      expect(card.image).toMatch(/^\/cards\/fraktum-new\/[^/]+\.png$/);
      expect(existsSync(resolve(process.cwd(), "public", card.image.slice(1)))).toBe(true);
    }
  });

  it("stages every new artwork in exactly one candidate pack", () => {
    const poolIds = Object.values(SEASON_CANDIDATE_POOLS).flat();
    expect(poolIds).toHaveLength(38);
    expect(new Set(poolIds).size).toBe(38);
    expect(new Set(poolIds)).toEqual(new Set(SEASON_CARD_ARTWORK.map((card) => card.id)));
  });

  it("registers all season art in the live catalog with explicitly temporary mechanics", () => {
    for (const art of SEASON_CARD_ARTWORK) {
      const gameplayCard = CARDS_BY_ID[art.id];
      expect(art.status).toBe("playable_temporary_balance");
      expect(gameplayCard).toBeDefined();
      expect(gameplayCard.image).toBe(art.image);
      expect(gameplayCard.description).toContain("ТЕСТОВЫЕ ПАРАМЕТРЫ");
      expect(gameplayCard.effectKey).toBe("season_basic_v1");
      if (art.sourceRow == null) {
        expect(art.sourceRarity).toBeNull();
        expect(art.rarityEvidence).toBe(art.id === "ray_of_creation" ? "user_confirmed" : "art_border");
        expect(gameplayCard.rarity).toBe(art.visualRarity);
      } else {
        expect(art.rarityEvidence).toBe("primary_sheet");
        expect(gameplayCard.rarity).toBe(art.sourceRarity);
      }
      expect(gameplayCard.rarity).toBe(art.visualRarity);
      expect(gameplayCard.cost).toBe(getWillCostByRarity(art.visualRarity));
    }
  });

  it("keeps known primary-sheet rarities without copying unapproved balance v2 proposals", () => {
    const known = Object.fromEntries(SEASON_CARD_ARTWORK.filter((card) => card.sourceRarity)
      .map((card) => [card.id, card.sourceRarity]));
    expect(known).toEqual({
      ashen_halo: "mythic", last_city_conductor: "mythic",
      meridian_arc_spear: "legendary", prism_felix: "exotic",
      reliquary_of_the_war_sun: "legendary",
      stormglass_relay: "epic", entropy: "exotic",
    });
  });
});
