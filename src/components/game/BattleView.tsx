import { useEffect, useState, type CSSProperties } from "react";
import { Flame, X } from "lucide-react";
import type { Coord, PlacedDino } from "@/game/types";
import { key } from "@/game/board";
import type { Phase, Shot } from "@/game/useArkMatch";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

type Territory = "mine" | "enemy";

export default function BattleView(p: BattleViewProps) {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<Territory>(p.phase === "my-turn" ? "enemy" : "mine");

  useEffect(() => {
    setActiveTab(p.phase === "my-turn" ? "enemy" : "mine");
  }, [p.phase]);

  const myBoard = (
    <div
      className={`ark-card p-3 md:p-4 flex flex-col min-h-0 h-full ${p.phase === "their-turn" ? "ark-active" : ""}`}
    >
      <h3 className="ark-muted text-sm font-semibold mb-2 flex items-center justify-between shrink-0">
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
  );

  const enemyBoard = (
    <div
      className={`ark-card p-3 md:p-4 flex flex-col min-h-0 h-full ${p.phase === "my-turn" ? "ark-active" : ""}`}
    >
      <h3 className="ark-muted text-sm font-semibold mb-2 flex items-center justify-between shrink-0">
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
  );

  if (isMobile) {
    return (
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as Territory)}
        className="mt-4 h-[calc(100%_-_1rem)] min-h-0 flex flex-col"
      >
        <TabsList className="ark-tabs-list shrink-0">
          <TabsTrigger value="mine" className="ark-tabs-trigger">
            Meu território
          </TabsTrigger>
          <TabsTrigger value="enemy" className="ark-tabs-trigger">
            Território inimigo
          </TabsTrigger>
        </TabsList>
        <TabsContent value="mine" className="flex-1 min-h-0 mt-3">
          {myBoard}
        </TabsContent>
        <TabsContent value="enemy" className="flex-1 min-h-0 mt-3">
          {enemyBoard}
        </TabsContent>
      </Tabs>
    );
  }

  return (
    <div
      className="mt-4 h-[calc(100%_-_1rem)] min-h-0 grid grid-cols-[repeat(2,minmax(0,var(--board-max)))] grid-rows-[minmax(0,1fr)] justify-center gap-4"
      style={{ "--board-max": `${BOARD_MAX_SIZE}px` } as CSSProperties}
    >
      {myBoard}
      {enemyBoard}
    </div>
  );
}
