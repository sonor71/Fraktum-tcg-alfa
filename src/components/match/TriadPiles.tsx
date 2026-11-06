import { DeckPile } from "./DeckPile";
import { DiscardPile } from "./DiscardPile";
import { triadToMatchCard } from "./TriadSlot";
import type { TriadPlayer, TriadSeat } from "../../game/triad/triadEngine";

type Props = {
  seat: TriadSeat;
  side: "left" | "right" | "bottom";
  player: TriadPlayer;
  canBlindPlay?: boolean;
  onBlindPlay?: () => void;
};

/** Each seat owns a visible deck and public discard, backed by the 1x1 pile components. */
export function TriadPiles({ seat, side, player, canBlindPlay, onBlindPlay }: Props) {
  const own = side === "bottom";
  return <div className={"triad-seat-piles is-" + side} data-triad-piles={seat}>
    <div className="triad-pile-wrapper is-deck" data-triad-pile="deck"
      data-triad-seat={seat} data-triad-count={player.deck.length}>
      <DeckPile count={player.deck.length} owner={own ? "player" : "enemy"}
        actionLabel="КОЛОДА" onActivate={canBlindPlay ? onBlindPlay : undefined}
        />
    </div>
    <div className="triad-pile-wrapper is-discard" data-triad-pile="discard"
      data-triad-seat={seat} data-triad-count={player.discard.length}>
      <DiscardPile cards={player.discard.map((card) => triadToMatchCard(card, own ? "player" : "enemy"))}
        owner={own ? "player" : "enemy"}/>
    </div>
  </div>;
}
