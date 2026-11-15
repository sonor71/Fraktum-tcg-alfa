import type { RefObject, CSSProperties } from "react";
import { PixelVfxSprite, cardVfxKind, statusVfxKind, type PixelVfxKind } from "./PixelVfxSprite";
import type { TriadLane, TriadState, TriadCard } from "../../game/triad/triadEngine";
import { TRIAD_SEATS } from "../../game/triad/triadEngine";

export type TriadVisualEvent = {
  id: string; anchor: string; kind: PixelVfxKind;
  text: string; tone: "damage" | "heal" | "shield" | "will" | "play" | "discard" | "status";
};
type UnkeyedEvent = Omit<TriadVisualEvent, "id">;
const create = (events: UnkeyedEvent[], anchor: string, kind: PixelVfxKind, text: string, tone: UnkeyedEvent["tone"]) =>
  events.push({ anchor, kind, text, tone });

function compareCard(events: UnkeyedEvent[], before: TriadCard | null, after: TriadCard | null, anchor: string) {
  if (!before && after) {
    create(events, anchor, cardVfxKind(after.definition), "КАРТА", "play");
    return;
  }
  if (before && !after) {
    create(events, anchor, "destroy", "СБРОС", "discard");
    return;
  }
  if (!before || !after || before.instanceId !== after.instanceId) {
    if (after) create(events, anchor, cardVfxKind(after.definition), "КАРТА", "play");
    return;
  }
  if (after.hp < before.hp) create(events, anchor, "slash", String(after.hp - before.hp), "damage");
  if (after.hp > before.hp) create(events, anchor, "heal", "+" + String(after.hp - before.hp), "heal");
  for (const status of after.statuses) {
    if (before.statuses.includes(status)) continue;
    const kind = statusVfxKind(status);
    if (kind) create(events, anchor, kind, status.replaceAll("_", " ").toUpperCase(), "status");
  }
}

export function buildTriadVisualEvents(previous: TriadState, next: TriadState): UnkeyedEvent[] {
  if (previous.battle !== next.battle || previous.id !== next.id) return [];
  const events: UnkeyedEvent[] = [];
  for (const seat of TRIAD_SEATS) {
    const before = previous.players[seat], after = next.players[seat];
    const hero = "triad-hero-" + seat;
    if (after.hp !== before.hp) {
      const delta = after.hp - before.hp;
      create(events, hero, delta < 0 ? (delta <= -5 ? "crit" : "slash") : "heal", (delta > 0 ? "+" : "") + delta, delta < 0 ? "damage" : "heal");
    }
    if (after.shield !== before.shield) {
      const delta = after.shield - before.shield;
      create(events, hero, delta < 0 ? "shield_break" : "shield", (delta > 0 ? "+" : "") + delta + " SHD", "shield");
    }
    if (after.will !== before.will && seat === next.active) {
      const delta = after.will - before.will;
      create(events, hero, "arcane", (delta > 0 ? "+" : "") + delta + " ВОЛЯ", "will");
    }
    const lanes: TriadLane[] = ["a", "b", "c", "support"];
    for (const lane of lanes) {
      const oldLane = lane === "support" ? before.support : before.lanes[lane];
      const newLane = lane === "support" ? after.support : after.lanes[lane];
      for (let slot = 0; slot < newLane.length; slot++) {
        compareCard(events, oldLane[slot], newLane[slot], "triad-slot-" + seat + "-" + lane + "-" + slot);
      }
    }
  }
  if (previous.roll !== next.roll && next.roll !== null)
    create(events, "triad-d20", "fate", "D20: " + next.roll, "will");

  // Keep shared online render work bounded on a board wipe.
  return events.slice(0, 18);
}

type Props = { events: TriadVisualEvent[]; arenaRef: RefObject<HTMLDivElement | null> };
export function TriadPixelFxLayer({ events, arenaRef }: Props) {
  const arena = arenaRef.current;
  if (!arena || events.length === 0) return null;
  const arenaBox = arena.getBoundingClientRect();

  return (
    <div className="triad-vfx-layer" aria-hidden="true">
      {events.map((effect) => {
        const el = arena.querySelector<HTMLElement>('[data-vfx-anchor="' + effect.anchor + '"]');
        if (!el) return null;
        const box = el.getBoundingClientRect();
        const style: CSSProperties = {
          left: (box.left + box.width / 2 - arenaBox.left) + "px",
          top: (box.top + box.height / 2 - arenaBox.top) + "px",
        };
        return <span key={effect.id} className="triad-vfx-anchor" style={style}>
          <PixelVfxSprite kind={effect.kind} />
          <span className={"triad-vfx-text is-" + effect.tone}>{effect.text}</span>
        </span>;
      })}
    </div>
  );
}
