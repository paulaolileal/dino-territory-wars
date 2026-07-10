import { Volume2, VolumeX } from "lucide-react";
import type { AudioChannelControls } from "@/hooks/use-audio-mixer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface VolumeMixerProps {
  music: AudioChannelControls;
  effects: AudioChannelControls;
  blocked: boolean;
  onUnlock: () => void;
}

function VolumeChannelRow({
  label,
  channel,
}: {
  label: string;
  channel: AudioChannelControls;
}) {
  return (
    <div className="ark-volume-channel-row">
      <button
        onClick={channel.toggleMuted}
        className="ark-btn-ghost"
        type="button"
        aria-label={channel.muted ? `Ativar ${label.toLowerCase()}` : `Silenciar ${label.toLowerCase()}`}
        title={channel.muted ? `Ativar ${label.toLowerCase()}` : `Silenciar ${label.toLowerCase()}`}
      >
        {channel.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
      <span className="ark-volume-channel-label text-xs ark-muted">{label}</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={channel.volume}
        onChange={(e) => channel.setVolume(Number(e.target.value))}
        disabled={channel.muted}
        className="ark-volume-slider w-full"
        aria-label={`Volume de ${label.toLowerCase()}`}
        title={`Volume de ${label.toLowerCase()}`}
      />
    </div>
  );
}

export default function VolumeMixer({ music, effects, blocked, onUnlock }: VolumeMixerProps) {
  const allSilent = blocked || (music.muted && effects.muted);

  return (
    <div className="flex items-center gap-2">
      {blocked && (
        <button onClick={onUnlock} className="ark-btn-secondary text-xs animate-pulse" type="button">
          <Volume2 className="w-4 h-4 inline-block mr-1.5" />
          Ativar música
        </button>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="ark-btn-ghost"
            type="button"
            aria-label="Abrir mixer de volume"
            title="Volume"
          >
            {allSilent ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="ark-volume-mixer-panel w-64 space-y-3 p-3">
          <VolumeChannelRow label="Música" channel={music} />
          <VolumeChannelRow label="Efeitos" channel={effects} />
        </PopoverContent>
      </Popover>
    </div>
  );
}
