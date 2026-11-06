import { BonusSlots } from "./BonusSlots";
import { triadToMatchCard } from "./TriadSlot";
import type { TriadLoadout, TriadSeat } from "../../game/triad/triadEngine";

/** The original 1×1 four bonus-card sockets, not decorative placeholders. */
export function TriadCharacterBonuses({ seat, loadout }: { seat: TriadSeat; loadout: TriadLoadout }) {
  const cards = (loadout.bonusCards ?? []).map((definition, index) =>
    triadToMatchCard({
      instanceId: seat + "_bonus_" + index,
      definition,
      hp: Number(definition.health) || 0, armor: Number(definition.armor) || 0,
      statuses: [], playedTurn: -1,
    }, seat === "a" ? "player" : "enemy"));
  return <div className="triad-character-bonuses" data-triad-bonuses={seat}>
    <span className="triad-bonus-title">УСИЛЕНИЯ</span>
    <BonusSlots cards={cards} slotCount={4} compact />
  </div>;
}
