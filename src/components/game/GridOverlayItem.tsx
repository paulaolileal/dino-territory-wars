import type { CSSProperties, ReactNode } from "react";

interface GridOverlayItemProps {
  row: number;
  col: number;
  width?: number;
  height?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/**
 * Positions an overlay element on the same CSS Grid as the board's cell
 * buttons (grid-row/grid-column span), offset by 2 to account for the
 * label row/column. Used for dino sprites (multi-cell span) and shot
 * markers (single cell).
 */
export default function GridOverlayItem({
  row,
  col,
  width = 1,
  height = 1,
  className,
  style,
  children,
}: GridOverlayItemProps) {
  return (
    <div
      className={className}
      style={{
        gridColumn: `${col + 2} / span ${width}`,
        gridRow: `${row + 2} / span ${height}`,
        pointerEvents: "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
