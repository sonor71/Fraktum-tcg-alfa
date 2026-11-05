import { useEffect, useState } from "react";
import { openCardPassport } from "../CardPassport";

export type TacticalRevealCard = {
  id: string;
  title: string;
  image: string;
  baseId?: string;
  cost?: number;
  rarity?: string;
};

export type TacticalRevealEvent = {
  id: string;
  kind: "peek-hand" | "peek-card" | "steal-cast" | "reverse" | "oracle-pick";
  viewer: "player" | "enemy";
  owner: "player" | "enemy";
  source: string;
  title: string;
  cards: TacticalRevealCard[];
};

function getKindLabel(kind: TacticalRevealEvent["kind"]) {
  switch (kind) {
    case "oracle-pick": return "ORACLE · CHOOSE A CARD";
    case "peek-hand": return "REVEALED HAND";
    case "peek-card": return "REVEALED CARD";
    case "steal-cast": return "STOLEN & CAST";
    case "reverse": return "REVERSED";
    default: return "REVEAL";
  }
}

// Mounted with an event key so a new Oracle play always starts with concealed cards.
function OraclePickReveal({ event, onDismiss }: { event: TacticalRevealEvent; onDismiss: (id: string) => void }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  useEffect(() => {
    if (selectedIndex === null) return;
    const chosen = event.cards[selectedIndex];
    if (!chosen?.baseId) return;
    // Let the concealed card finish its flip, then open the real card passport.
    const timer = window.setTimeout(() => openCardPassport({
      baseId: chosen.baseId!,
      instanceId: chosen.id,
      frontImage: chosen.image,
    }), 620);
    return () => window.clearTimeout(timer);
  }, [event, selectedIndex]);

  return (
    <section className="matchTacticalRevealLayer is-oracle-pick" role="dialog" aria-label={`${event.source}: выбор закрытой карты`} aria-modal="true">
      <div className="matchTacticalRevealPanel">
        <div className="matchTacticalRevealHeader">
          <span>ВЫБОР КАРТЫ СОПЕРНИКА</span>
          <b>{event.source}</b>
        </div>
        <div className="matchTacticalRevealCards oracleChoices" data-count={event.cards.length}>
          {event.cards.map((card, index) => {
            const chosen = selectedIndex === index;
            return (
              <button
                className={`matchTacticalRevealCard oracleOption${chosen ? " is-picked" : ""}`}
                key={card.id}
                type="button"
                disabled={selectedIndex !== null}
                onClick={() => setSelectedIndex(index)}
                aria-label={chosen ? `Раскрыта карта ${index + 1}: ${card.title}` : `Открыть закрытую карту ${index + 1}`}
              >
                <div className="matchTacticalRevealCardInner">
                  <div className="matchTacticalRevealCardBack" aria-hidden="true">
                    <img src="/cards/card-back.png" alt="" draggable={false} />
                  </div>
                  <div className="matchTacticalRevealCardFront">
                    {chosen ? (
                      <img src={card.image} alt={card.title} draggable={false} />
                    ) : null}
                    {chosen && typeof card.cost === "number" ? <i>{card.cost}</i> : null}
                  </div>
                </div>
                <strong>{chosen ? card.title : `Карта ${index + 1}`}</strong>
              </button>
            );
          })}
        </div>
        <p>{selectedIndex === null
          ? "Выбери одну закрытую карту противника. Только она перевернётся."
          : "Паспорт выбранной карты открыт. Остальные карты скрыты. После просмотра нажми «Завершить»."}</p>
        <button className="oracleRevealClose" type="button" onClick={() => onDismiss(event.id)}>
          {selectedIndex === null ? "ПРОПУСТИТЬ" : "ЗАВЕРШИТЬ ПРОСМОТР"}
        </button>
      </div>
    </section>
  );
}

export function TacticalRevealLayer({ events, onDismiss = () => undefined }: { events: TacticalRevealEvent[]; onDismiss?: (id: string) => void }) {
  if (events.length === 0) return null;

  const latest = events[events.length - 1];
  if (latest.kind === "oracle-pick") return latest.viewer === "player" ? <OraclePickReveal key={latest.id} event={latest} onDismiss={onDismiss} /> : null;

  const shownCards = latest.cards.slice(0, latest.kind === "peek-hand" ? 8 : 1);

  return (
    <section className={`matchTacticalRevealLayer is-${latest.kind}`} aria-live="polite" aria-label={latest.title}>
      <div className="matchTacticalRevealPanel" key={latest.id}>
        <div className="matchTacticalRevealHeader">
          <span>{getKindLabel(latest.kind)}</span>
          <b>{latest.source}</b>
        </div>

        <div className="matchTacticalRevealCards" data-count={shownCards.length}>
          {shownCards.map((card, index) => (
            <article className="matchTacticalRevealCard" style={{ animationDelay: `${index * 90}ms` }} key={`${latest.id}-${card.id}-${index}`}>
              <div className="matchTacticalRevealCardInner">
                <div className="matchTacticalRevealCardBack" aria-hidden="true">F</div>
                <div className="matchTacticalRevealCardFront">
                  <img src={card.image} alt={card.title} draggable={false} />
                  {typeof card.cost === "number" ? <i>{card.cost}</i> : null}
                </div>
              </div>
              <strong>{card.title}</strong>
            </article>
          ))}
        </div>

        <p>
          {latest.kind === "steal-cast"
            ? "Enemy card was flipped, taken, and used against its owner."
            : latest.kind === "reverse"
              ? "Incoming card was reflected back to its caster."
              : "Enemy cards were flipped for your view."}
        </p>
      </div>
    </section>
  );
}
