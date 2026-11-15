import { useEffect, useState, type CSSProperties } from "react";
import type { CardDefinition } from "../../game/core/types";

/** PVFX Foundry CC0 (legacy/0.10.0). Frames: 32px, five-column atlas with 34 rows. */
export type PixelVfxKind =
  | "slash" | "fire" | "ice" | "lightning" | "heal" | "shield"
  | "void" | "summon" | "destroy" | "arcane" | "poison"
  | "fire_nova" | "meteor" | "flamethrower" | "ice_wall" | "blizzard" | "freeze" | "ice_spike" | "chain_lightning" | "electric_burst" | "shield_break" | "regen" | "holy" | "crit" | "smash" | "arrow" | "earth_spike" | "vines" | "curse" | "soul_drain" | "smoke" | "stun" | "water" | "wind_blade" | "fate" | "teleport" | "burning" | "poisoned";
type SpriteInfo = { frames: number; startRow: number; frameMs: number; extra?: boolean };
const TOTAL_ROWS = 34;
const EXTRA_ROWS = 61;
const SHEETS: Record<PixelVfxKind, SpriteInfo> = {
  slash: { frames: 10, startRow: 0, frameMs: 50 },
  fire: { frames: 14, startRow: 2, frameMs: 50 },
  ice: { frames: 13, startRow: 5, frameMs: 50 },
  lightning: { frames: 14, startRow: 8, frameMs: 50 },
  heal: { frames: 14, startRow: 11, frameMs: 50 },
  shield: { frames: 16, startRow: 14, frameMs: 50 },
  void: { frames: 14, startRow: 18, frameMs: 50 },
  summon: { frames: 16, startRow: 21, frameMs: 50 },
  destroy: { frames: 15, startRow: 25, frameMs: 50 },
  arcane: { frames: 12, startRow: 28, frameMs: 50 },
  poison: { frames: 14, startRow: 31, frameMs: 50 },
  fire_nova: { frames: 10, startRow: 0, frameMs: 120, extra: true },
  meteor: { frames: 13, startRow: 2, frameMs: 120, extra: true },
  flamethrower: { frames: 8, startRow: 5, frameMs: 120, extra: true },
  ice_wall: { frames: 11, startRow: 7, frameMs: 140, extra: true },
  blizzard: { frames: 8, startRow: 10, frameMs: 140, extra: true },
  freeze: { frames: 10, startRow: 12, frameMs: 140, extra: true },
  ice_spike: { frames: 13, startRow: 14, frameMs: 140, extra: true },
  chain_lightning: { frames: 7, startRow: 17, frameMs: 140, extra: true },
  electric_burst: { frames: 7, startRow: 19, frameMs: 120, extra: true },
  shield_break: { frames: 9, startRow: 21, frameMs: 120, extra: true },
  regen: { frames: 8, startRow: 23, frameMs: 160, extra: true },
  holy: { frames: 10, startRow: 25, frameMs: 140, extra: true },
  crit: { frames: 6, startRow: 27, frameMs: 140, extra: true },
  smash: { frames: 8, startRow: 29, frameMs: 120, extra: true },
  arrow: { frames: 9, startRow: 31, frameMs: 120, extra: true },
  earth_spike: { frames: 11, startRow: 33, frameMs: 140, extra: true },
  vines: { frames: 10, startRow: 36, frameMs: 140, extra: true },
  curse: { frames: 14, startRow: 38, frameMs: 160, extra: true },
  soul_drain: { frames: 12, startRow: 41, frameMs: 130, extra: true },
  smoke: { frames: 11, startRow: 44, frameMs: 140, extra: true },
  stun: { frames: 8, startRow: 47, frameMs: 150, extra: true },
  water: { frames: 10, startRow: 49, frameMs: 140, extra: true },
  wind_blade: { frames: 8, startRow: 51, frameMs: 120, extra: true },
  fate: { frames: 10, startRow: 53, frameMs: 160, extra: true },
  teleport: { frames: 10, startRow: 55, frameMs: 120, extra: true },
  burning: { frames: 6, startRow: 57, frameMs: 150, extra: true },
  poisoned: { frames: 9, startRow: 59, frameMs: 160, extra: true },
};


/** Art direction only; game balance and actual effect execution are unchanged.
 * Mapping reflects card IDs, title hints and defined elements in cards.json. */
const ART_BY_ID: Partial<Record<string, PixelVfxKind>> = {
  wood_vines:"vines", primordial_tree:"regen", tree_of_life:"regen",
  tsunami:"water", velvet_tide:"water",
  sandstorm:"wind_blade", devouring_dune:"smoke", dune_scout:"wind_blade",
  glass_scorpion:"poisoned", sun_scarab:"holy",
  spherical_lightning:"electric_burst", ten_thousand_volts:"chain_lightning",
  thunderer:"chain_lightning", thunderbolts:"chain_lightning",
  Stun_Gun:"stun", static_pilgrim:"electric_burst",
  prism_felix:"electric_burst", storm_raptor:"chain_lightning",
  arc_snare:"stun", charge_spike:"lightning", meridian_arc_spear:"lightning",
  stormborn_crown:"chain_lightning", stormglass_relay:"electric_burst",
  ice_boulders:"ice_spike", dawnless_winter:"blizzard",
  frost_shard:"ice_spike", frozen_pulpit:"ice_wall",
  frozen_sentinel:"freeze", ice_needle:"ice_spike",
  permafrost_fracture:"freeze", queen_of_frost_bridges:"ice_wall",
  seal_of_white_silence:"blizzard", snow_wanderer:"blizzard",
  furnace_breath:"flamethrower", heart_of_the_caldera:"fire_nova",
  lava:"fire_nova", volcano:"meteor", fire_raven:"fire",
  ember_imp:"burning", reliquary_of_the_war_sun:"holy",
  ashen_blade:"slash", ashen_halo:"fire",
  phoenix_feather:"fire_nova", healing:"heal",
  shield_hope:"shield", armor_of_chaos:"shield", titan_eye:"shield",
  hero_silhouette:"shield", prime:"shield", legendary_messenger:"regen",
  seal_of_forgotten_souls:"curse", warlock:"soul_drain",
  shadow_assassin:"slash", hyper_night:"void",
  psychological_disorder:"curse", unrequited_love:"curse",
  reverse_heart:"soul_drain", conjurer:"arcane",
  hand_of_god:"holy", ray_of_creation:"holy",
  oracle:"fate", dragon_eye:"fate", fifteen_sixteen:"fate",
  book_knowledge:"arcane", black_archive:"curse",
  crystal_of_time:"fate", wardens_hourglass:"fate",
  excalibur:"crit", elite_knight:"smash", spear_tribesman:"arrow",
  hunter:"arrow", revolver:"crit", king_peleus:"smash",
  energy_sword:"slash", shadow_sword:"slash",
  betrayal:"slash",
};

/** Multiple distinct sprites are selected from the user's PVFX Foundry pack. */
export function cardVfxKind(card: CardDefinition): PixelVfxKind {
  const mapped = ART_BY_ID[card.id];
  if (mapped) return mapped;
  if (card.element === "fire") return "fire";
  if (card.element === "ice") return "freeze";
  if (card.element === "lightning") return "electric_burst";
  if (card.element === "water") return "water";
  if (card.element === "void") return "void";
  const hint = (card.id + " " + (card.effectKey ?? "")).toLowerCase();
  if (/(?:chain|volt|thunder|electr)/.test(hint)) return "chain_lightning";
  if (/(?:lightning|shock|storm)/.test(hint)) return "lightning";
  if (/(?:frost|ice|cold|winter|freeze|snow)/.test(hint)) return "freeze";
  if (/(?:lava|volcano|meteor|caldera)/.test(hint)) return "meteor";
  if (/(?:fire|flame|ember|burn|phoenix)/.test(hint)) return "fire";
  if (/(?:poison|venom|acid|scorpion)/.test(hint)) return "poisoned";
  if (/(?:shield|armor|protect|barrier)/.test(hint)) return "shield";
  if (/(?:heal|regen|restore)/.test(hint)) return "regen";
  if (/(?:shadow|dark|abyss|soul)/.test(hint)) return "void";
  if (/(?:curse|seal|night)/.test(hint)) return "curse";
  if (/(?:water|tsunami|tide)/.test(hint)) return "water";
  if (/(?:vine|tree|forest)/.test(hint)) return "vines";
  if (/(?:smoke|sand|dust)/.test(hint)) return "smoke";
  if (card.type === "attack") return "slash";
  return "summon";
}

/** Only show status effects when that exact status appears on a card. */
export function statusVfxKind(status: string): PixelVfxKind | null {
  switch (status) {
    case "alpha_frozen": return "freeze";
    case "alpha_cold_mark": return "ice";
    case "alpha_burning": return "burning";
    case "poisoned": return "poisoned";
    case "stunned": return "stun";
    case "alpha_bleeding": return "slash";
    case "weakened": return "curse";
    default: return null;
  }
}

type Props = { kind: PixelVfxKind; style?: CSSProperties; className?: string };
/** Renders authentic one-shot sprite animation without altering game state. */
export function PixelVfxSprite({ kind, style, className = "" }: Props) {
  const spec = SHEETS[kind];
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      const timer = window.setTimeout(() => setFrame(Math.floor(spec.frames / 2)), 0);
      return () => window.clearTimeout(timer);
    }
    let raf = 0;
    const begin = performance.now();
    const advance = (now: number) => {
      const next = Math.min(spec.frames - 1, Math.floor((now - begin) / spec.frameMs));
      setFrame((current) => current === next ? current : next);
      if (next < spec.frames - 1) raf = window.requestAnimationFrame(advance);
    };
    raf = window.requestAnimationFrame(advance);
    return () => window.cancelAnimationFrame(raf);
  }, [spec]);

  const col = frame % 5;
  const row = spec.startRow + Math.floor(frame / 5);
  const spriteStyle: CSSProperties = {
    ...style,
    backgroundImage: spec.extra
      ? 'url("/ui/fraktum/vfx/battle_vfx_extra.png")'
      : 'url("/ui/fraktum/vfx/battle_vfx_atlas.png")',
    backgroundSize: '500% ' + ((spec.extra ? EXTRA_ROWS : TOTAL_ROWS) * 100) + '%',
    backgroundPosition: (col * 25) + '% ' +
      (row / ((spec.extra ? EXTRA_ROWS : TOTAL_ROWS) - 1) * 100) + '%',
  };
  return <span className={"fraktumPixelVfx is-" + kind + " " + className} style={spriteStyle} aria-hidden="true" />;
}
