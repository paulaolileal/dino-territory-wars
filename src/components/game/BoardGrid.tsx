import { Fragment, type ReactNode } from "react";
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

  return (
    <div className="ark-board-frame">
      <div
        className={`ark-board ${className ?? ""}`}
        style={{
          gridTemplateColumns: `24px repeat(${size}, minmax(0, 1fr))`,
          gridTemplateRows: `24px repeat(${size}, minmax(0, 1fr))`,
        }}
        onMouseLeave={onLeave}
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
