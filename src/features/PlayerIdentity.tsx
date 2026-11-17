import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useGameStore } from "../useGameStore";

/** 64px tiles from the 512x256 atlas created from the user's profile ZIP. */
export const AVATARS = [
  { id: "pixel-avatar-01", label: "Аватар 01", index: 0 },
  { id: "pixel-avatar-02", label: "Аватар 02", index: 1 },
  { id: "pixel-avatar-03", label: "Аватар 03", index: 2 },
  { id: "pixel-avatar-04", label: "Аватар 04", index: 3 },
  { id: "pixel-avatar-05", label: "Аватар 05", index: 4 },
  { id: "pixel-avatar-06", label: "Аватар 06", index: 5 },
  { id: "pixel-avatar-07", label: "Аватар 07", index: 6 },
  { id: "pixel-avatar-08", label: "Аватар 08", index: 7 },
  { id: "pixel-avatar-09", label: "Аватар 09", index: 8 },
  { id: "pixel-avatar-10", label: "Аватар 10", index: 9 },
  { id: "pixel-avatar-11", label: "Аватар 11", index: 10 },
  { id: "pixel-avatar-12", label: "Аватар 12", index: 11 },
  { id: "pixel-avatar-13", label: "Аватар 13", index: 12 },
  { id: "pixel-avatar-14", label: "Аватар 14", index: 13 },
  { id: "pixel-avatar-15", label: "Аватар 15", index: 14 },
] as const;
export const FRAMES = [
  { id: "pixel-frame-01", label: "Рамка 01", index: 16, color: "#90b8d1" },
  { id: "pixel-frame-02", label: "Рамка 02", index: 17, color: "#90b8d1" },
  { id: "pixel-frame-03", label: "Рамка 03", index: 18, color: "#90b8d1" },
  { id: "pixel-frame-04", label: "Рамка 04", index: 19, color: "#90b8d1" },
  { id: "pixel-frame-05", label: "Рамка 05", index: 20, color: "#90b8d1" },
  { id: "pixel-frame-06", label: "Рамка 06", index: 21, color: "#90b8d1" },
  { id: "pixel-frame-07", label: "Рамка 07", index: 22, color: "#90b8d1" },
  { id: "pixel-frame-08", label: "Рамка 08", index: 23, color: "#90b8d1" },
  { id: "pixel-frame-09", label: "Рамка 09", index: 24, color: "#90b8d1" },
  { id: "pixel-frame-10", label: "Рамка 10", index: 25, color: "#90b8d1" },
  { id: "pixel-frame-11", label: "Рамка 11", index: 26, color: "#90b8d1" },
  { id: "pixel-frame-12", label: "Рамка 12", index: 27, color: "#90b8d1" },
  { id: "pixel-frame-13", label: "Рамка 13", index: 28, color: "#90b8d1" },
  { id: "pixel-frame-14", label: "Рамка 14", index: 29, color: "#90b8d1" },
  { id: "pixel-frame-15", label: "Рамка 15", index: 30, color: "#90b8d1" },
  { id: "pixel-frame-16", label: "Рамка 16", index: 31, color: "#90b8d1" },
] as const;
export const AVATAR_PREFIX = "fraktum-avatar:";
export function avatarValue(index: number) { return AVATAR_PREFIX + String(index); }
export function avatarIndex(value: string | null | undefined): number | null {
  const match = /^fraktum-avatar:(\d+)$/.exec(value ?? "");
  if (!match) return null;
  const index = Number(match[1]);
  return Number.isInteger(index) && index >= 0 && index < AVATARS.length ? index : null;
}
export function PixelAtlasTile({ index, className = "" }: { index: number; className?: string }) {
  const x = (index % 8) * (100 / 7);
  const y = Math.floor(index / 8) * (100 / 3);
  return <span aria-hidden="true" className={"frPixelAtlasTile " + className}
    style={{ backgroundPosition: x + "% " + y + "%" }} />;
}
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
    frame: "pixel-frame-01", banner: "night", title: "wanderer", bio: "",
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
      {(() => {
        const index = avatarIndex(avatar);
        const isCustomPhoto = Boolean(avatar && index === null &&
          avatar !== "/vite.svg" && !avatar.startsWith("/ui/fraktum/icons/"));
        return isCustomPhoto
          ? <img src={avatar} alt="" draggable={false} />
          : <PixelAtlasTile index={index ?? 0} className="frPortraitAvatarArt" />;
      })()}
      <PixelAtlasTile index={FRAMES.find(item => item.id === frame)?.index ?? FRAMES[0].index}
        className="frPortraitFrameArt" />
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
