import { Skull, Trophy } from "lucide-react";
import { DINO_SPECS } from "@/game/types";
import type { PlacedDino } from "@/game/types";
import type { Shot } from "@/game/useArkMatch";

interface ResultScreenProps {
  victory: boolean;
  matchDurationMs: number | null;
  myShotsFired: Shot[];
  enemyRevealed: PlacedDino[];
  onRestart: () => void;
  onDisconnect: () => void;
}

/** Formats a duration in milliseconds as mm:ss. Single-use, kept local to avoid a new util module. */
function formatDuration(ms: number | null): string {
  if (ms === null) return "--:--";
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function ResultScreen({
  victory,
  matchDurationMs,
  myShotsFired,
  enemyRevealed,
  onRestart,
  onDisconnect,
}: ResultScreenProps) {
  const attacksMade = myShotsFired.length;
  const remainingEnemyDinos = DINO_SPECS.length - enemyRevealed.length;

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-10">
      {!victory && <div className="ark-defeat-overlay" aria-hidden="true" />}

      <div
        className={`ark-card relative z-30 overflow-hidden p-8 max-w-lg w-full text-center flex flex-col gap-6 ${
          victory ? "animate-in fade-in zoom-in-95 duration-500 ark-victory-card" : "ark-defeat-card"
        }`}
      >
        {victory && <div className="ark-victory-glow" aria-hidden="true" />}

        <div className="relative z-10">
          <div className="flex flex-col items-center gap-3">
            {victory ? (
              <Trophy className="w-16 h-16 text-amber-400 ark-victory-icon" />
            ) : (
              <Skull className="w-16 h-16 text-red-400/80" />
            )}
            <h2 className="text-2xl font-bold">{victory ? "Vitória!" : "Derrota"}</h2>
            <p className="ark-muted text-sm">
              {victory ? "Você conquistou a base inimiga." : "Sua base foi conquistada."}
            </p>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div className="ark-card p-3">
              <dt className="ark-muted text-xs">Duração da partida</dt>
              <dd className="text-lg font-semibold">{formatDuration(matchDurationMs)}</dd>
            </div>
            <div className="ark-card p-3">
              <dt className="ark-muted text-xs">Ataques realizados</dt>
              <dd className="text-lg font-semibold">{attacksMade}</dd>
            </div>
            {!victory && (
              <div className="ark-card p-3 col-span-2">
                <dt className="ark-muted text-xs">Criaturas inimigas restantes</dt>
                <dd className="text-lg font-semibold">{remainingEnemyDinos}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="flex gap-2 justify-center">
          <button onClick={onRestart} className="ark-btn-primary" type="button">
            Reiniciar partida
          </button>
          <button onClick={onDisconnect} className="ark-btn-ghost" type="button">
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
