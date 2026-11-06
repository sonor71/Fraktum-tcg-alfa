import { useLayoutEffect, useRef, useState, type CSSProperties, type MutableRefObject } from "react";
import { createPortal } from "react-dom";
import type { TriadAction, TriadCard, TriadSeat, TriadState } from "../../game/triad/triadEngine";

type Rect = { left: number; top: number; width: number; height: number };
export type TriadFlightRequest = {
  seat: TriadSeat;
  lane: string;
  slot: number;
  cardId: string;
  image: string;
  from: Rect;
  createdAt: number;
};
type Motion = { id: number; from: Rect; to: Rect; image: string };
type FloatText = { id: number; x: number; y: number; text: string; tone: "damage" | "heal" | "shield" | "play" };

const allSeats: TriadSeat[] = ["a", "b", "c"];

function findCard(state: TriadState, seat: TriadSeat, id: string): TriadCard | undefined {
  const player = state.players[seat];
  return [...player.hand, ...player.discard, ...player.deck].find((card) => card.instanceId === id)
    ?? allSeats.flatMap((s) => state.players[s].deck).find((card) => card.instanceId === id);
}
function slotElement(seat: TriadSeat, lane: string, index: number) {
  return document.querySelector<HTMLElement>(
    `[data-triad-seat="${seat}"][data-triad-lane="${lane}"][data-triad-index="${index}"]`,
  );
}
const asRect = (rect: DOMRect): Rect => ({
  left: rect.left, top: rect.top, width: rect.width, height: rect.height,
});

/** Capture the source before the hand card disappears from the React tree. */
export function captureTriadFlight(action: TriadAction, state: TriadState): TriadFlightRequest | null {
  if (action.type !== "PLAY" || typeof document === "undefined") return null;
  const card = findCard(state, action.seat, action.cardId);
  if (!card) return null;
  const from = document.querySelector<HTMLElement>(`[data-triad-hand-card="${action.cardId}"]`)
    ?? document.querySelector<HTMLElement>(`[data-triad-owner-hand="${action.seat}"] .triad-back`);
  if (!from) return null;
  return {
    seat: action.seat, lane: action.lane, slot: action.slot, cardId: action.cardId,
    image: card.definition.image || "/cards/card-back.png",
    from: asRect(from.getBoundingClientRect()), createdAt: Date.now(),
  };
}

export function TriadCombatMotion({ match, pendingFlight }: {
  match: TriadState;
  pendingFlight: MutableRefObject<TriadFlightRequest | null>;
}) {
  const previous = useRef(match);
  const counter = useRef(0);
  const [flight, setFlight] = useState<Motion | null>(null);
  const [floats, setFloats] = useState<FloatText[]>([]);

  useLayoutEffect(() => {
    const old = previous.current;
    previous.current = match;
    if (old === match) return;

    const pending = pendingFlight.current;
    if (pending && Date.now() - pending.createdAt < 7000 &&
      old.battle === match.battle && match.played > old.played) {
      const destination = slotElement(pending.seat, pending.lane, pending.slot);
      if (destination) {
        const id = ++counter.current;
        setFlight({ id, from: pending.from, to: asRect(destination.getBoundingClientRect()), image: pending.image });
        window.setTimeout(() => setFlight((current) => current?.id === id ? null : current), 650);
      }
      pendingFlight.current = null;
    } else if (pending && Date.now() - pending.createdAt >= 7000) {
      pendingFlight.current = null;
    }

    if (old.battle !== match.battle) return;
    const fresh: FloatText[] = [];
    const add = (selector: HTMLElement | null, text: string, tone: FloatText["tone"]) => {
      if (!selector) return;
      const box = selector.getBoundingClientRect();
      fresh.push({ id: ++counter.current, x: box.left + box.width / 2,
        y: box.top + box.height / 2, text, tone });
    };
    for (const seat of allSeats) {
      const before = old.players[seat];
      const after = match.players[seat];
      const hpChange = after.hp - before.hp;
      if (hpChange) {
        add(document.querySelector<HTMLElement>(`[data-triad-portrait="${seat}"]`),
          hpChange > 0 ? `+${hpChange} HP` : `${hpChange} HP`, hpChange > 0 ? "heal" : "damage");
      }
      const shield = after.shield - before.shield;
      if (shield) {
        add(document.querySelector<HTMLElement>(`[data-triad-portrait="${seat}"]`),
          shield > 0 ? `+${shield} ЩИТ` : `${shield} ЩИТ`, "shield");
      }
      for (const lane of allSeats) {
        for (let i = 0; i < 3; i += 1) {
          const oldUnit = before.lanes[lane][i];
          const newUnit = after.lanes[lane][i];
          if (!oldUnit) continue;
          if (!newUnit || newUnit.instanceId !== oldUnit.instanceId) {
            add(slotElement(seat, lane, i), "✦", "damage");
          } else if (newUnit.hp !== oldUnit.hp) {
            const change = newUnit.hp - oldUnit.hp;
            add(slotElement(seat, lane, i), change > 0 ? `+${change} HP` : `${change} HP`,
              change > 0 ? "heal" : "damage");
          }
        }
      }
    }
    if (fresh.length) {
      setFloats((current) => [...current.slice(-12), ...fresh]);
      const ids = new Set(fresh.map((item) => item.id));
      window.setTimeout(() => setFloats((items) => items.filter((item) => !ids.has(item.id))), 1200);
    }
  }, [match, pendingFlight]);

  if (typeof document === "undefined") return null;
  const center = (rect: Rect) => ({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  return createPortal(
    <div className="triad-motion-layer" aria-hidden="true">
      {flight ? (() => {
        const a = center(flight.from);
        const b = center(flight.to);
        const style = {
          left: a.x - 27, top: a.y - 37,
          "--triad-fly-x": `${b.x - a.x}px`,
          "--triad-fly-y": `${b.y - a.y}px`,
        } as CSSProperties;
        return <img className="triad-flying-card" key={flight.id} src={flight.image} style={style} alt="" draggable={false} />;
      })() : null}
      {floats.map((event) => (
        <span className={`triad-floating-number is-${event.tone}`} key={event.id}
          style={{ left: event.x, top: event.y }}>{event.text}</span>
      ))}
    </div>, document.body,
  );
}
