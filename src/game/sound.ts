import type { DinoKind } from "@/game/types";

// Placeholder sound service. Wire real audio files by dropping them in /public
// and updating the URLs below.
type SoundKey = "click" | "hit" | "miss" | "win" | "lose";

const URLS: Record<SoundKey, string | null> = {
  click: null,
  hit: null,
  miss: null,
  win: null,
  lose: null,
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

function playUrl(url: string, volume: number) {
  try {
    const a = new Audio(url);
    a.volume = volume;
    void a.play();
  } catch {
    /* ignore */
  }
}

export function play(key: SoundKey) {
  const url = URLS[key];
  if (!url) return;
  playUrl(url, 0.4);
}

/** Plays the damage roar/impact sound for the given dino kind when it is hit. */
export function playDinoDamage(kind: DinoKind) {
  playUrl(DINO_DAMAGE_URLS[kind], 0.5);
}
