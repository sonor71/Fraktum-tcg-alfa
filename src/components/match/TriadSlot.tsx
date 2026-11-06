import { BoardSlot } from "./BoardSlot";
import { getWillCostByRarity } from "../../game/rarityWillCost";
import type { CardInstance } from "../../game/core/types";
import type { TriadCard, TriadSeat } from "../../game/triad/triadEngine";

/** Convert three-player engine cards into the same visual card model used by 1×1. */
export function triadToMatchCard(card: TriadCard, owner: "player" | "enemy"): CardInstance {
  return {
    instanceId: card.instanceId,
    baseId: card.definition.id,
    definition: card.definition,
    ownerId: owner,
    controllerId: owner,
    currentAttack: Number(card.definition.attack) || 0,
    currentHealth: card.hp,
    currentArmor: card.armor,
    statuses: card.statuses,
    playedRound: card.playedTurn,
    temporaryUntilRoundEnd: Number(card.definition.health) <= 0,
  };
}

type TriadSlotProps = {
  card: TriadCard | null;
  seat: TriadSeat;
  lane: TriadSeat | "support";
  index: number;
  playable: boolean;
  isOwn?: boolean;
  onActivate?: () => void;
};

/** Reuses the actual 1×1 slot (runes, HP, temporary and status effects). */
export function TriadSlot({ card, seat, lane, index, playable, isOwn = false, onActivate }: TriadSlotProps) {
  return (
    <div
      className={`triad-combat-slot${playable ? " is-targetable" : ""}`}
      data-triad-seat={seat}
      data-triad-lane={lane}
      data-triad-index={index}
      data-triad-card-id={card?.instanceId ?? ""}
      key={card?.instanceId ?? "empty"}
    >
      <BoardSlot
        card={card ? triadToMatchCard(card, isOwn ? "player" : "enemy") : null}
        side={isOwn ? "player" : "enemy"}
        index={index}
        valid={playable && !card}
        targetable={playable && Boolean(card)}
        onActivate={playable ? () => onActivate?.() : undefined}
      />
      {card ? <div className="triad-unit-metrics" aria-label={"Воля " +
        getWillCostByRarity(card.definition.rarity) + ", HP " + card.hp + "/" + card.definition.health}>
        <span className="is-will" title="Цена карты в Воле">◆{getWillCostByRarity(card.definition.rarity)}</span>
        {Number(card.definition.health) > 0
          ? <span className="is-hp" title="Здоровье карты">♥{card.hp}/{card.definition.health}</span>
          : null}
      </div> : null}
    </div>
  );
}
