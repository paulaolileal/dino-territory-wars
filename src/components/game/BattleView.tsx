import type { CSSProperties } from "react";
import { Flame, X } from "lucide-react";
import type { Coord, PlacedDino } from "@/game/types";
import { key } from "@/game/board";
import type { Phase, Shot } from "@/game/useArkMatch";
import BoardGrid, { BOARD_MAX_SIZE } from "./BoardGrid";
import DinoSprite from "./DinoSprite";
import GridOverlayItem from "./GridOverlayItem";

interface BattleViewProps {
  phase: Phase;
  boardSize: number;
  myDinos: PlacedDino[];
  receivedMap: Map<string, Shot>;
  firedMap: Map<string, Shot>;
  enemyRevealed: PlacedDino[];
  onFire: (c: Coord) => void;
}

function ShotMarkers({ map }: { map: Map<string, Shot> }) {
  return (
    <>
      {Array.from(map.values()).map((s) => (
        <GridOverlayItem
          key={key(s.coord)}
          row={s.coord.row}
          col={s.coord.col}
          className="ark-shot-marker"
        >
          {s.result === "miss" && <span className="ark-miss">•</span>}
          {s.result === "hit" && <X className="ark-hit w-4 h-4" />}
          {s.result === "sunk" && <Flame className="ark-sunk w-5 h-5 text-red-500" />}
        </GridOverlayItem>
      ))}
    </>
  );
}

export default function BattleView(p: BattleViewProps) {
  return (
    <div
      className="mt-4 grid gap-4 md:grid-cols-[repeat(2,minmax(0,var(--board-max)))] md:justify-center"
      style={{ "--board-max": `${BOARD_MAX_SIZE}px` } as CSSProperties}
    >
      <div className={`ark-card p-3 md:p-4 ${p.phase === "their-turn" ? "ark-active" : ""}`}>
        <h3 className="ark-muted text-sm font-semibold mb-2 flex items-center justify-between">
          <span>Meu território</span>
          {p.phase === "their-turn" && (
            <span className="text-sm md:text-base font-extrabold uppercase tracking-wide text-amber-300 animate-pulse drop-shadow-[0_0_6px_rgba(252,211,77,0.6)]">
              Sob ataque
            </span>
          )}
        </h3>
        <BoardGrid size={p.boardSize}>
          {p.myDinos.map((d, i) => (
            <DinoSprite
              key={`${d.kind}-${i}`}
              dino={d}
              state={d.hits.every(Boolean) ? "sunk" : d.hits.some(Boolean) ? "hit" : "normal"}
            />
          ))}
          <ShotMarkers map={p.receivedMap} />
        </BoardGrid>
      </div>

      <div className={`ark-card p-3 md:p-4 ${p.phase === "my-turn" ? "ark-active" : ""}`}>
        <h3 className="ark-muted text-sm font-semibold mb-2 flex items-center justify-between">
          <span>Território inimigo</span>
          {p.phase === "my-turn" && (
            <span className="text-sm md:text-base font-extrabold uppercase tracking-wide text-emerald-300 animate-pulse drop-shadow-[0_0_6px_rgba(52,211,153,0.6)]">
              Seu turno
            </span>
          )}
        </h3>
        <BoardGrid
          size={p.boardSize}
          className="ark-board-fog"
          onClick={(row, col) => p.onFire({ row, col })}
          cellClassName={(row, col) => {
            const clickable = p.phase === "my-turn" && !p.firedMap.has(key({ row, col }));
            return `ark-fog ${clickable ? "ark-cell-target" : ""}`;
          }}
        >
          {p.enemyRevealed.map((d, i) => (
            <DinoSprite key={`revealed-${d.kind}-${i}`} dino={d} state="sunk" />
          ))}
          <ShotMarkers map={p.firedMap} />
        </BoardGrid>
      </div>
    </div>
  );
}
