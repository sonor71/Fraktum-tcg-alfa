import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { BATTLE_PASS_MAX_LEVEL, BATTLE_PASS_REWARDS, BATTLE_PASS_XP_STEP, useGameStore, type BattlePassChestDrop } from "../useGameStore";
import { getPackById } from "../data/packs";
import "./fraktum-pass.css";

/* Every tile below comes from the user's «нормальные текстуры (4).zip».
 * The bundled atlas stores the original sprites and ordered animation frames;
 * nothing in this screen attempts to repaint or stretch the source pixels. */
const ATLAS = "/ui/fraktum/pass/pass-atlas.webp";
const ATLAS_WIDTH = 1024;
const ATLAS_HEIGHT = 512;
const PASS_LEVELS = BATTLE_PASS_MAX_LEVEL;
const PASS_XP_STEP = BATTLE_PASS_XP_STEP;
const TRACK_SCALE = 2;
const TRACK_TOP = 146;
const NOTCH_X = [44, 106, 160, 232] as const;
// The original pixel segments are repeated without stretching any image.
const TRACK_PARTS = ["track0", ...Array.from({ length: 6 }, () => "track1"), "track2"];
const TRACK_WIDTHS = TRACK_PARTS.map((part) => (part === "track1" ? 256 : 252) * TRACK_SCALE);
const TRACK_STARTS = TRACK_WIDTHS.map((_, index) => TRACK_WIDTHS.slice(0, index).reduce((total, width) => total + width, 0));
const TRACK_LENGTH = TRACK_WIDTHS.reduce((total, width) => total + width, 0);
function notchForLevel(level: number) {
  const slot = Math.max(0, level - 1);
  const segment = Math.floor(slot / 4);
  return TRACK_STARTS[segment] + NOTCH_X[slot % 4] * TRACK_SCALE;
}

type Tile = { x: number; y: number; w: number; h: number };
type Reward = (typeof BATTLE_PASS_REWARDS)[number];

const TILES: Record<string, Tile> = {
  coin: { x: 768, y: 96, w: 32, h: 32 },
  coins: { x: 800, y: 96, w: 48, h: 48 },
  chest: { x: 848, y: 96, w: 64, h: 64 },
  claim: { x: 768, y: 160, w: 98, h: 48 },
  lvl: { x: 878, y: 160, w: 4, h: 8 },
  lineFill: { x: 768, y: 256, w: 40, h: 12 },
  lineTail: { x: 808, y: 256, w: 24, h: 12 },
  track0: { x: 0, y: 256, w: 252, h: 44 },
  track1: { x: 256, y: 256, w: 256, h: 44 },
  track2: { x: 512, y: 256, w: 252, h: 44 },
};

function tileFor(name: string): Tile {
  const staticTile = TILES[name];
  if (staticTile) return staticTile;
  const disc = /^disc(10|[1-9])$/.exec(name);
  if (disc) {
    const index = Number(disc[1]) - 1;
    return { x: 768 + (index % 5) * 48, y: Math.floor(index / 5) * 48, w: 48, h: 48 };
  }
  const frame = /^(chestOpen|coinSpin|rewardBurst)-(\d+)$/.exec(name);
  if (frame) {
    const number = Number(frame[2]);
    const origin = frame[1] === "coinSpin" ? 256 : frame[1] === "rewardBurst" ? 512 : 0;
    return { x: origin + (number % 4) * 64, y: Math.floor(number / 4) * 64, w: 64, h: 64 };
  }
  return TILES.coin;
}

function Sprite({ name, scale = 2, className = "", style }: {
  name: string;
  scale?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const tile = tileFor(name);
  return <span aria-hidden="true" className={`fpSprite ${className}`} style={{
    display: "inline-block", flex: "none", width: tile.w * scale, height: tile.h * scale,
    backgroundImage: `url('${ATLAS}')`,
    backgroundSize: `${ATLAS_WIDTH * scale}px ${ATLAS_HEIGHT * scale}px`,
    backgroundPosition: `${-tile.x * scale}px ${-tile.y * scale}px`,
    backgroundRepeat: "no-repeat", imageRendering: "pixelated", ...style,
  }} />;
}

function AnimatedSprite({ kind, frames, scale = 3, interval = 90, className = "" }: {
  kind: "coinSpin" | "chestOpen" | "rewardBurst";
  frames: number;
  scale?: number;
  interval?: number;
  className?: string;
}) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setFrame((previous) => Math.min(frames - 1, previous + 1));
    }, interval);
    return () => window.clearInterval(timer);
  }, [frames, interval]);
  return <Sprite name={`${kind}-${frame}`} scale={scale} className={className} />;
}

function kindLabel(reward: Reward) {
  if (reward.kind === "coins") return String(reward.amount) + " монет";
  if (reward.kind === "premium") return String(reward.amount) + " premium";
  if (reward.kind === "pack") return getPackById(reward.packId).title;
  if (reward.kind === "chest") return "Сундук наград";
  const names: Record<string, string> = {
    rare: "Редкая карта", epic: "Эпическая карта", mythic: "Мифическая карта",
    legendary: "Легендарная карта", exotic: "Экзотическая карта",
  };
  return names[reward.rarity] ?? "Карта";
}

function PackSprite({ packId, scale = 2 }: { packId: string; scale?: number }) {
  const pack = getPackById(packId);
  const [source, setSource] = useState(pack.artSrc);
  useEffect(() => setSource(pack.artSrc), [pack.artSrc]);
  return <img className="fpPackArt" alt="" src={source} draggable={false}
    style={{ width: 30 * scale, height: 40 * scale }}
    onError={() => { if (source !== pack.fallbackArtSrc) setSource(pack.fallbackArtSrc); }} />;
}

function rewardIcon(reward: Reward, scale = 2) {
  if (reward.kind === "pack") return <PackSprite packId={reward.packId} scale={scale} />;
  if (reward.kind === "chest" || reward.kind === "card") return <Sprite name="chest" scale={scale} />;
  if (reward.kind === "premium") return <Sprite name="coin" scale={scale + .15} className="fpPremiumCoin" />;
  return <Sprite name={reward.amount >= 200 ? "coins" : "coin"} scale={scale} />;
}

function chestDropLabel(drop: BattlePassChestDrop) {
  if (drop.kind === "coins") return String(drop.amount) + " монет";
  if (drop.kind === "disc") return "Музыкальный диск " + String(drop.discId).padStart(2, "0");
  return drop.cardTitle;
}

const REWARDS = Array.from({ length: PASS_LEVELS }, (_, i) => ({ level: i + 1, reward: BATTLE_PASS_REWARDS[i + 1] }));

export default function FraktumPass() {
  const navigate = useNavigate();
  const track = useRef<HTMLDivElement>(null);
  const xp = useGameStore((s) => s.battlePassXp);
  const coins = useGameStore((s) => s.coins);
  const premium = useGameStore((s) => s.premium);
  const claimed = useGameStore((s) => s.claimedBattlePassRewards);
  const ownedDiscs = useGameStore((s) => s.ownedMusicDiscs);
  const claimReward = useGameStore((s) => s.claimBattlePassReward);
  const currentLevel = Math.min(PASS_LEVELS, Math.floor(xp / PASS_XP_STEP) + 1);
  // Track fill is locked to the exact pixel-notch positions and original 12px groove.
  const fillWidth = currentLevel === PASS_LEVELS ? TRACK_LENGTH : Math.min(TRACK_LENGTH, notchForLevel(currentLevel) + (xp % PASS_XP_STEP) / PASS_XP_STEP * (notchForLevel(currentLevel + 1) - notchForLevel(currentLevel)));
  const xpIntoLevel = currentLevel === PASS_LEVELS ? PASS_XP_STEP : xp % PASS_XP_STEP;
  const [selected, setSelected] = useState(1);
  const [activeDisc, setActiveDisc] = useState(1);
  const [reveal, setReveal] = useState<{ reward: Reward; level: number; cardName?: string; chestDrop?: BattlePassChestDrop } | null>(null);
  const [notice, setNotice] = useState("");
  const selectedReward = BATTLE_PASS_REWARDS[selected];
  const isClaimed = claimed.includes(selected);
  const canClaim = selected <= currentLevel && !isClaimed;

  useEffect(() => {
    if (!reveal) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setReveal(null); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [reveal]);

  const moveTrack = (direction: number) => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.current?.scrollBy({ left: direction * 520, behavior: reduced ? "auto" : "smooth" });
  };

  function handleClaim() {
    if (!selectedReward || !canClaim) return;
    const beforeCardIds = new Set(useGameStore.getState().ownedCards.map((card) => card.instanceId));
    const success = claimReward(selected);
    if (!success) {
      setNotice("Награду пока нельзя получить. Проверь опыт пасса и состояние инвентаря.");
      return;
    }
    const newCard = useGameStore.getState().ownedCards.find((card) => !beforeCardIds.has(card.instanceId));
    setReveal({ reward: selectedReward, level: selected, cardName: newCard?.title,
      chestDrop: useGameStore.getState().battlePassChestDrops[selected] });
    setNotice("");
  }

  return <section className="fpRoot" aria-label="FRAKTUM PASS">
    <div className="fpBackdrop" aria-hidden="true">
      <svg viewBox="0 0 256 144" preserveAspectRatio="xMidYMid slice">
        <image href={ATLAS} x="0" y="-320" width="1024" height="512" style={{ imageRendering: "pixelated" }} />
      </svg>
    </div>
    <div className="fpContents">
      <header className="fpHeader">
        <div className="fpHeading">
          <button className="fpBack" type="button" onClick={() => navigate("/")}>‹ НАЗАД</button>
          <div><span className="fpKicker">НАГРАДЫ ЗА МАТЧИ</span><h1>FRAKTUM PASS</h1>
            <p>Получай опыт в матчах, открывай уровни и забирай награды.</p></div>
        </div>
        <div className="fpCounters">
          <div className="fpBalance"><Sprite name="coin" scale={1.1} /><span>{coins.toLocaleString("ru-RU")} <small>МОНЕТ</small></span></div>
          <div className="fpBalance fpBalance--premium"><Sprite name="coin" scale={1.1} /><span>{premium.toLocaleString("ru-RU")} <small>PREMIUM</small></span></div>
        </div>
      </header>
      <div className="fpProgressInfo">
        <div className="fpLevel"><strong>УРОВЕНЬ {currentLevel}</strong><span>{currentLevel === PASS_LEVELS ? "Все уровни открыты" : `${xpIntoLevel} / ${PASS_XP_STEP} XP до следующего уровня`}</span></div>
        <div className="fpProgressSummary"><span>ОПЫТ ПАССА</span><strong>{xp.toLocaleString("ru-RU")} XP</strong><span>Получено наград: {claimed.length} / {PASS_LEVELS}</span></div>
      </div>
      <section className="fpRailSection" aria-label="Линия наград пасса">
        <div className="fpRailHead"><h2>ПУТЬ НАГРАД</h2><div className="fpRailNavigation"><button onClick={() => moveTrack(-1)} aria-label="Предыдущие уровни" type="button">‹</button><span>ПРОКРУЧИВАЙ ЛИНИЮ</span><button onClick={() => moveTrack(1)} aria-label="Следующие уровни" type="button">›</button></div></div>
        <div className="fpTrackScroll" ref={track} tabIndex={0} aria-label="Прокручиваемая линия уровней">
          <div className="fpTrackFlow" style={{ width: TRACK_LENGTH }}>
            <div className="fpTrackFill" style={{ top: TRACK_TOP + 32, width: fillWidth }}>
              {Array.from({ length: Math.ceil(TRACK_LENGTH / (40 * TRACK_SCALE)) + 1 }, (_, n) => <Sprite key={n} name="lineFill" scale={TRACK_SCALE} />)}
              <Sprite name="lineTail" scale={TRACK_SCALE} />
            </div>
            <div className="fpTrackImage" style={{ top: TRACK_TOP }}>
              {TRACK_PARTS.map((part, index) => <Sprite key={index} name={part} scale={TRACK_SCALE} />)}
            </div>
            {REWARDS.map(({ level, reward }) => {
              const local = (level - 1) % 4;
              const point = notchForLevel(level);
              const top = local % 2 === 0;
              const locked = level > currentLevel;
              const taken = claimed.includes(level);
              const active = selected === level;
              return <div key={level}>
                <Sprite name="lvl" scale={3} className={`fpNotch ${locked ? "is-locked" : "is-unlocked"}`}
                  style={{ position: "absolute", left: point - 6, top: top ? TRACK_TOP - 12 : TRACK_TOP + 77, zIndex: 4 }} />
                <button type="button"
                  className={`fpRewardNode ${top ? "is-top" : "is-bottom"} ${active ? "is-selected" : ""} ${locked ? "is-locked" : ""} ${taken ? "is-taken" : ""}`}
                  style={{ left: point - 53, top: top ? 4 : 242 }}
                  onClick={() => { setSelected(level); setNotice(""); }}
                  aria-label={`Уровень ${level}: ${kindLabel(reward)}. ${taken ? "Получено" : locked ? "Закрыто" : "Доступно"}`} aria-pressed={active}>
                  <span className="fpRewardLevel">{String(level).padStart(2, "0")}</span>
                  <span className="fpRewardVisual">{rewardIcon(reward, reward.kind === "pack" ? 1.45 : reward.kind === "chest" || reward.kind === "card" ? 1.3 : reward.kind === "coins" && reward.amount >= 200 ? 1.5 : 1.9)}</span>
                  <span className="fpRewardLabel">{kindLabel(reward)}</span>
                  <span className="fpRewardStatus">{taken ? "ПОЛУЧЕНО ✓" : locked ? "ЗАКРЫТО" : "МОЖНО ЗАБРАТЬ"}</span>
                </button>
              </div>;
            })}
          </div>
        </div>
      </section>
      <section className="fpDetail" aria-label="Выбранная награда">
        <div className="fpDetailIcon">{selectedReward ? rewardIcon(selectedReward, selectedReward.kind === "pack" ? 2 : selectedReward.kind === "chest" || selectedReward.kind === "card" ? 1.35 : 2) : null}</div>
        <div className="fpDetailCopy"><span className="fpKicker">УРОВЕНЬ {selected} · {isClaimed ? "ПОЛУЧЕНО" : canClaim ? "ДОСТУПНО" : "ЗАКРЫТО"}</span>
          <h2>{selectedReward ? kindLabel(selectedReward) : "Награда"}</h2>
          <p>{selectedReward?.kind === "card" ? "При получении добавляется случайная карта указанной редкости в инвентарь."
            : selectedReward?.kind === "pack" ? "Настоящий пак из магазина. После получения ищи его в Инвентарь → Общий инвентарь → Паки."
            : selectedReward?.kind === "chest" ? "При открытии сундука выпадают монеты, случайная карта или одна из десяти коллекционных пластинок."
            : selectedReward?.kind === "premium" ? "Премиальная валюта начисляется на баланс." : "Игровые монеты начисляются на баланс."}</p></div>
        <button className="fpClaimButton" type="button" onClick={handleClaim} disabled={!canClaim} aria-label={canClaim ? `Получить: ${kindLabel(selectedReward)}` : isClaimed ? "Награда уже получена" : "Награда пока закрыта"}>
          <Sprite name="claim" scale={1.65} /><span>{isClaimed ? "ПОЛУЧЕНО" : canClaim ? "ПОЛУЧИТЬ" : "ЗАКРЫТО"}</span>
        </button>
      </section>
      {notice ? <div className="fpNotice" role="status">{notice}</div> : null}
      <section className="fpDiscs" aria-label="Примеры музыкальных дисков">
        <div className="fpDiscsHeading"><div><span className="fpKicker">КОЛЛЕКЦИОННЫЕ ПРЕДМЕТЫ</span><h2>МУЗЫКАЛЬНЫЕ ДИСКИ</h2></div><p>Собрано: {ownedDiscs.length} / 10 · Диски выпадают из сундуков пасса.</p></div>
        <div className="fpDiscRow">{Array.from({ length: 10 }, (_, index) => <button type="button" key={index}
          className={`fpDiscChoice ${activeDisc === index + 1 ? "is-active" : ""} ${ownedDiscs.includes(index + 1) ? "is-owned" : "is-locked"}`} onClick={() => setActiveDisc(index + 1)}
          aria-label={`Музыкальный диск ${index + 1}`} aria-pressed={activeDisc === index + 1}>
          <Sprite name={`disc${index + 1}`} scale={1.12}/><span>{String(index + 1).padStart(2, "0")}</span></button>)}</div>
        <p className="fpDiscNote">ВЫБРАН ДИСК {String(activeDisc).padStart(2, "0")} · {ownedDiscs.includes(activeDisc) ? "В КОЛЛЕКЦИИ" : "НЕ НАЙДЕН"}</p>
      </section>
    </div>
    {reveal ? <div className="fpRevealScrim" role="presentation" onClick={() => setReveal(null)}>
      <div className="fpRevealPanel" role="dialog" aria-modal="true" aria-label="Награда получена" onClick={(event) => event.stopPropagation()}>
        <span className="fpKicker">УРОВЕНЬ {reveal.level} ПРОЙДЕН</span><h2>НАГРАДА ПОЛУЧЕНА!</h2>
        <div className="fpRevealArt"><AnimatedSprite kind="rewardBurst" frames={15} scale={3.3} className="fpRevealBurst" />
          {reveal.reward.kind === "chest" ? <AnimatedSprite kind="chestOpen" frames={16} scale={3} className="fpRevealChest" />
            : reveal.reward.kind === "pack" ? <PackSprite packId={reveal.reward.packId} scale={3} />
            : reveal.reward.kind === "card" ? <Sprite name="chest" scale={3} className="fpRevealChest" />
            : reveal.reward.kind === "coins" ? <AnimatedSprite kind="coinSpin" frames={16} scale={3} className="fpRevealCoin" />
            : <Sprite name="coin" scale={4} className="fpPremiumCoin fpRevealCoin" />}</div>
        <strong>{reveal.chestDrop ? "ИЗ СУНДУКА: " + chestDropLabel(reveal.chestDrop) : reveal.cardName ?? kindLabel(reveal.reward)}</strong>
        {reveal.chestDrop ? <span className="fpDropNote">{reveal.chestDrop.kind === "disc" ? "Пластинка добавлена в музыкальную коллекцию."
          : reveal.chestDrop.kind === "card" ? "Карта добавлена в инвентарь." : "Монеты зачислены на баланс."}</span> : null}
        {reveal.reward.kind === "pack" ? <button type="button" className="fpRevealOpenPack"
          onClick={() => navigate("/inventory", { state: { view: "items" } })}>МОИ ПАКИ В ИНВЕНТАРЕ</button> : null}
        <button type="button" className="fpRevealClose" onClick={() => setReveal(null)}>ПРОДОЛЖИТЬ</button>
      </div>
    </div> : null}
  </section>;
}
