import { useEffect, useState, type CSSProperties } from "react";
import type { CardDefinition } from "../../game/core/types";

/** PVFX Foundry CC0 (legacy/0.10.0). Frames: 64px, five-column grid. */
export type PixelVfxKind =
  | "slash" | "fire" | "ice" | "lightning" | "heal" | "shield"
  | "void" | "summon" | "destroy" | "arcane" | "poison";
type SpriteInfo = { frames: number; rows: number; frameMs: number };
const SHEETS: Record<PixelVfxKind, SpriteInfo> = {
  slash: { frames: 10, rows: 2, frameMs: 50 },
  fire: { frames: 14, rows: 3, frameMs: 50 },
  ice: { frames: 13, rows: 3, frameMs: 50 },
  lightning: { frames: 14, rows: 3, frameMs: 50 },
  heal: { frames: 14, rows: 3, frameMs: 50 },
  shield: { frames: 16, rows: 4, frameMs: 50 },
  void: { frames: 14, rows: 3, frameMs: 50 },
  summon: { frames: 16, rows: 4, frameMs: 50 },
  destroy: { frames: 15, rows: 3, frameMs: 50 },
  arcane: { frames: 12, rows: 3, frameMs: 50 },
  poison: { frames: 14, rows: 3, frameMs: 50 },
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
  const row = Math.floor(frame / 5);
  const spriteStyle: CSSProperties = {
    ...style,
    backgroundImage: 'url("/ui/fraktum/vfx/' + kind + '.png")',
    backgroundSize: '500% ' + (spec.rows * 100) + '%',
    backgroundPosition: (col * 25) + '% ' + (spec.rows > 1 ? row / (spec.rows - 1) * 100 : 0) + '%',
  };
  return <span className={"fraktumPixelVfx is-" + kind + " " + className} style={spriteStyle} aria-hidden="true" />;
}
