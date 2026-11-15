import type { CSSProperties } from "react";
import { PixelVfxSprite, type PixelVfxKind } from "./PixelVfxSprite";

type MatchFxTone = "damage" | "heal" | "will" | "shield" | "play" | "discard" | "sys";
type MatchFxAnchor = "player-hero" | "enemy-hero" | "player-will" | "enemy-will" | "d20"
  | `slot-player-${number}` | `slot-enemy-${number}`;

export type MatchFxEvent = {
  id: string;
  text: string;
  tone: MatchFxTone;
  anchor: MatchFxAnchor;
  visual?: PixelVfxKind;
};

type MatchFxLayerProps = { events: MatchFxEvent[] };
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
function getAnchorStyle(anchor: MatchFxAnchor): CSSProperties {
  const m = /^slot-(player|enemy)-(\d+)$/.exec(anchor);
  if (m) {
    const index = clamp(Number(m[2]), 0, 4);
    return {
      left: (22.6 + 55.2 / 5 * (index + 0.5)) + "%",
      top: m[1] === "enemy" ? "31.5%" : "52.7%",
    };
  }
  switch (anchor) {
    case "player-hero": return { left: "11.8%", top: "39%" };
    case "enemy-hero": return { left: "88.2%", top: "39%" };
    case "player-will": return { left: "50%", top: "72.6%" };
    case "enemy-will": return { left: "50%", top: "18.9%" };
    case "d20": return { left: "8.2%", top: "79.5%" };
    default: return { left: "50%", top: "50%" };
  }
}
function toneVisual(tone: MatchFxTone): PixelVfxKind {
  switch (tone) {
    case "damage": return "slash";
    case "heal": return "heal";
    case "will": return "arcane";
    case "shield": return "shield";
    case "discard": return "destroy";
    default: return "summon";
  }
}
export function MatchFxLayer({ events }: MatchFxLayerProps) {
  if (!events.length) return null;
  return (
    <div className="matchFxLayer" aria-hidden="true">
      {events.map((event) => (
        <span className="matchFxGroup" key={event.id} style={getAnchorStyle(event.anchor)}>
          <PixelVfxSprite kind={event.visual ?? toneVisual(event.tone)} />
          <span className={"matchFxText is-" + event.tone} data-anchor={event.anchor}>{event.text}</span>
        </span>
      ))}
    </div>
  );
}
