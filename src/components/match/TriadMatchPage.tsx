import { useCallback, useEffect, useMemo, useState } from "react";
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
import "./triad-arena.css";

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

function Slot({ card, selected, disabled, onClick, label }: {
  card: TriadCard | null; selected?: boolean; disabled?: boolean; onClick?: () => void; label: string;
}) {
  return (
    <button type="button" className={"triad-slot" + (selected ? " is-ready" : "") + (card ? " is-filled" : "")}
      onClick={onClick} disabled={disabled} title={card ? cardTitle(card) + " · HP " + card.hp : label}>
      {card ? <><img src={cardImage(card)} alt={cardTitle(card)} draggable={false} />
        {card.definition.health > 0 ? <span className="triad-slot-hp">{card.hp} HP</span> : null}</> :
        <span className="triad-slot-empty">✧</span>}
    </button>
  );
}
function BackHand({ cards, revealed, flipped, onFlip }: {
  cards: TriadCard[]; revealed: boolean; flipped: string[]; onFlip: (id: string) => void;
}) {
  return <div className="triad-rival-hand">
    {cards.map((card) => {
      const show = revealed && flipped.includes(card.instanceId);
      return <button key={card.instanceId} className="triad-back" type="button"
        onClick={() => revealed && onFlip(card.instanceId)} disabled={!revealed}
        title={show ? cardTitle(card) : "Рубашка карты"}>
        <img draggable={false} src={show ? cardImage(card) : cardBack} alt={show ? cardTitle(card) : "Скрытая карта"} />
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
  const seat: TriadSeat = privateMode && room && userId
    ? seatForTriadRoom(room, userId) ?? "a" : "a";
  const loadouts = privateMode && room ? roomTriadLoadouts(room) : botLoadouts;

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
    if (privateMode || !match || match.phase === "ended" || match.phase === "between" || match.active === "a") return;
    const timer = window.setTimeout(() => {
      setMatch((current) => current && current.active !== "a" && current.phase !== "ended" && current.phase !== "between"
        ? reduceTriad(current, chooseTriadBotAction(current), botLoadouts) : current);
    }, 520);
    return () => window.clearTimeout(timer);
  }, [privateMode, match, botLoadouts]);

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
    if (busy || !match) return;
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
  }, [busy, match, privateMode, room, loadouts, seat, botLoadouts, refreshRoom]);

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
  const canAct = !busy && activeTurn && match.phase === "main";
  const displayField = (owner: TriadSeat, lane: TriadLane, label: string, allowPlay: boolean) => {
    const p = match.players[owner];
    const slots = lane === "support" ? p.support : p.lanes[lane];
    return <div className={"triad-field-line" + (allowPlay ? " is-mine" : "")} key={owner + "-" + lane}>
      <span className="triad-field-label">{label}</span>
      <div className="triad-field-cards">{slots.map((card, slot) => {
        const supportSlot = hero.support.findIndex((item) => !item);
        const healingTarget = Boolean(allowPlay && selected?.definition.id === "healing" &&
          lane !== "support" && card && supportSlot >= 0 &&
          triadCanPlay(match, seat, selected, "support", supportSlot));
        const regularTarget = Boolean(allowPlay && selected && !["healing", "clean_sheet"].includes(selected.definition.id) &&
          triadCanPlay(match, seat, selected, lane, slot));
        const permitted = healingTarget || regularTarget;
        return <Slot key={slot} card={card} label={label + " " + (slot + 1)}
          selected={permitted} disabled={!permitted}
          onClick={() => {
            if (!selected) return;
            if (healingTarget && lane !== "support") {
              void send({ type: "PLAY", seat, cardId: selected.instanceId,
                lane: "support", slot: supportSlot, targetSeat: lane, targetSlot: slot });
            } else {
              if (lane !== "support" && (selected.definition.id === "oracle" || selected.definition.id === "dragon_eye")) {
                setOracleSeat(lane); setRevealLimit(selected.definition.id === "dragon_eye" ? 1 : 99); setFlipped([]);
              }
              void send({ type: "PLAY", seat, cardId: selected.instanceId, lane, slot });
            }
            setSelectedId(null);
          }} />;
      })}
      </div>
    </div>;
  };
  const section = (owner: TriadSeat, side: "left" | "right" | "bottom") => (
    <div className={"triad-player-block is-" + side + (match.active === owner ? " is-active" : "")}>
      <div className="triad-player-title">{match.players[owner].name} <b>HP {match.players[owner].hp}</b>
        <b>🛡 {match.players[owner].shield}</b>
        <b>ПОБЕДЫ {match.players[owner].victories}/{TRIAD_VICTORIES_TO_WIN}</b></div>
      {owner !== seat ? <BackHand cards={match.players[owner].hand}
        revealed={oracleSeat === owner} flipped={flipped}
        onFlip={(id) => setFlipped((current) => current.includes(id) || current.length >= revealLimit ? current : [...current, id])} /> : null}
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
      <div className="triad-left-hand-side">{section(left, "left")}</div>
      <div className="triad-right-hand-side">{section(right, "right")}</div>
      <div className="triad-center-device">
        <div className="triad-fate-triangle"><span className="triad-d20">D20</span></div>
        <small>{match.roll === null ? "РУЛЕТКА СУДЬБЫ" : "D20: " + match.roll}</small>
        {match.rouletteEvent && <small>СОБЫТИЕ: {match.rouletteEvent}</small>}
        <b>{match.phase === "ended" ? "ПОБЕДИТЕЛЬ: " + match.players[match.winner!].name :
          match.phase === "between" ? "БОЙ ОКОНЧЕН" :
          "ХОД: " + match.players[match.active].name}</b>
      </div>
      <div className="triad-bottom-field">{section(seat, "bottom")}</div>
      <div className="triad-deck-zone">
        <img src={cardBack} alt="Ваша колода" />
        <span>КОЛОДА {hero.deck.length}</span>
        {match.rouletteEvent === "BLIND_TOP" && activeTurn && hero.deck.length > 0 &&
          <button type="button" onClick={() => setSelectedId(hero.deck[0].instanceId)}>ВЕРХНЯЯ КАРТА</button>}
      </div>
      <div className="triad-discard-zone">
        <img src={hero.discard.length ? cardImage(hero.discard[hero.discard.length - 1]) : cardBack} alt="Сброс" />
        <span>СБРОС {hero.discard.length}</span>
      </div>
      <div className="triad-controls">
        <span>HP {hero.hp}/{hero.maxHp} · ЩИТ {hero.shield}</span>
        <span>ВОЛЯ {hero.will}/{hero.maxWill} · КАРТЫ {match.played}/{match.playLimit}</span>
        {match.phase === "roll" && activeTurn && <button type="button" disabled={busy}
          onClick={() => void send({ type: "ROLL", seat })}>БРОСИТЬ D20</button>}
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
      <div className="triad-hand">
        {[...hero.hand, ...specialCards].map((card) => <button key={card.instanceId} type="button"
          className={"triad-hand-card" + (selectedId === card.instanceId ? " is-selected" : "")}
          onClick={() => {
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
          }}
          disabled={!canAct || (match.rouletteEvent === "BLIND_TOP" && hero.hand.some((c) => c.instanceId === card.instanceId))}
          title={match.rouletteEvent === "HIDDEN_HAND" ? "Скрытая карта" : cardTitle(card) + " · " + getWillCostByRarity(card.definition.rarity) + " Воли"}>
          <img src={match.rouletteEvent === "HIDDEN_HAND" && hero.hand.some((c) => c.instanceId === card.instanceId) ? cardBack : cardImage(card)}
            alt={match.rouletteEvent === "HIDDEN_HAND" ? "Карта скрыта Рулеткой судьбы" : cardTitle(card)} draggable={false} />
          <small>{triadEffectiveCost(match, seat, card)}</small>
        </button>)}
      </div>
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
