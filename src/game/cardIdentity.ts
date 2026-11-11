import { SEASON_CARD_ARTWORK } from "../data/seasonCardArtwork";
export type CardIdentity = {
  definitionId: string;
  ruName: string;
  enName: string;
  image: string;
  rarity: string;
  code: string;
  number: number;
};

export const CARD_IDENTITIES: Record<string, CardIdentity> = {

  energy_sword: {
    definitionId: "energy_sword",
    ruName: "Энергетический меч",
    enName: "Energy Sword",
    image: "/cards/energy-sword.png",
    rarity: "редкая",
    code: "ENS",
    number: 31,
  },

  sandstorm: {
    definitionId: "sandstorm",
    ruName: "Песчаная буря",
    enName: "Sandstorm",
    image: "/cards/sandstorm.png",
    rarity: "редкая",
    code: "SND",
    number: 15,
  },

  shadow_sword: {
    definitionId: "shadow_sword",
    ruName: "Теневой меч",
    enName: "Shadow Sword",
    image: "/cards/shadow-sword.png",
    rarity: "обычная",
    code: "SHS",
    number: 21,
  },

  magician: {
    definitionId: "magician",
    ruName: "Маг",
    enName: "Magician",
    image: "/cards/the magician.png",
    rarity: "обычная",
    code: "MAG",
    number: 26,
  },

  elven_sword: {
    definitionId: "elven_sword",
    ruName: "Эльфийский меч",
    enName: "Elven Sword",
    image: "/cards/The Elven Sword.png",
    rarity: "редкая",
    code: "EFS",
    number: 27,
  },

  hunter: {
    definitionId: "hunter",
    ruName: "Охотник",
    enName: "Hunter",
    image: "/cards/hunter.png",
    rarity: "обычная",
    code: "HNT",
    number: 28,
  },

  spherical_lightning: {
    definitionId: "spherical_lightning",
    ruName: "Шаровая молния",
    enName: "Spherical Lightning",
    image: "/cards/Spherical Lightning.png",
    rarity: "экзотическая",
    code: "LBL",
    number: 35,
  },

  valkyrie: {
    definitionId: "valkyrie",
    ruName: "Валькирия",
    enName: "Valkyrie",
    image: "/cards/Valkyrie.png",
    rarity: "обычная",
    code: "VLK",
    number: 40,
  },

  thunderer: {
    definitionId: "thunderer",
    ruName: "Громовержец",
    enName: "Thunderer",
    image: "/cards/Thunderer.png",
    rarity: "мифическая",
    code: "THD",
    number: 41,
  },

  thunderbolts: {
    definitionId: "thunderbolts",
    ruName: "Раскаты молний",
    enName: "Thunderbolts",
    image: "/cards/thunderbolts.png",
    rarity: "обычная",
    code: "THN",
    number: 44,
  },

  warlock: {
    definitionId: "warlock",
    ruName: "Варлок",
    enName: "Warlock",
    image: "/cards/WARLOCK.png",
    rarity: "мифическая",
    code: "WRL",
    number: 46,
  },

  excalibur: {
    definitionId: "excalibur",
    ruName: "Экскалибур",
    enName: "Excalibur",
    image: "/cards/Excalibur.png",
    rarity: "экзотическая",
    code: "EXC",
    number: 47,
  },

  fire: {
    definitionId: "fire",
    ruName: "Огонь",
    enName: "Fire",
    image: "/cards/fire.png",
    rarity: "обычная",
    code: "FIR",
    number: 48,
  },

  ice: {
    definitionId: "ice",
    ruName: "Лёд",
    enName: "Ice",
    image: "/cards/ice.png",
    rarity: "обычная",
    code: "ICE",
    number: 49,
  },

  brian: {
    definitionId: "brian",
    ruName: "Брайан",
    enName: "Brian",
    image: "/cards/Brian.png",
    rarity: "легендарная",
    code: "BRN",
    number: 22,
  },

  sam: {
    definitionId: "sam",
    ruName: "Сэм",
    enName: "Sam",
    image: "/cards/SAM.png",
    rarity: "эпическая",
    code: "SAM",
    number: 32,
  },

  felix: {
    definitionId: "felix",
    ruName: "Феликс",
    enName: "Felix",
    image: "/cards/Felix.png",
    rarity: "легендарная",
    code: "FLX",
    number: 33,
  },

  hand_of_god: {
    definitionId: "hand_of_god",
    ruName: "Рука Бога",
    enName: "Hand of God",
    image: "/cards/The Hand of God.png",
    rarity: "божественная",
    code: "HOG",
    number: 34,
  },

  seventy_one: {
    definitionId: "seventy_one",
    ruName: "71",
    enName: "Seventy One",
    image: "/cards/seventy-one.png",
    rarity: "Эпическая",
    code: "SVN",
    number: 71,
  },

  time_of_reckoning: {
    definitionId: "time_of_reckoning",
    ruName: "Время расплаты",
    enName: "Time of Reckoning",
    image: "/cards/time-of-reckoning.png",
    rarity: "хроматическая",
    code: "TOR",
    number: 19,
  },

  dragon_eye: {
    definitionId: "dragon_eye",
    ruName: "Драконий глаз",
    enName: "Dragon Eye",
    image: "/cards/dragon-eye.png",
    rarity: "эпическая",
    code: "DRE",
    number: 12,
  },

  wood_vines: {
    definitionId: "wood_vines",
    ruName: "Древесные лозы",
    enName: "Wood Vines",
    image: "/cards/wood-vines.png",
    rarity: "обычная",
    code: "WLV",
    number: 13,
  },

  tree_of_life: {
    definitionId: "tree_of_life",
    ruName: "Древо жизни",
    enName: "Tree of Life",
    image: "/cards/tree-of-life.png",
    rarity: "легендарная",
    code: "TOL",
    number: 18,
  },

  caduceus: {
    definitionId: "caduceus",
    ruName: "Кадуцей",
    enName: "Caduceus",
    image: "/cards/Caduceus.png",
    rarity: "обычная",
    code: "CAD",
    number: 31,
  },

  book_knowledge: {
    definitionId: "book_knowledge",
    ruName: "Книга знаний",
    enName: "Book Knowledge",
    image: "/cards/book-knowledge.png",
    rarity: "редкая",
    code: "BOK",
    number: 37,
  },

  oracle: {
    definitionId: "oracle",
    ruName: "Оракул",
    enName: "Oracle",
    image: "/cards/oracle.png",
    rarity: "легендарная",
    code: "ORC",
    number: 4,
  },

  reverse_heart: {
    definitionId: "reverse_heart",
    ruName: "Реверсивное сердце",
    enName: "Reverse Heart",
    image: "/cards/reverse-heart.png",
    rarity: "мифическая",
    code: "RVH",
    number: 17,
  },

  double_speed: {
    definitionId: "double_speed",
    ruName: "2X",
    enName: "2X",
    image: "/cards/double-speed.png",
    rarity: "редкая",
    code: "DBL",
    number: 9,
  },

  reverse: {
    definitionId: "reverse",
    ruName: "Реверс",
    enName: "Reverse",
    image: "/cards/REVERSE.png",
    rarity: "хроматическая",
    code: "RVS",
    number: 30,
  },

  fifteen_sixteen: {
    definitionId: "fifteen_sixteen",
    ruName: "15-16",
    enName: "15-16",
    image: "/cards/roulette of fate.png",
    rarity: "легендарная",
    code: "FST",
    number: 45,
  },

  crystal_of_time: {
    definitionId: "crystal_of_time",
    ruName: "Кристалл времени",
    enName: "Crystal of Time",
    image: "/cards/THE CRYSTAL OF TIME.png",
    rarity: "хроматическая",
    code: "TMC",
    number: 23,
  },

  phoenix_feather: {
    definitionId: "phoenix_feather",
    ruName: "Перо Феникса",
    enName: "Phoenix Feather",
    image: "/cards/Phoenix feather.png",
    rarity: "легендарная",
    code: "PHF",
    number: 42,
  },

  amulet_of_old_sage: {
    definitionId: "amulet_of_old_sage",
    ruName: "Амулет Старого Мудреца",
    enName: "Amulet of Old Sage",
    image: "/cards/amulet-of-old-sage.png",
    rarity: "мифическая",
    code: "AOS",
    number: 25,
  },

  hyper_night: {
    definitionId: "hyper_night",
    ruName: "Гиперночь",
    enName: "Hyper Night",
    image: "/cards/hyper-night.png",
    rarity: "хроматическая",
    code: "HYN",
    number: 7,
  },

  shield_hope: {
    definitionId: "shield_hope",
    ruName: "Щит Надежды",
    enName: "Shield of Hope",
    image: "/cards/shield-hope.png",
    rarity: "эпическая",
    code: "SOH",
    number: 14,
  },

  legendary_messenger: {
    definitionId: "legendary_messenger",
    ruName: "Легендарный Вестник",
    enName: "Legendary Messenger",
    image: "/cards/Legendary Messenger.png",
    rarity: "легендарная",
    code: "LGV",
    number: 24,
  },

  seal_of_forgotten_souls: {
    definitionId: "seal_of_forgotten_souls",
    ruName: "Печать Забытых Душ",
    enName: "Seal of the Forgotten Souls",
    image: "/cards/Seal of the Forgotten Souls.png",
    rarity: "мифическая",
    code: "SFS",
    number: 29,
  },

  psychological_disorder: {
    definitionId: "psychological_disorder",
    ruName: "Психологическое расстройство",
    enName: "Psychological Disorder",
    image: "/cards/psychological disorder.png",
    rarity: "редкая",
    code: "PSD",
    number: 36,
  },

  unrequited_love: {
    definitionId: "unrequited_love",
    ruName: "Безответная любовь",
    enName: "Unrequited Love",
    image: "/cards/INREQUITED LOVE.png",
    rarity: "эпическая",
    code: "URL",
    number: 38,
  },

  armor_of_chaos: {
    definitionId: "armor_of_chaos",
    ruName: "Броня Хаоса",
    enName: "Armor of Chaos",
    image: "/cards/Armor of chaos.png",
    rarity: "мифическая",
    code: "CHA",
    number: 39,
  },

  titan_eye: {
    definitionId: "titan_eye",
    ruName: "Глаз Титана",
    enName: "Titan Eye",
    image: "/cards/eye titan.png",
    rarity: "мифическая",
    code: "TTE",
    number: 43,
  },

Stun_Gun: {
    definitionId: "Stun_Gun",
    ruName: "Электрошокер",
    enName: "Stun Gun",
    image: "/cards/Stun Gun.png",
    rarity: "легендарная",
    code: "SGU",
    number: 50,
  },

  elite_knight: {
    definitionId: "elite_knight",
    ruName: "Элитный рыцарь",
    enName: "Elite Knight",
    image: "/cards/fraktum-new/elite_knight.png",
    rarity: "эпическая",
    code: "EKN",
    number: 51,
  },

  hero_silhouette: {
    definitionId: "hero_silhouette",
    ruName: "Силуэт героя",
    enName: "Hero Silhouette",
    image: "/cards/fraktum-new/hero_silhouette.png",
    rarity: "легендарная",
    code: "HSL",
    number: 52,
  },

  healing: {
    definitionId: "healing",
    ruName: "Исцеление",
    enName: "Healing",
    image: "/cards/fraktum-new/healing.png",
    rarity: "обычная",
    code: "HLG",
    number: 53,
  },

  prime: {
    definitionId: "prime",
    ruName: "Прайм",
    enName: "Prime",
    image: "/cards/fraktum-new/prime.png",
    rarity: "легендарная",
    code: "PRM",
    number: 54,
  },

  clean_sheet: {
    definitionId: "clean_sheet",
    ruName: "Чистый лист",
    enName: "Clean Sheet",
    image: "/cards/fraktum-new/clean_sheet.png",
    rarity: "легендарная",
    code: "CLS",
    number: 55,
  },

  tsunami: {
    definitionId: "tsunami",
    ruName: "Цунами",
    enName: "Tsunami",
    image: "/cards/fraktum-new/tsunami.png",
    rarity: "мифическая",
    code: "TSU",
    number: 56,
  },

  ice_boulders: {
    definitionId: "ice_boulders",
    ruName: "Глыбы льда",
    enName: "Ice Boulders",
    image: "/cards/ICE BOULDERS.png",
    rarity: "редкая",
    code: "IBG",
    number: 57,
  },

  omega: {
    definitionId: "omega",
    ruName: "Омега",
    enName: "Omega",
    image: "/cards/omega.png",
    rarity: "обычная",
    code: "OMG",
    number: 58,
  },

  origin_shard: {
    definitionId: "origin_shard",
    ruName: "Осколок происхождения",
    enName: "Origin Shard",
    image: "/cards/Origin Shard.png",
    rarity: "редкая",
    code: "OSH",
    number: 59,
  },

  oreon: {
    definitionId: "oreon",
    ruName: "Ореон",
    enName: "Oreon",
    image: "/cards/oreon.png",
    rarity: "обычная",
    code: "ORE",
    number: 60,
  },

  spear_tribesman: {
    definitionId: "spear_tribesman",
    ruName: "Туземец с копьём",
    enName: "Spear Tribesman",
    image: "/cards/Spear Tribesman.png",
    rarity: "обычная",
    code: "STB",
    number: 61,
  },

  conjurer: {
    definitionId: "conjurer",
    ruName: "Заклинатель",
    enName: "Conjurer",
    image: "/cards/Conjurer.png",
    rarity: "мифическая",
    code: "CNJ",
    number: 62,
  },

  revolver: {
    definitionId: "revolver",
    ruName: "Револьвер",
    enName: "Revolver",
    image: "/cards/Revolver.png",
    rarity: "обычная",
    code: "RVR",
    number: 63,
  },

  shadow_assassin: {
    definitionId: "shadow_assassin",
    ruName: "Теневой ассасин",
    enName: "Shadow Assassin",
    image: "/cards/Shadow Assassin.png",
    rarity: "мифическая",
    code: "SAS",
    number: 64,
  },

  static_pilgrim: {
    definitionId: "static_pilgrim",
    ruName: "Статический пилигрим",
    enName: "Static Pilgrim",
    image: "/cards/Static Pilgrim.png",
    rarity: "редкая",
    code: "STP",
    number: 65,
  },

  ten_thousand_volts: {
    definitionId: "ten_thousand_volts",
    ruName: "Десять тысяч вольт",
    enName: "Ten Thousand Volts",
    image: "/cards/Ten Thousand Volts.png",
    rarity: "мифическая",
    code: "TTV",
    number: 66,
  },

  king_peleus: {
    definitionId: "king_peleus",
    ruName: "Царь Пелей",
    enName: "King Peleus",
    image: "/cards/King Peleus.png",
    rarity: "эпическая",
    code: "KPL",
    number: 67,
  },

  betrayal: {
    definitionId: "betrayal",
    ruName: "Предательство",
    enName: "Betrayal",
    image: "/cards/Betrayal.png",
    rarity: "редкая",
    code: "BTY",
    number: 68,
  },

  velvet_tide: {
    definitionId: "velvet_tide",
    ruName: "Бархатный прилив",
    enName: "Velvet Tide",
    image: "/cards/Velvet Tide.png",
    rarity: "эпическая",
    code: "VTD",
    number: 69,
  },

  primordial_tree: {
    definitionId: "primordial_tree",
    ruName: "Первородное дерево",
    enName: "Primordial Tree",
    image: "/cards/Primordial Tree.png",
    rarity: "мифическая",
    code: "PDT",
    number: 70,
  },

  black_archive: {
    definitionId: "black_archive",
    ruName: "Чёрный архив",
    enName: "Black Archive",
    image: "/cards/Black Archive.png",
    rarity: "мифическая",
    code: "BAR",
    number: 71,
  },

  dawnless_winter: {
    definitionId: "dawnless_winter",
    ruName: "Зима без рассвета",
    enName: "Dawnless Winter",
    image: "/cards/Dawnless Winter.png",
    rarity: "мифическая",
    code: "DWN",
    number: 72,
  },


  // Series SNV: provisional serial identities for this new season.
  // Different card numbers (101–138) prevent collisions, including when
  // all 38 cards are purchased or pulled from boosters in one session.
  ...Object.fromEntries(SEASON_CARD_ARTWORK.map((card, index) => [card.id, {
    definitionId: card.id,
    ruName: card.title,
    enName: card.title,
    image: card.image,
    rarity: card.sourceRarity ?? "common",
    code: "SNV",
    number: 101 + index,
  } satisfies CardIdentity])),
};


export function createUniqueCardId(definitionId: string, serial: number) {
  const card = CARD_IDENTITIES[definitionId];

  if (!card) {
    throw new Error(`Unknown card definitionId: ${definitionId}`);
  }

  const number = String(card.number).padStart(3, "0");
  const serialText = String(serial).padStart(6, "0");

  return `${card.code}-${number}-${serialText}`;
}

export function getDefinitionIdByUniqueId(uniqueId: string) {
  const [code, numberText] = uniqueId.split("-");
  const number = Number(numberText);

  return (
    Object.values(CARD_IDENTITIES).find((card) => card.code === code && card.number === number)?.definitionId ?? null
  );
}
