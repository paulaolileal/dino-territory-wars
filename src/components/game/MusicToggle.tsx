import { Volume2, VolumeX } from "lucide-react";

interface MusicToggleProps {
  muted: boolean;
  onToggle: () => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  blocked: boolean;
  onUnlock: () => void;
}

export default function MusicToggle({
  muted,
  onToggle,
  volume,
  onVolumeChange,
  blocked,
  onUnlock,
}: MusicToggleProps) {
  return (
    <div className="flex items-center gap-2">
      {blocked && (
        <button onClick={onUnlock} className="ark-btn-secondary text-xs animate-pulse" type="button">
          <Volume2 className="w-4 h-4 inline-block mr-1.5" />
          Ativar música
        </button>
      )}
      <button
        onClick={onToggle}
        className="ark-btn-ghost"
        type="button"
        aria-label={muted ? "Ativar música" : "Silenciar música"}
        title={muted ? "Ativar música" : "Silenciar música"}
      >
        {muted || blocked ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={volume}
        onChange={(e) => onVolumeChange(Number(e.target.value))}
        disabled={muted}
        className="ark-volume-slider"
        aria-label="Volume da música"
        title="Volume da música"
      />
    </div>
  );
}
