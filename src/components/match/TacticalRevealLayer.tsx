import { useState } from "react";

export type TacticalRevealCard = {
  id: string;
  title: string;
  image: string;
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
function OraclePickReveal({ event }: { event: TacticalRevealEvent }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <section className="matchTacticalRevealLayer is-oracle-pick" role="dialog" aria-label="Оракул: выбор закрытой карты">
      <div className="matchTacticalRevealPanel">
        <div className="matchTacticalRevealHeader">
          <span>{getKindLabel(event.kind)}</span>
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
          : "Карта раскрыта. Остальные карты остаются скрытыми."}</p>
        <button className="oracleRevealClose" type="button" onClick={() => setDismissed(true)}>
          {selectedIndex === null ? "ПРОПУСТИТЬ" : "ЗАКРЫТЬ"}
        </button>
      </div>
    </section>
  );
}

export function TacticalRevealLayer({ events }: { events: TacticalRevealEvent[] }) {
  if (events.length === 0) return null;

  const latest = events[events.length - 1];
  if (latest.kind === "oracle-pick") return <OraclePickReveal key={latest.id} event={latest} />;

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
