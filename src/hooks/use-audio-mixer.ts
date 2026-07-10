import { useCallback, useEffect, useState } from "react";
import { DEFAULT_MUSIC_VOLUME, musicService, type MusicTrack } from "@/game/music";
import { setEffectsMuted, setEffectsVolume, setMusicSfxMuted, setMusicSfxVolume } from "@/game/sound";
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

const MUSIC_MUTE_KEY = "ark-music-muted";
const MUSIC_VOLUME_KEY = "ark-music-volume";
const EFFECTS_MUTE_KEY = "ark-effects-muted";
const EFFECTS_VOLUME_KEY = "ark-effects-volume";
const DEFAULT_EFFECTS_VOLUME = 1;

export interface AudioChannelControls {
  muted: boolean;
  volume: number;
  toggleMuted: () => void;
  setVolume: (volume: number) => void;
}

export interface AudioMixer {
  music: AudioChannelControls;
  effects: AudioChannelControls;
  blocked: boolean;
  unlock: () => void;
}

function usePersistedVolumeChannel(
  muteStorageKey: string,
  volumeStorageKey: string,
  defaultVolume: number,
): AudioChannelControls {
  const [muted, setMuted] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(muteStorageKey) === "1";
  });
  const [volume, setVolume] = useState(() => {
    if (typeof window === "undefined") return defaultVolume;
    const stored = window.localStorage.getItem(volumeStorageKey);
    const parsed = stored === null ? NaN : Number(stored);
    return Number.isFinite(parsed) ? parsed : defaultVolume;
  });

  useEffect(() => {
    window.localStorage.setItem(muteStorageKey, muted ? "1" : "0");
  }, [muted, muteStorageKey]);

  useEffect(() => {
    window.localStorage.setItem(volumeStorageKey, String(volume));
  }, [volume, volumeStorageKey]);

  return { muted, volume, toggleMuted: () => setMuted((m) => !m), setVolume };
}

export function useAudioMixer(phase: Phase): AudioMixer {
  const music = usePersistedVolumeChannel(MUSIC_MUTE_KEY, MUSIC_VOLUME_KEY, DEFAULT_MUSIC_VOLUME);
  const effects = usePersistedVolumeChannel(EFFECTS_MUTE_KEY, EFFECTS_VOLUME_KEY, DEFAULT_EFFECTS_VOLUME);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    musicService.setMuted(music.muted);
    setMusicSfxMuted(music.muted);
  }, [music.muted]);

  useEffect(() => {
    musicService.setVolume(music.volume);
    setMusicSfxVolume(music.volume);
  }, [music.volume]);

  useEffect(() => {
    setEffectsMuted(effects.muted);
  }, [effects.muted]);

  useEffect(() => {
    setEffectsVolume(effects.volume);
  }, [effects.volume]);

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

  return { music, effects, blocked, unlock };
}
