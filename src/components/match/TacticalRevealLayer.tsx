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
  kind: "peek-hand" | "peek-card" | "steal-cast" | "reverse" | "oracle-pick" | "oracle-hand";
  viewer: "player" | "enemy";
  owner: "player" | "enemy";
  source: string;
  title: string;
  cards: TacticalRevealCard[];
};

function getKindLabel(kind: TacticalRevealEvent["kind"]) {
  switch (kind) {
    case "oracle-pick": return "DRAGON EYE · CHOOSE A CARD";
    case "oracle-hand": return "ORACLE · REVEAL THE HAND";
    case "peek-hand": return "REVEALED HAND";
    case "peek-card": return "REVEALED CARD";
    case "steal-cast": return "STOLEN & CAST";
    case "reverse": return "REVERSED";
    default: return "REVEAL";
  }
}

// Mounted with an event key: a new play always starts with every enemy card concealed.
// Dragon Eye: select and reveal exactly one card. Oracle: manually turn any/all cards.
function ManualHandReveal({ event, onDismiss }: { event: TacticalRevealEvent; onDismiss: (id: string) => void }) {
  const revealAll = event.kind === "oracle-hand";
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(() => new Set());
  const [passportRequest, setPassportRequest] = useState<{ index: number; delayMs: number } | null>(null);

  useEffect(() => {
    if (!passportRequest) return;
    const chosen = event.cards[passportRequest.index];
    if (!chosen?.baseId) return;
    // Allow the selected card to finish turning over before opening its full passport.
    const timer = window.setTimeout(() => openCardPassport({
      baseId: chosen.baseId!,
      instanceId: chosen.id,
      frontImage: chosen.image,
    }), passportRequest.delayMs);
    return () => window.clearTimeout(timer);
  }, [event, passportRequest]);

  const reveal = (index: number) => {
    const alreadyOpen = revealedIndices.has(index);
    if (!revealAll && revealedIndices.size > 0 && !alreadyOpen) return;
    setRevealedIndices(previous => new Set(previous).add(index));
    // Previously flipped cards can be examined again without replaying the flip.
    setPassportRequest({ index, delayMs: alreadyOpen ? 0 : 620 });
  };

  const revealedCount = revealedIndices.size;
  const totalCount = event.cards.length;

  return (
    <section
      className={`matchTacticalRevealLayer is-${event.kind}`}
      role="dialog"
      aria-label={revealAll ? "Оракул: просмотр всей руки противника" : "Драконий глаз: выбор одной закрытой карты"}
      aria-modal="true"
    >
      <div className="matchTacticalRevealPanel">
        <div className="matchTacticalRevealHeader">
          <span>{revealAll ? `ОТКРЫТО ${revealedCount} ИЗ ${totalCount}` : "ВЫБЕРИ ОДНУ КАРТУ СОПЕРНИКА"}</span>
          <b>{event.source}</b>
        </div>
        <div className="matchTacticalRevealCards oracleChoices" data-count={totalCount}>
          {event.cards.map((card, index) => {
            const opened = revealedIndices.has(index);
            return (
              <button
                className={`matchTacticalRevealCard oracleOption${opened ? " is-picked" : ""}`}
                key={card.id}
                type="button"
                disabled={!revealAll && revealedCount > 0 && !opened}
                onClick={() => reveal(index)}
                aria-label={opened ? `Посмотреть паспорт карты ${index + 1}: ${card.title}` : `Открыть закрытую карту ${index + 1}`}
              >
                <div className="matchTacticalRevealCardInner">
                  <div className="matchTacticalRevealCardBack" aria-hidden="true">
                    <img src="/cards/card-back.png" alt="" draggable={false} />
                  </div>
                  <div className="matchTacticalRevealCardFront">
                    {opened ? <img src={card.image} alt={card.title} draggable={false} /> : null}
                    {opened && typeof card.cost === "number" ? <i>{card.cost}</i> : null}
                  </div>
                </div>
                <strong>{opened ? card.title : `Карта ${index + 1}`}</strong>
              </button>
            );
          })}
        </div>
        <p>
          {revealAll
            ? revealedCount === totalCount
              ? "Все карты руки раскрыты. Можно повторно открыть любой паспорт или завершить просмотр."
              : "Нажимай на рубашки по очереди. Каждая карта перевернётся, затем откроется её паспорт. Можно раскрыть всю руку."
            : revealedCount === 0
              ? "Выбери одну закрытую карту противника. Только она перевернётся."
              : "Паспорт выбранной карты открыт. Остальные карты скрыты. После просмотра нажми «Завершить»."}
        </p>
        <button className="oracleRevealClose" type="button" onClick={() => onDismiss(event.id)}>
          {revealedCount === 0 ? "ПРОПУСТИТЬ" : "ЗАВЕРШИТЬ ПРОСМОТР"}
        </button>
      </div>
    </section>
  );
}

export function TacticalRevealLayer({ events, onDismiss = () => undefined }: { events: TacticalRevealEvent[]; onDismiss?: (id: string) => void }) {
  if (events.length === 0) return null;

  const latest = events[events.length - 1];
  if (latest.kind === "oracle-pick" || latest.kind === "oracle-hand") return latest.viewer === "player" ? <ManualHandReveal key={latest.id} event={latest} onDismiss={onDismiss} /> : null;

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
