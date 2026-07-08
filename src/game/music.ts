export type MusicTrack = "menu" | "battle" | "none";

const SRC: Record<Exclude<MusicTrack, "none">, string> = {
  menu: "/audio/menu-theme.mp3",
  battle: "/audio/battle-theme.mp3",
};

export const DEFAULT_MUSIC_VOLUME = 0.18;

class MusicService {
  private menuAudio: HTMLAudioElement | null = null;
  private battleAudio: HTMLAudioElement | null = null;
  private current: MusicTrack = "none";
  private muted = false;
  private volume = DEFAULT_MUSIC_VOLUME;

  private ensureAudios() {
    if (typeof window === "undefined") return;
    if (!this.menuAudio) {
      this.menuAudio = new Audio(SRC.menu);
      this.menuAudio.loop = true;
      this.menuAudio.volume = this.volume;
      this.menuAudio.muted = this.muted;
    }
    if (!this.battleAudio) {
      this.battleAudio = new Audio(SRC.battle);
      this.battleAudio.loop = true;
      this.battleAudio.volume = this.volume;
      this.battleAudio.muted = this.muted;
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.menuAudio) this.menuAudio.muted = muted;
    if (this.battleAudio) this.battleAudio.muted = muted;
  }

  setVolume(volume: number) {
    this.volume = volume;
    if (this.menuAudio) this.menuAudio.volume = volume;
    if (this.battleAudio) this.battleAudio.volume = volume;
  }

  /** Switches the active track. Returns false if the browser blocked audible autoplay. */
  async setTrack(track: MusicTrack): Promise<boolean> {
    if (typeof window === "undefined") return true;
    this.ensureAudios();
    if (track !== this.current) {
      this.trackElement(this.current)?.pause();
      this.current = track;
    }
    const next = this.trackElement(track);
    if (!next) return true;
    if (!next.paused) return !next.muted || this.muted;
    return this.playElement(next);
  }

  /** Makes any already-playing (but silently autoplay-blocked) track audible. */
  unlockAudio() {
    if (this.muted) return;
    if (this.menuAudio && !this.menuAudio.paused) this.menuAudio.muted = false;
    if (this.battleAudio && !this.battleAudio.paused) this.battleAudio.muted = false;
  }

  private async playElement(el: HTMLAudioElement): Promise<boolean> {
    el.muted = this.muted;
    try {
      await el.play();
      return true;
    } catch {
      // Browsers always allow autoplay when muted. Start silently so the
      // track is already running in sync and can be unmuted the instant the
      // user interacts, instead of retrying play() from a fresh gesture.
      if (this.muted) return false;
      el.muted = true;
      try {
        await el.play();
      } catch {
        /* even muted autoplay failed; nothing more we can do here */
      }
      return false;
    }
  }

  private trackElement(track: MusicTrack): HTMLAudioElement | null {
    if (track === "menu") return this.menuAudio;
    if (track === "battle") return this.battleAudio;
    return null;
  }
}

export const musicService = new MusicService();
