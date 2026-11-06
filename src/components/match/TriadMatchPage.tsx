import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { splitDeckSelection } from "../../game/deckRules";
import { loadCardDefinitions } from "../../game/data/cards";
import { getWillCostByRarity } from "../../game/rarityWillCost";
import { getWillStatsFromUpgrades, useGameStore, type OwnedCard } from "../../useGameStore";
import {
  TRIAD_SEATS, TRIAD_VICTORIES_TO_WIN, chooseTriadBotAction, createTriadMatch,
  reduceTriad, triadCanPlay, triadEffectiveCost, triadIsSupport, triadRivals, type TriadAction,
  type TriadCard, type TriadLane, type TriadLoadout, type TriadSeat, type TriadState,
} from "../../game/triad/triadEngine";
import {
  createTriadRoom, currentTriadUserId, fetchTriadEvents, fetchTriadRoom,
  joinTriadRoom, roomTriadLoadouts, seatForTriadRoom, sendTriadAction,
  subscribeTriadRoom, type TriadEvent, type TriadRoom,
} from "../../services/triadRooms";
import { TriadSlot, triadToMatchCard } from "./TriadSlot";
import { TriadHeroMeters } from "./TriadHeroMeters";
import { TriadPiles } from "./TriadPiles";
import { D20View } from "./D20View";
import { CardView } from "./CardView";
import { TriadCombatMotion, captureTriadFlight, type TriadFlightRequest } from "./TriadCombatMotion";
import { MatchPresentationLayer, type MatchRoulettePresentation } from "./MatchPresentationLayer";
import "./triad-arena.css";
import "./triad-arena-v3.css";

const cardBack = "/cards/card-back.png";
const catalog = loadCardDefinitions();
const botDeck = catalog.filter((c) => c.type !== "character" && c.type !== "bonus" && c.type !== "upgrade").slice(0, 20);

function toDefinition(owned: OwnedCard) {
  const base = catalog.find((card) => card.id === owned.baseId);
  if (!base) throw new Error("В колоде отсутствует определение карты: " + owned.baseId);
  return {
    ...base, title: owned.title || base.title, image: owned.frontSrc || owned.image || base.image,
    rarity: owned.rarity, cost: getWillCostByRarity(owned.rarity),
    willCost: getWillCostByRarity(owned.rarity),
    attack: owned.attack, health: owned.health, effectKey: owned.effectKey || base.effectKey,
    description: owned.description || base.description,
  };
}
function playerLoadout(name: string, ownedCards: OwnedCard[], deckIds: string[],
  will: ReturnType<typeof getWillStatsFromUpgrades>): TriadLoadout {
  const selected = splitDeckSelection(ownedCards, deckIds);
  return {
    name: name || "Игрок", deck: selected.mainDeck.map(toDefinition),
    hero: selected.character ? toDefinition(selected.character) : catalog.find((c) => c.id === "brian"),
    bonusCards: selected.bonusCards.map(toDefinition),
    maxWill: will.maxWill, regen: will.regenPerRound,
  };
}
function botLoadout(name: string, heroId: string): TriadLoadout {
  return { name, deck: botDeck, hero: catalog.find((c) => c.id === heroId), maxWill: 5, regen: 2 };
}
function namesForSeats(state: TriadState) {
  return TRIAD_SEATS.map((seat) => state.players[seat].name + ": " + state.players[seat].victories).join("  •  ");
}
const cardTitle = (card: TriadCard) => card.definition.ruTitle || card.definition.title;
const cardImage = (card: TriadCard) => card.definition.image || cardBack;

/** Enemy cards always face their OWNER, never the spectator. Oracle flips only the chosen backs. */
function BackHand({ cards, revealed, flipped, onFlip, side, seat }: {
  cards: TriadCard[]; revealed: boolean; flipped: string[]; onFlip: (id: string) => void;
  side: "left" | "right"; seat: TriadSeat;
}) {
  const count = Math.max(cards.length, 1);
  return <div className={"triad-rival-hand is-" + side} data-triad-owner-hand={seat}>
    {cards.map((card, index) => {
      const t = (index + 0.5) / count;
      // Parallel to the perimeter of the owner's side, mirrored right-to-left.
      const point = side === "left" ? 28.6 - t * 19.8 : 71.4 + t * 19.8;
      const position = {
        left: point + "%", top: (9 + 29 * t) + "%",
        transform: "translate(-50%, -50%) rotate(" + (side === "left" ? 52 : -52) + "deg)",
      } as CSSProperties;
      const visible = revealed && flipped.includes(card.instanceId);
      return <button key={card.instanceId} className={"triad-back" + (visible ? " is-flipped" : "")}
        style={position} type="button" onClick={() => revealed && onFlip(card.instanceId)}
        disabled={!revealed} title={visible ? cardTitle(card) : "Скрытая карта"}>
        <span className="triad-back-flipper">
          <span className="triad-back-face is-back"><img draggable={false} src={cardBack} alt="Рубашка карты" /></span>
          {visible && <span className="triad-back-face is-front">
            <img draggable={false} src={cardImage(card)} alt={cardTitle(card)} />
          </span>}
        </span>
      </button>;
    })}
  </div>;
}

export default function TriadMatchPage() {
  const { mode } = useParams<{ mode?: string }>();
  const privateMode = mode === "private";
  const navigate = useNavigate();
  const ownedCards = useGameStore((s) => s.ownedCards);
  const deckIds = useGameStore((s) => s.deckIds);
  const playerName = useGameStore((s) => s.playerName);
  const willUpgrades = useGameStore((s) => s.willUpgrades);
  const willStats = useMemo(() => getWillStatsFromUpgrades(willUpgrades), [willUpgrades]);
  const ownLoadout = useMemo(() => playerLoadout(playerName, ownedCards, deckIds, willStats),
    [playerName, ownedCards, deckIds, willStats]);
  const botLoadouts = useMemo(() => ({
    a: ownLoadout, b: botLoadout("Бот II", "felix"), c: botLoadout("Бот III", "brian"),
  }), [ownLoadout]);
  const [room, setRoom] = useState<TriadRoom | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [match, setMatch] = useState<TriadState | null>(() =>
    privateMode ? null : createTriadMatch(botLoadouts, Date.now()));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [oracleSeat, setOracleSeat] = useState<TriadSeat | null>(null);
  const [revealLimit, setRevealLimit] = useState(99);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chat, setChat] = useState<TriadEvent[]>([]);
  const pendingFlight = useRef<TriadFlightRequest | null>(null);
  const [roulettePresentation, setRoulettePresentation] = useState<MatchRoulettePresentation | null>(null);
  const rouletteKeyRef = useRef("");
  const closeRoulette = useCallback(() => setRoulettePresentation(null), []);
  const seat: TriadSeat = privateMode && room && userId
    ? seatForTriadRoom(room, userId) ?? "a" : "a";
  const loadouts = privateMode && room ? roomTriadLoadouts(room) : botLoadouts;

  useEffect(() => {
    if (!match?.rouletteEvent) return;
    const key = [match.battle, match.round, match.active, match.rouletteEvent].join(":");
    if (rouletteKeyRef.current === key) return;
    rouletteKeyRef.current = key;
    setRoulettePresentation({
      id: match.battle * 100000 + match.round * 10 + TRIAD_SEATS.indexOf(match.active),
      event: match.rouletteEvent, ownerId: match.active === seat ? "player" : "enemy",
    });
  }, [match?.rouletteEvent, match?.round, match?.battle, match?.active, seat]);

  const refreshRoom = useCallback(async (roomId: string) => {
    const fresh = await fetchTriadRoom(roomId);
    if (!fresh) { setError("Комната больше не существует."); return; }
    setRoom(fresh);
    const fullLoadouts = roomTriadLoadouts(fresh);
    if (!fullLoadouts) return;
    const events = await fetchTriadEvents(roomId);
    setChat(events.filter((evt) => evt.action.type === "CHAT"));
    let replay = createTriadMatch(fullLoadouts, fresh.seed);
    for (const evt of events) {
      if (evt.action.type !== "CHAT") replay = reduceTriad(replay, evt.action as TriadAction, fullLoadouts);
    }
    setMatch((current) => current && JSON.stringify(current) === JSON.stringify(replay) ? current : replay);
  }, []);

  useEffect(() => {
    if (!privateMode || !room?.id) return;
    let disposed = false;
    let fetching = false;
    const refresh = async () => {
      if (fetching || disposed) return;
      fetching = true;
      try { await refreshRoom(room.id); } catch (caught) {
        if (!disposed) setError(caught instanceof Error ? caught.message : "Ошибка синхронизации.");
      } finally { fetching = false; }
    };
    const unsubscribe = subscribeTriadRoom(room.id, () => { void refresh(); });
    const interval = window.setInterval(() => { void refresh(); }, 1400);
    void refresh();
    return () => { disposed = true; window.clearInterval(interval); unsubscribe(); };
  }, [privateMode, room?.id, refreshRoom]);

  useEffect(() => {
    if (privateMode || !match || roulettePresentation ||
      match.phase === "ended" || match.phase === "between" || match.active === "a") return;
    const pause = match.phase === "roll" ? 1050 : match.played === 0 ? 1450 : 780;
    const timer = window.setTimeout(() => {
      const action = chooseTriadBotAction(match);
      if (action.type === "PLAY") pendingFlight.current = captureTriadFlight(action, match);
      setMatch((current) => current && current.active === match.active &&
        current.phase !== "ended" && current.phase !== "between"
          ? reduceTriad(current, action, botLoadouts) : current);
    }, pause);
    return () => window.clearTimeout(timer);
  }, [privateMode, match, botLoadouts, roulettePresentation]);

  async function enterRoom(join: boolean) {
    if (ownLoadout.deck.length !== 20) { setError("Сначала собери колоду из 20 карт."); return; }
    setBusy(true); setError("");
    try {
      const id = await currentTriadUserId();
      const created = join ? await joinTriadRoom(roomCode, ownLoadout) : await createTriadRoom(ownLoadout);
      setUserId(id);
      setRoom(created);
      setSelectedId(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Ошибка соединения.");
    } finally { setBusy(false); }
  }

  const send = useCallback(async (action: TriadAction) => {
    if (busy || !match || roulettePresentation) return;
    if (action.type === "PLAY") pendingFlight.current = captureTriadFlight(action, match);
    if (!privateMode) {
      setMatch((current) => current ? reduceTriad(current, action, botLoadouts) : current);
      return;
    }
    if (!room || !loadouts) return;
    if (action.seat !== seat) return;
    setBusy(true); setError("");
    try {
      await sendTriadAction(room.id, action);
      await refreshRoom(room.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Ошибка действия.");
    } finally { setBusy(false); }
  }, [busy, match, privateMode, room, loadouts, seat, botLoadouts, refreshRoom, roulettePresentation]);

  async function sendChat() {
    const text = chatInput.trim().slice(0, 500);
    if (!text || !room) return;
    setBusy(true);
    try {
      await sendTriadAction(room.id, { type: "CHAT", seat, text });
      setChatInput("");
      await refreshRoom(room.id);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Чат недоступен."); }
    finally { setBusy(false); }
  }

  if (privateMode && !room) return (
    <main className="triad-page">
      <header className="triad-topbar"><button onClick={() => navigate("/play")} type="button">← АРЕНА</button>
        <h1>FRAKTUM • ТРИ ИГРОКА</h1></header>
      <section className="triad-lobby">
        <h2>Приватный матч 1×1×1</h2>
        <p>Каждый сам за себя. Побеждает первый, кто выиграет три боя.</p>
        <button type="button" onClick={() => void enterRoom(false)} disabled={busy}>СОЗДАТЬ КОМНАТУ</button>
        <p>Или войди по коду друга:</p>
        <div className="triad-lobby-join">
          <input aria-label="Код комнаты" maxLength={6} value={roomCode} placeholder="6-ЗНАЧНЫЙ КОД"
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())} />
          <button type="button" onClick={() => void enterRoom(true)} disabled={busy || roomCode.length !== 6}>ВОЙТИ</button>
        </div>
        {error && <p role="alert" className="triad-error">{error}</p>}
      </section>
    </main>
  );
  if (privateMode && room && !roomTriadLoadouts(room)) {
    return <main className="triad-page"><header className="triad-topbar">
      <button type="button" onClick={() => navigate("/play")}>← АРЕНА</button><h1>FRAKTUM • ОЖИДАНИЕ</h1></header>
      <section className="triad-lobby"><h2>КОД КОМНАТЫ: <strong>{room.invite_code}</strong></h2>
        <p>Передай код двум друзьям. Матч начнётся после подключения всех троих.</p>
        <p>Участники: {room.snapshot_a.name} · {room.snapshot_b?.name ?? "ожидание"} · {room.snapshot_c?.name ?? "ожидание"}</p>
        {error && <p role="alert" className="triad-error">{error}</p>}
      </section></main>;
  }
  if (!match || !loadouts) return <main className="triad-page">Загрузка арены…</main>;

  const hero = match.players[seat];
  const order = TRIAD_SEATS.indexOf(seat);
  const left: TriadSeat = TRIAD_SEATS[(order + 1) % 3];
  const right: TriadSeat = TRIAD_SEATS[(order + 2) % 3];
  const activeTurn = match.active === seat && !hero.eliminated;
  const specialCards = [
    ...(match.rouletteEvent === "BLIND_TOP" ? hero.deck.slice(0, 1) : []),
    ...(match.discardPlay ? hero.discard : []),
    ...(match.borrowedCard ? match.players[match.borrowedCard.seat].deck.filter((c) => c.instanceId === match.borrowedCard?.cardId) : []),
  ];
  const selected = [...hero.hand, ...specialCards].find((card) => card.instanceId === selectedId);
  const canAct = !busy && !roulettePresentation && activeTurn && match.phase === "main";
  const displayField = (owner: TriadSeat, lane: TriadLane, label: string, allowPlay: boolean) => {
    const p = match.players[owner];
    const slots = lane === "support" ? p.support : p.lanes[lane];
    return <div className={"triad-field-line" + (allowPlay ? " is-mine" : "")}
      key={owner + "-" + lane} data-triad-direction={lane}>
      <span className="triad-field-label">{label}</span>
      <div className="triad-field-cards">{slots.map((card, slot) => {
        const supportSlot = hero.support.findIndex((item) => !item);
        const healingTarget = Boolean(allowPlay && selected?.definition.id === "healing" &&
          lane !== "support" && card && card.hp < (Number(card.definition.health) || 0) &&
          supportSlot >= 0 && triadCanPlay(match, seat, selected, "support", supportSlot));
        const regularTarget = Boolean(allowPlay && selected &&
          !["healing", "clean_sheet"].includes(selected.definition.id) &&
          triadCanPlay(match, seat, selected, lane, slot));
        const permitted = healingTarget || regularTarget;
        return <TriadSlot key={owner + "-" + lane + "-" + slot + "-" + (card?.instanceId ?? "empty")}
          card={card} seat={owner} lane={lane} index={slot} playable={permitted}
          onActivate={() => {
            if (!selected) return;
            if (healingTarget && lane !== "support") {
              void send({ type: "PLAY", seat, cardId: selected.instanceId,
                lane: "support", slot: supportSlot, targetSeat: lane, targetSlot: slot });
            } else {
              if (lane !== "support" && (selected.definition.id === "oracle" ||
                selected.definition.id === "dragon_eye")) {
                setOracleSeat(lane);
                setRevealLimit(selected.definition.id === "dragon_eye" ? 1 : 99);
                setFlipped([]);
              }
              void send({ type: "PLAY", seat, cardId: selected.instanceId, lane, slot });
            }
            setSelectedId(null);
          }} />;
      })}</div>
    </div>;
  };
  const section = (owner: TriadSeat, side: "left" | "right" | "bottom") => (
    <div className={"triad-player-block is-" + side + (match.active === owner ? " is-active" : "")}>
      <div className="triad-player-title">{match.players[owner].name}
        <b>ПОБЕДЫ {match.players[owner].victories}/{TRIAD_VICTORIES_TO_WIN}</b></div>
      {owner !== seat ? <BackHand side={side === "bottom" ? "left" : side}
        seat={owner} cards={match.players[owner].hand}
        revealed={oracleSeat === owner} flipped={flipped}
        onFlip={(id) => setFlipped((current) => current.includes(id) || current.length >= revealLimit ? current : [...current, id])} /> : null}
      <TriadHeroMeters seat={owner} player={match.players[owner]} />
      <TriadPiles seat={owner} side={side} player={match.players[owner]}
        canBlindPlay={owner === seat && canAct && match.rouletteEvent === "BLIND_TOP" &&
          match.players[owner].deck.length > 0}
        onBlindPlay={() => setSelectedId(match.players[owner].deck[0]?.instanceId ?? null)} />
      <div className="triad-player-fields">
        {displayField(owner, owner === seat ? left : seat, "НА " + match.players[owner === seat ? left : seat].name, owner === seat)}
        {displayField(owner, owner === seat ? right : triadRivals(owner).find((s) => s !== seat)!,
          "НА " + match.players[owner === seat ? right : triadRivals(owner).find((s) => s !== seat)!].name, owner === seat)}
        {displayField(owner, "support", "СВОИ / ВСЕ", owner === seat)}
      </div>
      {match.players[owner].eliminated && <span className="triad-out">ВЫБЫЛ</span>}
    </div>
  );

  return <main className="triad-page">
    <header className="triad-topbar">
      <button type="button" onClick={() => navigate("/play")}>← АРЕНА</button>
      <strong>FRAKTUM · 1×1×1</strong>
      <span>БОЙ {match.battle} · {namesForSeats(match)}</span>
      {room && <span>КОД {room.invite_code}</span>}
    </header>
    <div className="triad-arena">
      <svg className="triad-board-geometry" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true">
        <path className="triad-board-outline" d="M 480 22 H 1120 L 1580 385 L 1180 878 H 420 L 20 385 Z" />
        <path className="triad-board-inner" d="M 655 180 H 945 L 1060 468 L 932 630 H 668 L 540 468 Z" />
        <path className="triad-board-divider" d="M 800 180 V 359 M 540 468 L 800 359 L 1060 468 M 800 359 V 630" />
      </svg>
      <div className="triad-left-hand-side">{section(left, "left")}</div>
      <div className="triad-right-hand-side">{section(right, "right")}</div>
      <div className="triad-center-device">
        <D20View dramaticMotion
          value={match.roll ?? undefined}
          disabled={!activeTurn || match.phase !== "roll" || busy || Boolean(roulettePresentation)}
          onRoll={() => void send({ type: "ROLL", seat })}
          externalRollKey={match.roll !== null && match.active !== seat
            ? match.battle + ":" + match.round + ":" + match.active : undefined}
        />
        <div className="triad-dice-caption">{match.phase === "roll"
          ? "НАЖМИ НА D20" : match.roll !== null ? "ВЫПАЛО: " + match.roll : "КУБИК СУДЬБЫ"}</div>
        {match.rouletteEvent && <small>СОБЫТИЕ: {match.rouletteEvent.replace(/_/g, " ")}</small>}
        <b>{match.phase === "ended" ? "ПОБЕДИТЕЛЬ: " + match.players[match.winner!].name :
          match.phase === "between" ? "БОЙ ОКОНЧЕН" :
          "ХОД: " + match.players[match.active].name}</b>
      </div>
      <div key={match.battle + ":" + match.round + ":" + match.active}
        className={"triad-turn-sweep" + (match.active === seat ? " is-self" : "")}
        role="status" aria-live="polite">ХОД: {match.players[match.active].name}</div>
      <div className="triad-bottom-field">{section(seat, "bottom")}</div>

      <div className="triad-controls">
        <span>ВОЛЯ {hero.will}/{hero.maxWill} · КАРТЫ {match.played}/{match.playLimit}</span>
        {match.phase === "roll" && activeTurn && <span className="triad-roll-tip">БРОСЬ КУБИК В ЦЕНТРЕ</span>}
        {match.phase === "main" && activeTurn && match.awakeningPending && <>
          <button type="button" disabled={busy} onClick={() => void send({ type: "CHOOSE_AWAKENING", seat, choice: "freeCard" })}>ПРОБУЖДЕНИЕ: БЕСПЛАТНАЯ КАРТА</button>
          <button type="button" disabled={busy || !triadRivals(seat).some((r) => hero.lanes[r].some(Boolean)) && !hero.support.some(Boolean)}
            onClick={() => void send({ type: "CHOOSE_AWAKENING", seat, choice: "passive" })}>ПОВТОРИТЬ ЭФФЕКТ</button>
        </>}
        {match.phase === "main" && activeTurn && <button type="button" disabled={busy || match.awakeningPending}
          onClick={() => { setOracleSeat(null); setFlipped([]); void send({ type: "END", seat }); }}>ЗАКОНЧИТЬ ХОД</button>}
        {match.phase === "between" && seat === "a" &&
          <button type="button" disabled={busy} onClick={() => void send({ type: "NEXT", seat })}>СЛЕДУЮЩИЙ БОЙ</button>}
        {match.phase === "between" && seat !== "a" && <span>Ожидание нового боя от хозяина комнаты</span>}
        {match.phase === "ended" && <span>ПОБЕДА: {match.players[match.winner!].name}</span>}
      </div>
      <div className="triad-hand" role="group" aria-label="Ваша рука">
        {[...hero.hand, ...specialCards].map((card) => {
          const faceDown = match.rouletteEvent === "HIDDEN_HAND" &&
            hero.hand.some((entry) => entry.instanceId === card.instanceId);
          const disabled = !canAct || (match.rouletteEvent === "BLIND_TOP" &&
            hero.hand.some((entry) => entry.instanceId === card.instanceId));
          return <div key={card.instanceId} data-triad-hand-card={card.instanceId}
            className={"triad-hand-card" + (selectedId === card.instanceId ? " is-selected" : "")}>
            <CardView card={triadToMatchCard(card, "player")} size="hand" faceDown={faceDown}
              effectiveCost={triadEffectiveCost(match, seat, card)} selected={selectedId === card.instanceId}
              disabled={disabled} onClick={() => {
                if (selected?.definition.id === "clean_sheet" && selected.instanceId !== card.instanceId &&
                  hero.hand.some((entry) => entry.instanceId === card.instanceId)) {
                  const slot = hero.support.findIndex((entry) => !entry);
                  if (slot >= 0 && triadCanPlay(match, seat, selected, "support", slot)) {
                    void send({ type: "PLAY", seat, cardId: selected.instanceId, lane: "support", slot,
                      targetCardId: card.instanceId });
                    setSelectedId(null);
                  }
                  return;
                }
                setSelectedId(selectedId === card.instanceId ? null : card.instanceId);
              }} />
          </div>;
        })}
      </div>
      <MatchPresentationLayer turnAnnouncement={null} roulettePresentation={roulettePresentation}
        opponentName={match.players[match.active].name} isOnlineMode={privateMode}
        onRouletteComplete={closeRoulette} />
      <TriadCombatMotion match={match} pendingFlight={pendingFlight} />
    </div>
    <div className="triad-info-panel">
      <div className="triad-log"><b>ЖУРНАЛ БОЯ</b>
        {match.log.slice(-8).map((line, i) => <p key={i}>{line}</p>)}</div>
      <div className="triad-chat"><b>ЧАТ МАТЧА</b>
        {privateMode ? <>
          <div className="triad-chat-messages">{chat.slice(-12).map((event) =>
            <p key={event.id}>{event.actor.toUpperCase()}: {"text" in event.action ? event.action.text : ""}</p>)}</div>
          <form onSubmit={(e) => { e.preventDefault(); void sendChat(); }}>
            <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} maxLength={500}
              placeholder="Сообщение игрокам" aria-label="Сообщение" />
            <button disabled={busy || !chatInput.trim()} type="submit">ОТПРАВИТЬ</button>
          </form></> : <p>Тренировка против двух ботов.</p>}</div>
    </div>
    {selected && <p className="triad-tip">Выбрана карта: {match.rouletteEvent === "HIDDEN_HAND" ? "СКРЫТА" : cardTitle(selected)}. Нажми на свободный слот нужного направления.
      {selected.definition.id === "healing" ? " Выбери свою повреждённую карту для лечения." : selected.definition.id === "clean_sheet" ? " Нажми на другую карту в руке, которую хочешь сбросить." : triadIsSupport(selected) ? " Эта карта используется в зоне СВОИ / ВСЕ." : ""}</p>}
    {error && <p className="triad-error" role="alert">{error}</p>}
  </main>;
}
