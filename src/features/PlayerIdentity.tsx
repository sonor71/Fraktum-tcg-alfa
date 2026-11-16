import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useGameStore } from "../useGameStore";

export const FRAMES = [
  { id: "steel", label: "Странник", color: "#82b7c9" },
  { id: "arcane", label: "Аркана", color: "#b799f0" },
  { id: "emerald", label: "Изумруд", color: "#80dda9" },
  { id: "ruby", label: "Рубин", color: "#f18b99" },
  { id: "gold", label: "Королевская", color: "#f4cd78" },
] as const;
export const BANNERS = [
  { id: "night", label: "Ночной свод" },
  { id: "crystal", label: "Кристальный храм" },
  { id: "ember", label: "Пепельный рассвет" },
] as const;
export const TITLES = [
  { id: "wanderer", label: "Искатель", detail: "Стартовый титул", minLevel: 1, minWins: 0, minCards: 0 },
  { id: "collector", label: "Хранитель карт", detail: "От 15 карт в коллекции", minLevel: 1, minWins: 0, minCards: 15 },
  { id: "winner", label: "Победитель", detail: "Первая победа", minLevel: 1, minWins: 1, minCards: 0 },
  { id: "adept", label: "Адепт", detail: "10-й уровень", minLevel: 10, minWins: 0, minCards: 0 },
  { id: "veteran", label: "Ветеран арены", detail: "20 побед", minLevel: 1, minWins: 20, minCards: 0 },
] as const;

export type FrameId = (typeof FRAMES)[number]["id"];
export type BannerId = (typeof BANNERS)[number]["id"];
export type TitleId = (typeof TITLES)[number]["id"];
export type MusicTrack = "cycle" | "main" | "crown";

type IdentityState = {
  frame: FrameId;
  banner: BannerId;
  title: TitleId;
  bio: string;
  musicTrack: MusicTrack;
  setFrame: (id: FrameId) => void;
  setBanner: (id: BannerId) => void;
  setTitle: (id: TitleId) => void;
  setBio: (text: string) => void;
  setMusicTrack: (track: MusicTrack) => void;
};

/** Cosmetic preferences are browser-local; only the game-store avatar/name
 * participate in the existing cloud sync. Never claim cosmetic sync online. */
export const useIdentity = create<IdentityState>()(
  persist((set) => ({
    frame: "steel", banner: "night", title: "wanderer", bio: "",
    musicTrack: "cycle",
    setFrame: (frame) => set({ frame }),
    setBanner: (banner) => set({ banner }),
    setTitle: (title) => set({ title }),
    setBio: (bio) => set({ bio: bio.slice(0, 140) }),
    setMusicTrack: (musicTrack) => set({ musicTrack }),
  }), { name: "fraktum-identity-v1" })
);

export function canUseTitle(id: TitleId, level: number, wins: number, cardCount: number) {
  const title = TITLES.find((item) => item.id === id) ?? TITLES[0];
  return level >= title.minLevel && wins >= title.minWins && cardCount >= title.minCards;
}

type PortraitProps = {
  size?: "tiny" | "small" | "large";
  className?: string;
  showTitle?: boolean;
};
export function PlayerPortrait({ size = "small", className = "", showTitle = false }: PortraitProps) {
  const avatar = useGameStore((state) => state.avatar);
  const playerName = useGameStore((state) => state.playerName);
  const level = useGameStore((state) => state.level);
  const wins = useGameStore((state) => state.wins);
  const cardCount = useGameStore((state) => state.ownedCards.length);
  const frame = useIdentity((state) => state.frame);
  const selectedTitle = useIdentity((state) => state.title);
  const validTitle = canUseTitle(selectedTitle, level, wins, cardCount) ? selectedTitle : "wanderer";
  const title = TITLES.find((item) => item.id === validTitle)?.label ?? "Искатель";

  return (
    <span className={"frPlayerPortrait is-" + size + " " + className} data-frame={frame} title={playerName}>
      {avatar && avatar !== "/vite.svg"
        ? <img src={avatar} alt="" draggable={false} />
        : <span className="frPortraitFallback" aria-hidden="true">✦</span>}
      {showTitle ? <span className="frPortraitCaption">{title}</span> : null}
    </span>
  );
}

export function PlayerIdentityChip({ compact = false }: { compact?: boolean }) {
  const name = useGameStore((state) => state.playerName);
  const level = useGameStore((state) => state.level);
  const wins = useGameStore((state) => state.wins);
  const cards = useGameStore((state) => state.ownedCards.length);
  const selectedTitle = useIdentity((state) => state.title);
  const titleId = canUseTitle(selectedTitle, level, wins, cards) ? selectedTitle : "wanderer";
  const title = TITLES.find((item) => item.id === titleId)?.label ?? "Искатель";
  return (
    <span className={"frIdentityChip" + (compact ? " is-compact" : "")}>
      <PlayerPortrait size={compact ? "tiny" : "small"} />
      <span className="frIdentityText"><strong>{name || "Игрок FRAKTUM"}</strong><small>{title} · LVL {level}</small></span>
    </span>
  );
}
