import { useEffect, useState, type CSSProperties } from "react";
import type { CardDefinition } from "../../game/core/types";

/** PVFX Foundry CC0 (legacy/0.10.0). Frames: 32px, five-column atlas with 34 rows. */
export type PixelVfxKind =
  | "slash" | "fire" | "ice" | "lightning" | "heal" | "shield"
  | "void" | "summon" | "destroy" | "arcane" | "poison";
type SpriteInfo = { frames: number; startRow: number; frameMs: number };
const TOTAL_ROWS = 34;
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
};

export function cardVfxKind(card: CardDefinition): PixelVfxKind {
  if (card.element === "fire") return "fire";
  if (card.element === "ice") return "ice";
  if (card.element === "lightning") return "lightning";
  if (card.element === "void") return "void";
  const hint = (card.id + " " + (card.effectKey ?? "")).toLowerCase();
  if (/(?:thunder|lightning|volt|electric|storm_shock)/.test(hint)) return "lightning";
  if (/(?:freeze|frost|ice_|_ice|blizzard|snow)/.test(hint)) return "ice";
  if (/(?:fire|flame|inferno|burn|ember|phoenix)/.test(hint)) return "fire";
  if (/(?:void|shadow|darkness|abyss|curse)/.test(hint)) return "void";
  if (/(?:poison|venom|toxic|acid)/.test(hint)) return "poison";
  if (/(?:heal|restor|regenerat|blessing)/.test(hint)) return "heal";
  if (/(?:shield|barrier|defend|armor|armour)/.test(hint)) return "shield";
  if (card.type === "attack") return "slash";
  return "summon";
}

export function statusVfxKind(status: string): PixelVfxKind | null {
  switch (status) {
    case "alpha_frozen": case "alpha_cold_mark": return "ice";
    case "alpha_burning": return "fire";
    case "poisoned": return "poison";
    case "stunned": return "lightning";
    case "alpha_bleeding": return "slash";
    case "weakened": return "void";
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
    backgroundImage: 'url("/ui/fraktum/vfx/battle_vfx_atlas.png")',
    backgroundSize: '500% ' + (TOTAL_ROWS * 100) + '%',
    backgroundPosition: (col * 25) + '% ' + (row / (TOTAL_ROWS - 1) * 100) + '%',
  };
  return <span className={"fraktumPixelVfx is-" + kind + " " + className} style={spriteStyle} aria-hidden="true" />;
}
