/**
 * FRAKTUM upcoming season: VERIFIED uploaded artwork, with PROPOSED pack groupings.
 *
 * This is intentionally NOT the playable CARDS catalog, and NOT the live PACKS pool.
 * No effects, damage, HP, or missing rarities are invented. Upgrade a card into
 * src/data/cards.json only after its authoritative gameplay specs are approved.
 *
 * Images: public/cards/fraktum-new (main, 2026-11-11).
 * Some rarities match the user's "Лист1" source table, see sourceRow.
 */
import type { CardRarity } from "../game/types";

export type SeasonPackCandidate = "flame" | "ice" | "electric" | "desert" | "void" | "normal";

export type SeasonCardArtwork = {
  id: string;
  title: string;
  image: string;
  proposedPack: SeasonPackCandidate;
  /** Null means the authoritative rarity has not been located or approved. */
  sourceRarity: CardRarity | null;
  /** 1-indexed row in the primary "Лист1" of the 131-card source, when verified. */
  sourceRow: number | null;
  status: "art_uploaded_pending_gameplay_specs";
};

export const SEASON_CARD_ARTWORK: readonly SeasonCardArtwork[] = [
  { id: "ashen_blade", title: "Ashen Blade", image: "/cards/fraktum-new/Ashen Blade.png", proposedPack: "flame", sourceRarity: null, sourceRow: null, status: "art_uploaded_pending_gameplay_specs" },
  { id: "ashen_halo", title: "Ashen Halo", image: "/cards/fraktum-new/Ashen Halo.png", proposedPack: "flame", sourceRarity: "mythic", sourceRow: 93, status: "art_uploaded_pending_gameplay_specs" },
  { id: "ember_imp", title: "Ember imp", image: "/cards/fraktum-new/Ember imp.png", proposedPack: "flame", sourceRarity: null, sourceRow: null, status: "art_uploaded_pending_gameplay_specs" },
  { id: "fire_raven", title: "Fire Raven", image: "/cards/fraktum-new/Fire Raven.png", proposedPack: "flame", sourceRarity: null, sourceRow: null, status: "art_uploaded_pending_gameplay_specs" },
  { id: "furnace_breath", title: "furnace breath", image: "/cards/fraktum-new/furnace breath.png", proposedPack: "flame", sourceRarity: null, sourceRow: null, status: "art_uploaded_pending_gameplay_specs" },
  { id: "heart_of_the_caldera", title: "Heart of the Caldera", image: "/cards/fraktum-new/Heart of the Caldera.png", proposedPack: "flame", sourceRarity: null, sourceRow: null, status: "art_uploaded_pending_gameplay_specs" },
  { id: "lava", title: "Lava", image: "/cards/fraktum-new/Lava.png", proposedPack: "flame", sourceRarity: null, sourceRow: null, status: "art_uploaded_pending_gameplay_specs" },
  { id: "reliquary_of_the_war_sun", title: "Reliquary of the War Sun", image: "/cards/fraktum-new/Reliquary of the War Sun.png", proposedPack: "flame", sourceRarity: "legendary", sourceRow: 77, status: "art_uploaded_pending_gameplay_specs" },
  { id: "volcano", title: "Volcano", image: "/cards/fraktum-new/Volcano.png", proposedPack: "flame", sourceRarity: null, sourceRow: null, status: "art_uploaded_pending_gameplay_specs" },
  { id: "frost_shard", title: "Frost Shard", image: "/cards/fraktum-new/Frost Shard.png", proposedPack: "ice", sourceRarity: null, sourceRow: null, status: "art_uploaded_pending_gameplay_specs" },
  { id: "frozen_pulpit", title: "Frozen Pulpit", image: "/cards/fraktum-new/Frozen Pulpit.png", proposedPack: "ice", sourceRarity: null, sourceRow: null, status: "art_uploaded_pending_gameplay_specs" },
  { id: "frozen_sentinel", title: "Frozen Sentinel", image: "/cards/fraktum-new/Frozen Sentinel.png", proposedPack: "ice", sourceRarity: null, sourceRow: null, status: "art_uploaded_pending_gameplay_specs" },
  { id: "ice_needle", title: "Ice Needle", image: "/cards/fraktum-new/Ice Needle.png", proposedPack: "ice", sourceRarity: null, sourceRow: null, status: "art_uploaded_pending_gameplay_specs" },
  { id: "permafrost_fracture", title: "Permafrost Fracture", image: "/cards/fraktum-new/Permafrost Fracture.png", proposedPack: "ice", sourceRarity: null, sourceRow: null, status: "art_uploaded_pending_gameplay_specs" },
  { id: "queen_of_frost_bridges", title: "Queen of Frost Bridges", image: "/cards/fraktum-new/Queen of Frost Bridges.png", proposedPack: "ice", sourceRarity: null, sourceRow: null, status: "art_uploaded_pending_gameplay_specs" },
  { id: "seal_of_white_silence", title: "Seal of White Silence", image: "/cards/fraktum-new/Seal of White Silence.png", proposedPack: "ice", sourceRarity: null, sourceRow: null, status: "art_uploaded_pending_gameplay_specs" },
  { id: "snow_wanderer", title: "Snow Wanderer", image: "/cards/fraktum-new/Snow Wanderer.png", proposedPack: "ice", sourceRarity: null, sourceRow: null, status: "art_uploaded_pending_gameplay_specs" },
  { id: "arc_snare", title: "Arc Snare", image: "/cards/fraktum-new/Arc Snare.png", proposedPack: "electric", sourceRarity: null, sourceRow: null, status: "art_uploaded_pending_gameplay_specs" },
  { id: "charge_spike", title: "Charge Spike", image: "/cards/fraktum-new/Charge Spike.png", proposedPack: "electric", sourceRarity: null, sourceRow: null, status: "art_uploaded_pending_gameplay_specs" },
  { id: "last_city_conductor", title: "Last City Conductor", image: "/cards/fraktum-new/Last City Conductor.png", proposedPack: "electric", sourceRarity: "mythic", sourceRow: 94, status: "art_uploaded_pending_gameplay_specs" },
  { id: "meridian_arc_spear", title: "Meridian Arc Spear", image: "/cards/fraktum-new/Meridian Arc Spear.png", proposedPack: "electric", sourceRarity: "legendary", sourceRow: 74, status: "art_uploaded_pending_gameplay_specs" },
  { id: "prism_felix", title: "Prism Felix", image: "/cards/fraktum-new/Prism Felix.png", proposedPack: "electric", sourceRarity: "exotic", sourceRow: 112, status: "art_uploaded_pending_gameplay_specs" },
  { id: "spark_beetle", title: "Spark Beetle", image: "/cards/fraktum-new/Spark Beetle.png", proposedPack: "electric", sourceRarity: null, sourceRow: null, status: "art_uploaded_pending_gameplay_specs" },
  { id: "storm_raptor", title: "Storm Raptor", image: "/cards/fraktum-new/Storm Raptor.png", proposedPack: "electric", sourceRarity: null, sourceRow: null, status: "art_uploaded_pending_gameplay_specs" },
  { id: "stormborn_crown", title: "Stormborn Crown", image: "/cards/fraktum-new/Stormborn Crown.png", proposedPack: "electric", sourceRarity: null, sourceRow: null, status: "art_uploaded_pending_gameplay_specs" },
  { id: "stormglass_relay", title: "Stormglass Relay", image: "/cards/fraktum-new/Stormglass Relay.png", proposedPack: "electric", sourceRarity: "epic", sourceRow: 125, status: "art_uploaded_pending_gameplay_specs" },
  { id: "buried_obelisk", title: "Buried Obelisk", image: "/cards/fraktum-new/Buried Obelisk.png", proposedPack: "desert", sourceRarity: null, sourceRow: null, status: "art_uploaded_pending_gameplay_specs" },
  { id: "caravan_of_the_last_night", title: "Caravan of the Last Night", image: "/cards/fraktum-new/Caravan of the Last Night.png", proposedPack: "desert", sourceRarity: null, sourceRow: null, status: "art_uploaded_pending_gameplay_specs" },
  { id: "devouring_dune", title: "Devouring Dune", image: "/cards/fraktum-new/Devouring Dune.png", proposedPack: "desert", sourceRarity: null, sourceRow: null, status: "art_uploaded_pending_gameplay_specs" },
  { id: "dune_scout", title: "Dune Scout", image: "/cards/fraktum-new/Dune Scout.png", proposedPack: "desert", sourceRarity: null, sourceRow: null, status: "art_uploaded_pending_gameplay_specs" },
  { id: "glass_scorpion", title: "Glass Scorpion", image: "/cards/fraktum-new/Glass Scorpion.png", proposedPack: "desert", sourceRarity: null, sourceRow: null, status: "art_uploaded_pending_gameplay_specs" },
  { id: "king_of_sand_tombs", title: "King of Sand Tombs", image: "/cards/fraktum-new/King of Sand Tombs.png", proposedPack: "desert", sourceRarity: null, sourceRow: null, status: "art_uploaded_pending_gameplay_specs" },
  { id: "mirage_well", title: "Mirage Well", image: "/cards/fraktum-new/Mirage Well.png", proposedPack: "desert", sourceRarity: null, sourceRow: null, status: "art_uploaded_pending_gameplay_specs" },
  { id: "sun_scarab", title: "Sun Scarab", image: "/cards/fraktum-new/Sun Scarab.png", proposedPack: "desert", sourceRarity: null, sourceRow: null, status: "art_uploaded_pending_gameplay_specs" },
  { id: "entropy", title: "Entropy", image: "/cards/fraktum-new/Entropy.png", proposedPack: "void", sourceRarity: "exotic", sourceRow: 113, status: "art_uploaded_pending_gameplay_specs" },
  { id: "king_nem", title: "King NEM", image: "/cards/fraktum-new/King NEM.png", proposedPack: "void", sourceRarity: null, sourceRow: null, status: "art_uploaded_pending_gameplay_specs" },
  { id: "ray_of_creation", title: "Ray of Creation", image: "/cards/fraktum-new/Ray of Creation.png", proposedPack: "normal", sourceRarity: null, sourceRow: null, status: "art_uploaded_pending_gameplay_specs" },
  { id: "wardens_hourglass", title: "Wardens Hourglass", image: "/cards/fraktum-new/Wardens Hourglass.png", proposedPack: "normal", sourceRarity: null, sourceRow: null, status: "art_uploaded_pending_gameplay_specs" },
];

export const SEASON_CANDIDATE_POOLS: Readonly<Record<SeasonPackCandidate, readonly string[]>> = {
  flame: SEASON_CARD_ARTWORK.filter((card) => card.proposedPack === "flame").map((card) => card.id),
  ice: SEASON_CARD_ARTWORK.filter((card) => card.proposedPack === "ice").map((card) => card.id),
  electric: SEASON_CARD_ARTWORK.filter((card) => card.proposedPack === "electric").map((card) => card.id),
  desert: SEASON_CARD_ARTWORK.filter((card) => card.proposedPack === "desert").map((card) => card.id),
  void: SEASON_CARD_ARTWORK.filter((card) => card.proposedPack === "void").map((card) => card.id),
  normal: SEASON_CARD_ARTWORK.filter((card) => card.proposedPack === "normal").map((card) => card.id),
};

export function getSeasonCardArt(id: string) {
  return SEASON_CARD_ARTWORK.find((card) => card.id === id);
}
