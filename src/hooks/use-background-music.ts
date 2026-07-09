import { useCallback, useEffect, useState } from "react";
import { DEFAULT_MUSIC_VOLUME, musicService, type MusicTrack } from "@/game/music";
import type { Phase } from "@/game/useArkMatch";

const MENU_PHASES = new Set<Phase>([
  "home",
  "creating",
  "waiting",
  "connecting",
  "placement",
  "waiting-opponent",
]);
const BATTLE_PHASES = new Set<Phase>(["my-turn", "their-turn"]);

function trackForPhase(phase: Phase): MusicTrack {
  if (MENU_PHASES.has(phase)) return "menu";
  if (BATTLE_PHASES.has(phase)) return "battle";
  return "none";
}

const MUTE_KEY = "ark-music-muted";
const VOLUME_KEY = "ark-music-volume";

export function useBackgroundMusic(phase: Phase) {
  const [muted, setMuted] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(MUTE_KEY) === "1";
  });
  const [volume, setVolume] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_MUSIC_VOLUME;
    const stored = window.localStorage.getItem(VOLUME_KEY);
    const parsed = stored === null ? NaN : Number(stored);
    return Number.isFinite(parsed) ? parsed : DEFAULT_MUSIC_VOLUME;
  });
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    musicService.setMuted(muted);
    window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  }, [muted]);

  useEffect(() => {
    musicService.setVolume(volume);
    window.localStorage.setItem(VOLUME_KEY, String(volume));
  }, [volume]);

  useEffect(() => {
    let cancelled = false;
    musicService.setTrack(trackForPhase(phase)).then((ok) => {
      if (!cancelled) setBlocked(!ok);
    });
    return () => {
      cancelled = true;
    };
  }, [phase]);

  const unlock = useCallback(() => {
    musicService.unlockAudio();
    setBlocked(false);
  }, []);

  // Browsers block autoplay until a user gesture happens; unlock on the very
  // first interaction anywhere on the page instead of requiring a specific button.
  useEffect(() => {
    if (!blocked) return;
    const events = ["pointerdown", "keydown"] as const;
    const handler = () => unlock();
    events.forEach((e) => window.addEventListener(e, handler, { once: true }));
    return () => events.forEach((e) => window.removeEventListener(e, handler));
  }, [blocked, unlock]);

  return { muted, toggleMuted: () => setMuted((m) => !m), volume, setVolume, blocked, unlock };
}
