export type PackId = "egypt" | "ice" | "void" | "electric" | "flame" | "normal";

export type PackMeta = {
  id: PackId;
  title: string;
  description: string;
  artSrc: string;
  fallbackArtSrc: string;
  price: number;
  cardPool: string[];
};

export const PACKS: PackMeta[] = [
  {
    id: "egypt",
    title: "Египетский пак",
    description: "Карты древних символов, песков, гробниц, миражей и артефактов. Египетский и пустынный пак — один набор.",
    artSrc: "/packs/egypt.png",
    fallbackArtSrc: "/packs/normal.png",
    price: 100,
    cardPool: ["oracle", "caduceus", "sandstorm", "dragon_eye", "amulet_of_old_sage", "time_of_reckoning", "book_knowledge", "buried_obelisk", "caravan_of_the_last_night", "devouring_dune", "dune_scout", "glass_scorpion", "king_of_sand_tombs", "mirage_well", "sun_scarab"],
  },
  {
    id: "ice",
    title: "Ледниковый пак",
    description: "Холодные тактики, контроль темпа и защитные эффекты.",
    artSrc: "/packs/glacier pack.png",
    fallbackArtSrc: "/packs/normal.png",
    price: 100,
    cardPool: ["ice", "titan_eye", "shield_hope", "double_speed", "wood_vines", "tree_of_life", "crystal_of_time", "ice_boulders", "dawnless_winter", "frost_shard", "frozen_pulpit", "frozen_sentinel", "ice_needle", "permafrost_fracture", "queen_of_frost_bridges", "seal_of_white_silence", "snow_wanderer"],
  },
  {
    id: "void",
    title: "Пак Бездны",
    description: "Тёмные эффекты, обратные тактики и карты Бездны.",
    artSrc: "/packs/abyss pack.png",
    fallbackArtSrc: "/packs/normal.png",
    price: 120,
    cardPool: ["warlock", "fifteen_sixteen", "reverse_heart", "shadow_sword", "hyper_night", "reverse", "psychological_disorder", "unrequited_love", "seal_of_forgotten_souls", "brian", "shadow_assassin", "black_archive", "entropy", "king_nem"],
  },
  {
    id: "electric",
    title: "Электрический пак",
    description: "Молнии, перегрузка, электрический урон и карты Феликса.",
    artSrc: "/packs/electric pack.png",
    fallbackArtSrc: "/packs/normal.png",
    price: 100,
    cardPool: ["thunderbolts", "Stun_Gun", "spherical_lightning", "energy_sword", "thunderer", "seventy_one", "felix", "crystal_of_time", "static_pilgrim", "ten_thousand_volts", "arc_snare", "charge_spike", "last_city_conductor", "meridian_arc_spear", "prism_felix", "spark_beetle", "storm_raptor", "stormborn_crown", "stormglass_relay"],
  },
  {
    id: "flame",
    title: "Огненный пак",
    description: "Огонь, свет, давление и разрушительные атаки.",
    artSrc: "/packs/flame pack.png",
    fallbackArtSrc: "/packs/normal.png",
    price: 100,
    cardPool: ["fire", "excalibur", "phoenix_feather", "hand_of_god", "legendary_messenger", "valkyrie", "ashen_blade", "ashen_halo", "ember_imp", "fire_raven", "furnace_breath", "heart_of_the_caldera", "lava", "reliquary_of_the_war_sun", "volcano"],
  },
  {
    id: "normal",
    title: "Обычный пак",
    description: "Смешанный набор карт для пополнения инвентаря и колоды.",
    artSrc: "/packs/normal.png",
    fallbackArtSrc: "/packs/egypt.png",
    price: 80,
    cardPool: ["energy_sword", "sandstorm", "shadow_sword", "magician", "elven_sword", "hunter", "spherical_lightning", "valkyrie", "thunderer", "thunderbolts", "warlock", "excalibur", "fire", "ice", "brian", "sam", "felix", "hand_of_god", "seventy_one", "time_of_reckoning", "dragon_eye", "wood_vines", "tree_of_life", "caduceus", "book_knowledge", "oracle", "reverse_heart", "double_speed", "reverse", "fifteen_sixteen", "crystal_of_time", "phoenix_feather", "amulet_of_old_sage", "hyper_night", "shield_hope", "legendary_messenger", "seal_of_forgotten_souls", "psychological_disorder", "unrequited_love", "armor_of_chaos", "titan_eye", "Stun_Gun", "elite_knight", "hero_silhouette", "healing", "prime", "clean_sheet", "tsunami", "ice_boulders", "omega", "origin_shard", "oreon", "spear_tribesman", "conjurer", "revolver", "shadow_assassin", "static_pilgrim", "ten_thousand_volts", "king_peleus", "betrayal", "velvet_tide", "primordial_tree", "black_archive", "dawnless_winter", "ashen_blade", "ashen_halo", "ember_imp", "fire_raven", "furnace_breath", "heart_of_the_caldera", "lava", "reliquary_of_the_war_sun", "volcano", "frost_shard", "frozen_pulpit", "frozen_sentinel", "ice_needle", "permafrost_fracture", "queen_of_frost_bridges", "seal_of_white_silence", "snow_wanderer", "arc_snare", "charge_spike", "last_city_conductor", "meridian_arc_spear", "prism_felix", "spark_beetle", "storm_raptor", "stormborn_crown", "stormglass_relay", "buried_obelisk", "caravan_of_the_last_night", "devouring_dune", "dune_scout", "glass_scorpion", "king_of_sand_tombs", "mirage_well", "sun_scarab", "entropy", "king_nem", "ray_of_creation", "wardens_hourglass"],
  },
];

export function getPackById(id?: string | null) {
  const normalizedId = id === "abyss" ? "void" : id === "desert" ? "egypt" : id;
  return PACKS.find((pack) => pack.id === normalizedId) ?? PACKS.find((pack) => pack.id === "normal") ?? PACKS[0];
}
