import { Fragment, useRef, type ReactNode, type TouchEvent as ReactTouchEvent } from "react";
import type { Coord } from "@/game/types";

// Matches the grid column cap in PlacementView/BattleView so the board's
// 90% CSS sizing (see .ark-board) never grows past that track's own limit.
export const BOARD_MAX_SIZE = 1200;

interface BoardGridProps {
  size: number;
  className?: string;
  onClick?: (row: number, col: number) => void;
  onEnter?: (c: Coord) => void;
  onLeave?: () => void;
  cellClassName?: (row: number, col: number) => string;
  /** Overlay layers (dino sprites, then shot markers) painted above the cells. */
  children?: ReactNode;
}

export default function BoardGrid({
  size,
  className,
  onClick,
  onEnter,
  onLeave,
  cellClassName,
  children,
}: BoardGridProps) {
  const cols = Array.from({ length: size }, (_, i) => String.fromCharCode(65 + i));

  // Touch devices have no hover, so press-and-drag emulates it: touchstart
  // previews the cell under the finger, touchmove updates it as the finger
  // moves, and touchend commits the placement/click on the last cell hovered.
  const draggingRef = useRef(false);
  const lastCellRef = useRef<Coord | null>(null);

  function cellFromPoint(x: number, y: number): Coord | null {
    const target = document.elementFromPoint(x, y);
    const wrap = target?.closest<HTMLElement>("[data-row]");
    if (!wrap) return null;
    const row = Number(wrap.dataset.row);
    const col = Number(wrap.dataset.col);
    if (Number.isNaN(row) || Number.isNaN(col)) return null;
    return { row, col };
  }

  function handleTouchStart(e: ReactTouchEvent<HTMLDivElement>) {
    const touch = e.touches[0];
    if (!touch) return;
    const cell = cellFromPoint(touch.clientX, touch.clientY);
    if (!cell) return;
    draggingRef.current = true;
    lastCellRef.current = cell;
    onEnter?.(cell);
  }

  function handleTouchMove(e: ReactTouchEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    const touch = e.touches[0];
    if (!touch) return;
    const cell = cellFromPoint(touch.clientX, touch.clientY);
    const last = lastCellRef.current;
    if (cell) {
      if (!last || last.row !== cell.row || last.col !== cell.col) {
        lastCellRef.current = cell;
        onEnter?.(cell);
      }
    } else if (last) {
      lastCellRef.current = null;
      onLeave?.();
    }
  }

  function handleTouchEnd(e: ReactTouchEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    e.preventDefault();
    const cell = lastCellRef.current;
    lastCellRef.current = null;
    if (cell) onClick?.(cell.row, cell.col);
    onLeave?.();
  }

  function handleTouchCancel() {
    draggingRef.current = false;
    lastCellRef.current = null;
    onLeave?.();
  }

  return (
    <div className="ark-board-frame">
      <div
        className={`ark-board ${className ?? ""}`}
        style={{
          gridTemplateColumns: `24px repeat(${size}, minmax(0, 1fr))`,
          gridTemplateRows: `24px repeat(${size}, minmax(0, 1fr))`,
        }}
        onMouseLeave={onLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        <div className="ark-corner" style={{ gridColumn: 1, gridRow: 1 }} />
        {cols.map((c, col) => (
          <div key={c} className="ark-axis" style={{ gridColumn: col + 2, gridRow: 1 }}>
            {c}
          </div>
        ))}
        {Array.from({ length: size }).map((_, row) => (
          <Fragment key={`row-${row}`}>
            <div className="ark-axis" style={{ gridColumn: 1, gridRow: row + 2 }}>
              {row + 1}
            </div>
            {Array.from({ length: size }).map((_, col) => (
              <button
                key={`${row}-${col}`}
                data-row={row}
                data-col={col}
                onMouseEnter={() => onEnter?.({ row, col })}
                onClick={() => onClick?.(row, col)}
                className="ark-cell-wrap"
                style={{ gridColumn: col + 2, gridRow: row + 2 }}
                type="button"
              >
                <div className={`ark-cell ${cellClassName ? cellClassName(row, col) : ""}`} />
              </button>
            ))}
          </Fragment>
        ))}
        {children}
      </div>
    </div>
  );
}
