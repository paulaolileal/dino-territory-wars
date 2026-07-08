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

export function play(key: SoundKey) {
  const url = URLS[key];
  if (!url) return;
  try {
    const a = new Audio(url);
    a.volume = 0.4;
    void a.play();
  } catch {
    /* ignore */
  }
}
