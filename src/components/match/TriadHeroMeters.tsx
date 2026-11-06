import { StatusBar } from "./StatusBar";
import type { TriadPlayer, TriadSeat } from "../../game/triad/triadEngine";

/**
 * Small three-seat counterpart of the original 1×1 HeroPanel meters.
 * Uses the SAME StatusBar component with HP/shield transitions.
 */
export function TriadHeroMeters({ seat, player }: { seat: TriadSeat; player: TriadPlayer }) {
  const shieldMax = Math.max(10, player.shield, Math.ceil(player.maxHp * .5));
  const caption = player.hero.ruTitle || player.hero.title;
  return <div className="triad-hero-station" data-triad-hero={seat}
    aria-label={player.name + ": HP " + player.hp + "/" + player.maxHp + ", щит " + player.shield}>
    <div className="triad-player-portrait" data-triad-portrait={seat} title={caption}>
      <img src={player.hero.image || "/cards/card-back.png"} alt={caption} draggable={false}/>
    </div>
    <div className="triad-hero-gauges">
      <div className="triad-hero-gauge is-health" title={"HP " + player.hp + "/" + player.maxHp}>
        <StatusBar label="HP" value={player.hp} max={player.maxHp} tone="hp"
          orientation="vertical" compact showValue={false} />
        <b className="triad-hero-gauge-amount">{player.hp}/{player.maxHp}</b>
      </div>
      <div className="triad-hero-gauge is-shield" title={"Защита " + player.shield}>
        <StatusBar label="ЩИТ" value={player.shield} max={shieldMax} tone="shield"
          orientation="vertical" compact showValue={false} />
        <b className="triad-hero-gauge-amount">{player.shield}</b>
      </div>
    </div>
  </div>;
}
