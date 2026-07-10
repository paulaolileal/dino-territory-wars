import { useEffect, type CSSProperties, type ReactNode } from "react";
import { Check, Compass, Eraser, MapPinned, PawPrint, RotateCw, Shuffle } from "lucide-react";
import { DINO_SPECS, type Coord, type PlacedDino, type Rotation } from "@/game/types";
import { key } from "@/game/board";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import BoardGrid, { BOARD_MAX_SIZE } from "./BoardGrid";
import DinoSprite from "./DinoSprite";

interface PlacementViewProps {
  boardSize: number;
  myDinos: PlacedDino[];
  placingIdx: number;
  rotation: Rotation;
  onRotate: (direction?: "cw" | "ccw") => void;
  onCellEnter: (c: Coord) => void;
  onCellLeave: () => void;
  onCellClick: (row: number, col: number) => void;
  previewCells: Set<string>;
  previewValid: boolean;
  myOcc: Set<string>;
  onAuto: () => void;
  onClear: () => void;
  onConfirm: () => void;
  confirmed: boolean;
  themReady: boolean;
}

export default function PlacementView(p: PlacementViewProps) {
  const isMobile = useIsMobile();
  const done = p.placingIdx >= DINO_SPECS.length;
  const current = DINO_SPECS[p.placingIdx];

  useEffect(() => {
    if (done) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "q" || e.key === "Q") p.onRotate("ccw");
      else if (e.key === "e" || e.key === "E") p.onRotate("cw");
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const cellClassName = (row: number, col: number) => {
    const k = key({ row, col });
    const isPreview = p.previewCells.has(k);
    const classes: string[] = [];
    if (p.myOcc.has(k)) classes.push("ark-cell-dino");
    if (isPreview) classes.push(p.previewValid ? "ark-cell-preview-ok" : "ark-cell-preview-bad");
    return classes.join(" ");
  };

  const board = (
    <BoardGrid
      size={p.boardSize}
      onEnter={p.onCellEnter}
      onLeave={p.onCellLeave}
      onClick={(r, c) => p.onCellClick(r, c)}
      cellClassName={cellClassName}
    >
      {p.myDinos.map((d, i) => (
        <DinoSprite key={`${d.kind}-${i}`} dino={d} />
      ))}
    </BoardGrid>
  );

  const currentDinoInfo: ReactNode =
    !done && current ? (
      <div className="text-sm flex items-center gap-2 shrink-0">
        <img src={current.icon} alt={current.name} className="w-8 h-8 object-contain invert" />
        <span>
          <b>{current.name}</b> · {current.cells.length} casas · {p.rotation}°
        </span>
      </div>
    ) : (
      <div className="text-sm text-emerald-300 shrink-0">Todos posicionados!</div>
    );

  const rotateButton = (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => p.onRotate("cw")}
          disabled={done}
          className="ark-btn-secondary ark-btn-icon"
          type="button"
          aria-label="Rotacionar"
        >
          <RotateCw className="w-5 h-5" />
        </button>
      </TooltipTrigger>
      <TooltipContent>Rotacionar (Q / E)</TooltipContent>
    </Tooltip>
  );

  const autoButton = (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={p.onAuto}
          disabled={p.confirmed}
          className="ark-btn-ghost ark-btn-icon"
          type="button"
          aria-label="Posicionamento aleatório"
        >
          <Shuffle className="w-5 h-5" />
        </button>
      </TooltipTrigger>
      <TooltipContent>Posicionamento aleatório</TooltipContent>
    </Tooltip>
  );

  const clearButton = (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={p.onClear}
          disabled={p.confirmed}
          className="ark-btn-ghost ark-btn-icon"
          type="button"
          aria-label="Limpar posicionamento"
        >
          <Eraser className="w-5 h-5" />
        </button>
      </TooltipTrigger>
      <TooltipContent>Limpar posicionamento</TooltipContent>
    </Tooltip>
  );

  const confirmLabel = p.confirmed
    ? p.themReady
      ? "Aguardando..."
      : "Aguardando adversário..."
    : "Confirmar";

  const confirmIconButton = (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={p.onConfirm}
          disabled={!done || p.confirmed}
          className="ark-btn-primary ark-btn-icon"
          type="button"
          aria-label={confirmLabel}
        >
          <Check className="w-5 h-5" />
        </button>
      </TooltipTrigger>
      <TooltipContent>{confirmLabel}</TooltipContent>
    </Tooltip>
  );

  const controlsRow = (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center justify-center gap-2 shrink-0">
        {rotateButton}
        {autoButton}
        {clearButton}
      </div>
    </TooltipProvider>
  );

  const mobileControlsRow = (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center justify-center gap-2 shrink-0">
        {rotateButton}
        {autoButton}
        {clearButton}
        {confirmIconButton}
      </div>
    </TooltipProvider>
  );

  const confirmButton = (
    <button
      onClick={p.onConfirm}
      disabled={!done || p.confirmed}
      className="ark-btn-primary shrink-0"
      type="button"
    >
      {confirmLabel}
    </button>
  );

  const creatureList = (
    <ul className="text-base space-y-2">
      {DINO_SPECS.map((s, i) => (
        <li
          key={s.kind}
          className={`flex items-center justify-between ${i === p.placingIdx ? "text-emerald-300 font-bold" : ""}`}
        >
          <span className="flex items-center gap-3">
            <img src={s.icon} alt={s.name} className="w-8 h-8 object-contain invert" />
            {s.name}
          </span>
          <span className="ark-muted text-sm flex items-center gap-1">
            {s.cells.length} casas
            {i < p.placingIdx && <Check className="w-3.5 h-3.5 text-emerald-400" />}
          </span>
        </li>
      ))}
    </ul>
  );

  if (isMobile) {
    return (
      <Tabs defaultValue="board" className="mt-4 h-[calc(100%_-_1rem)] min-h-0 flex flex-col">
        <TabsList className="ark-tabs-list shrink-0">
          <TabsTrigger value="board" className="ark-tabs-trigger">
            Território
          </TabsTrigger>
          <TabsTrigger value="creatures" className="ark-tabs-trigger">
            Criaturas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="flex-1 min-h-0 mt-3">
          <div className="ark-card p-3 flex flex-col min-h-0 gap-3 h-full">
            <h3 className="ark-section-title text-base font-semibold shrink-0">
              <MapPinned className="w-5 h-5" />
              Meu Território
            </h3>
            {board}
            {currentDinoInfo}
            {mobileControlsRow}
          </div>
        </TabsContent>

        <TabsContent value="creatures" className="flex-1 min-h-0 mt-3">
          <div className="ark-card p-4 flex flex-col gap-3 min-h-0 h-full overflow-y-auto">
            <h3 className="ark-section-title text-lg font-bold shrink-0">
              <PawPrint className="w-5 h-5" />
              Criaturas
            </h3>
            {creatureList}
          </div>
        </TabsContent>
      </Tabs>
    );
  }

  return (
    <div
      className="mt-4 h-[calc(100%_-_1rem)] min-h-0 grid grid-cols-[minmax(0,var(--board-max))_320px] grid-rows-[minmax(0,1fr)] justify-center gap-4"
      style={{ "--board-max": `${BOARD_MAX_SIZE}px` } as CSSProperties}
    >
      <div className="ark-card p-4 flex flex-col min-h-0">
        <h3 className="ark-section-title text-base font-semibold mb-3 shrink-0">
          <MapPinned className="w-5 h-5" />
          Meu Território
        </h3>
        {board}
      </div>

      <aside className="ark-card p-4 flex flex-col gap-3 min-h-0 overflow-y-auto">
        <h3 className="ark-section-title text-lg font-bold shrink-0">
          <Compass className="w-5 h-5" />
          Posicionamento
        </h3>
        {currentDinoInfo}
        {controlsRow}
        {confirmButton}

        <div className="mt-2 border-t border-white/10 pt-3">
          <h4 className="ark-section-title text-sm font-semibold mb-2">
            <PawPrint className="w-4 h-4" />
            Criaturas
          </h4>
          {creatureList}
        </div>
      </aside>
    </div>
  );
}
