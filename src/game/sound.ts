import type { DinoKind } from "@/game/types";

// Placeholder sound service. Wire real audio files by dropping them in /public
// and updating the URLs below.
type SoundKey = "click" | "hit" | "miss" | "win" | "lose";

const URLS: Record<SoundKey, string | null> = {
  click: null,
  hit: null,
  miss: null,
  win: "/audio/victory-sound.mp3",
  lose: "/audio/lose-sound.mp3",
};

const DINO_DAMAGE_URLS: Record<DinoKind, string> = {
  rex: "/audio/dino-damage-sound/rex-sound.mp3",
  spino: "/audio/dino-damage-sound/spino-sound.mp3",
  mammoth: "/audio/dino-damage-sound/mammoth-sound.mp3",
  argentavis: "/audio/dino-damage-sound/argentavis-sound.mp3",
  direwolf: "/audio/dino-damage-sound/wolf-sound.mp3",
  therizinosaurus: "/audio/dino-damage-sound/therizinosaurus-sound.mp3",
  triceratops: "/audio/dino-damage-sound/triceratops-sound.mp3",
  ankylosaurus: "/audio/dino-damage-sound/ankylo-sound.mp3",
  carbonemys: "/audio/dino-damage-sound/carbonemys-sound.mp3",
  sarco: "/audio/dino-damage-sound/sarco-sound.mp3",
  pteranodon: "/audio/dino-damage-sound/ptera-sound.mp3",
};

const DINO_SPAWN_URLS: Record<DinoKind, string> = {
  rex: "/audio/dino-spawn-sound/rex-sound.mp3",
  spino: "/audio/dino-spawn-sound/spino-sound.mp3",
  mammoth: "/audio/dino-spawn-sound/mammoth-sound.mp3",
  argentavis: "/audio/dino-spawn-sound/argentavis-sound.mp3",
  direwolf: "/audio/dino-spawn-sound/wolf-sound.mp3",
  therizinosaurus: "/audio/dino-spawn-sound/therizinosaurus-sound.mp3",
  triceratops: "/audio/dino-spawn-sound/triceratops-sound.mp3",
  ankylosaurus: "/audio/dino-spawn-sound/ankylo-sound.mp3",
  carbonemys: "/audio/dino-spawn-sound/carbonemys-sound.mp3",
  sarco: "/audio/dino-spawn-sound/sarco-sound.mp3",
  pteranodon: "/audio/dino-spawn-sound/ptera-sound.mp3",
};

type SoundChannel = "music" | "effects";

// The win jingle plays alongside the music channel (menu/battle themes);
// every other one-shot sound belongs to the effects channel.
const CHANNEL_BY_KEY: Record<SoundKey, SoundChannel> = {
  win: "music",
  click: "effects",
  hit: "effects",
  miss: "effects",
  lose: "effects",
};

let musicSfxVolume = 1;
let musicSfxMuted = false;
let effectsVolume = 1;
let effectsMuted = false;

export function setMusicSfxVolume(volume: number) {
  musicSfxVolume = volume;
}

export function setMusicSfxMuted(value: boolean) {
  musicSfxMuted = value;
}

export function setEffectsVolume(volume: number) {
  effectsVolume = volume;
}

export function setEffectsMuted(value: boolean) {
  effectsMuted = value;
}

function playUrl(url: string, relativeVolume: number, channel: SoundChannel) {
  const muted = channel === "music" ? musicSfxMuted : effectsMuted;
  const master = channel === "music" ? musicSfxVolume : effectsVolume;
  if (muted || master <= 0) return;
  try {
    const a = new Audio(url);
    a.volume = Math.min(1, Math.max(0, relativeVolume * master));
    void a.play();
  } catch {
    /* ignore */
  }
}

export function play(key: SoundKey) {
  const url = URLS[key];
  if (!url) return;
  playUrl(url, 0.4, CHANNEL_BY_KEY[key]);
}

/** Plays the damage roar/impact sound for the given dino kind when it is hit. */
export function playDinoDamage(kind: DinoKind) {
  playUrl(DINO_DAMAGE_URLS[kind], 0.5, "effects");
}

/** Plays the spawn/placement sound for the given dino kind when it is placed on the board. */
export function playDinoSpawn(kind: DinoKind) {
  playUrl(DINO_SPAWN_URLS[kind], 0.5, "effects");
}
