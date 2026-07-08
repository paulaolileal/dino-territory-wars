import { DINO_SPECS, type DinoKind, type Rotation, type PlacedDino, type Coord } from "./types";

export const DEFAULT_BOARD_SIZE = 10;
export const BOARD_SIZE_OPTIONS = [8, 10, 12, 14] as const;

const ROTATIONS: Rotation[] = [0, 90, 180, 270];

/** Rotates a polyomino 90° clockwise `rotation/90` times and renormalizes to non-negative offsets. */
export function rotatePolyomino(cells: Coord[], rotation: Rotation): Coord[] {
  let pts = cells;
  const steps = rotation / 90;
  for (let i = 0; i < steps; i++) {
    pts = pts.map(({ row, col }) => ({ row: col, col: -row }));
  }
  const minRow = Math.min(...pts.map((p) => p.row));
  const minCol = Math.min(...pts.map((p) => p.col));
  return pts.map((p) => ({ row: p.row - minRow, col: p.col - minCol }));
}

export function boundingBox(cells: Coord[]): { width: number; height: number } {
  return {
    width: Math.max(...cells.map((c) => c.col)) + 1,
    height: Math.max(...cells.map((c) => c.row)) + 1,
  };
}

export function cellsFor(d: {
  kind: DinoKind;
  row: number;
  col: number;
  rotation: Rotation;
}): Coord[] {
  const spec = DINO_SPECS.find((s) => s.kind === d.kind)!;
  return rotatePolyomino(spec.cells, d.rotation).map((c) => ({
    row: c.row + d.row,
    col: c.col + d.col,
  }));
}

export function canPlace(
  dinos: PlacedDino[],
  kind: DinoKind,
  row: number,
  col: number,
  rotation: Rotation,
  boardSize: number,
): boolean {
  const cells = cellsFor({ kind, row, col, rotation });
  if (cells.some((c) => c.row < 0 || c.row >= boardSize || c.col < 0 || c.col >= boardSize))
    return false;
  const occ = occupiedSet(dinos.filter((d) => d.kind !== kind));
  return cells.every((c) => !occ.has(key(c)));
}

export function occupiedSet(dinos: PlacedDino[]): Set<string> {
  const s = new Set<string>();
  for (const d of dinos) {
    for (const c of cellsFor(d)) s.add(key(c));
  }
  return s;
}

export function key(c: Coord): string {
  return `${c.row},${c.col}`;
}

export function randomPlacement(boardSize: number): PlacedDino[] {
  const placed: PlacedDino[] = [];
  const orderedSpecs = [...DINO_SPECS].sort((a, b) => b.cells.length - a.cells.length);
  for (const spec of orderedSpecs) {
    for (let attempt = 0; attempt < 1000; attempt++) {
      const rotation = ROTATIONS[Math.floor(Math.random() * ROTATIONS.length)];
      const row = Math.floor(Math.random() * boardSize);
      const col = Math.floor(Math.random() * boardSize);
      if (canPlace(placed, spec.kind, row, col, rotation, boardSize)) {
        placed.push({
          kind: spec.kind,
          rotation,
          row,
          col,
          hits: Array(spec.cells.length).fill(false),
        });
        break;
      }
    }
  }
  return placed;
}

/**
 * Reconstructs a full PlacedDino from a revealed `kind` and its sunk cells
 * (received over the wire). The anchor is always the top-left of `cells`
 * because `cellsFor` normalizes rotated offsets to start at (0,0) before
 * adding the anchor — so the minimal row/col of the absolute cells IS the
 * anchor, regardless of which rotation was actually used.
 */
export function inferPlacedDino(kind: DinoKind, cells: Coord[]): PlacedDino {
  const row = Math.min(...cells.map((c) => c.row));
  const col = Math.min(...cells.map((c) => c.col));
  const target = new Set(cells.map(key));
  const rotation =
    ROTATIONS.find((r) => {
      const candidate = cellsFor({ kind, row, col, rotation: r });
      return candidate.every((c) => target.has(key(c)));
    }) ?? 0;

  return { kind, rotation, row, col, hits: cells.map(() => true) };
}

export function resolveAttack(
  dinos: PlacedDino[],
  coord: Coord,
): { result: "miss" | "hit" | "sunk"; sunkCells?: Coord[]; kind?: DinoKind; gameOver: boolean } {
  for (const d of dinos) {
    const cs = cellsFor(d);
    const idx = cs.findIndex((c) => c.row === coord.row && c.col === coord.col);
    if (idx >= 0) {
      d.hits[idx] = true;
      const sunk = d.hits.every(Boolean);
      const gameOver = dinos.every((x) => x.hits.every(Boolean));
      if (sunk) return { result: "sunk", sunkCells: cs, kind: d.kind, gameOver };
      return { result: "hit", kind: d.kind, gameOver };
    }
  }
  return { result: "miss", gameOver: false };
}
