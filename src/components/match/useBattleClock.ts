import { useEffect, useRef, useState } from "react";
import type { MatchState } from "../../game/core/types";
import { BASE_BATTLE_SECONDS } from "../../game/engine/Rules";

type ClockRef = {
  key: string;
  remainingMs: number;
  extraSeconds: number;
  speed: number;
  lastTick: number;
  expired: boolean;
};

/**
 * Local offline battle timer, driven by elapsed wall time (not interval count).
 * Paused while roulette/next-battle/tutorial overlays are open. The engine
 * holds deterministic card modifiers, and only the timeout result is dispatched.
 * Online PvP must use a shared server-authoritative deadline before enabling.
 */
export function useBattleClock(
  state: MatchState,
  running: boolean,
  onExpired: (battleNumber: number) => void,
) {
  const key = `${state.id}:${state.battleNumber ?? 1}`;
  const clockRef = useRef<ClockRef>({
    key,
    remainingMs: BASE_BATTLE_SECONDS * 1000,
    extraSeconds: 0,
    speed: 1,
    lastTick: 0,
    expired: false,
  });
  const [secondsRemaining, setSecondsRemaining] = useState(BASE_BATTLE_SECONDS);

  useEffect(() => {
    const clock = clockRef.current;
    if (clock.key !== key) {
      clock.key = key;
      clock.remainingMs = BASE_BATTLE_SECONDS * 1000;
      clock.extraSeconds = 0;
      clock.speed = 1;
      clock.expired = false;
    }
    const extraSeconds = Math.max(0, state.battleClockExtraSeconds ?? 0);
    if (extraSeconds !== clock.extraSeconds) {
      clock.remainingMs = Math.max(0, clock.remainingMs + (extraSeconds - clock.extraSeconds) * 1000);
      clock.extraSeconds = extraSeconds;
    }
    clock.speed = Math.max(1, state.battleClockSpeed ?? 1);
    clock.lastTick = performance.now();
    setSecondsRemaining(Math.ceil(clock.remainingMs / 1000));
  }, [key, state.battleClockExtraSeconds, state.battleClockSpeed]);

  useEffect(() => {
    const clock = clockRef.current;
    clock.lastTick = performance.now();
    if (!running || clock.expired) return;

    const interval = window.setInterval(() => {
      const now = performance.now();
      const elapsed = Math.max(0, now - clock.lastTick);
      clock.lastTick = now;
      if (clock.expired) return;
      clock.remainingMs = Math.max(0, clock.remainingMs - elapsed * clock.speed);
      const seconds = Math.ceil(clock.remainingMs / 1000);
      setSecondsRemaining((previous) => previous === seconds ? previous : seconds);
      if (clock.remainingMs <= 0) {
        clock.expired = true;
        onExpired(state.battleNumber ?? 1);
      }
    }, 150);

    return () => window.clearInterval(interval);
  }, [running, key, onExpired, state.battleNumber]);

  return { secondsRemaining };
}
