import { DINO_SPECS, type DinoKind, type Orientation, type PlacedDino, type Coord } from "./types";

export const BOARD_SIZE = 10;

export function emptyCells(): (DinoKind | null)[][] {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
}

export function canPlace(
  dinos: PlacedDino[],
  kind: DinoKind,
  row: number,
  col: number,
  orientation: Orientation
): boolean {
  const spec = DINO_SPECS.find((d) => d.kind === kind)!;
  const cells = cellsFor(row, col, spec.size, orientation);
  if (cells.some((c) => c.row < 0 || c.row >= BOARD_SIZE || c.col < 0 || c.col >= BOARD_SIZE)) return false;
  const occ = occupiedSet(dinos.filter((d) => d.kind !== kind));
  return cells.every((c) => !occ.has(key(c)));
}

export function cellsFor(row: number, col: number, size: number, orientation: Orientation): Coord[] {
  const out: Coord[] = [];
  for (let i = 0; i < size; i++) {
    out.push(orientation === "H" ? { row, col: col + i } : { row: row + i, col });
  }
  return out;
}

export function occupiedSet(dinos: PlacedDino[]): Set<string> {
  const s = new Set<string>();
  for (const d of dinos) {
    for (const c of cellsFor(d.row, d.col, d.size, d.orientation)) s.add(key(c));
  }
  return s;
}

export function key(c: Coord): string { return `${c.row},${c.col}`; }

export function randomPlacement(): PlacedDino[] {
  const placed: PlacedDino[] = [];
  for (const spec of DINO_SPECS) {
    for (let attempt = 0; attempt < 500; attempt++) {
      const orientation: Orientation = Math.random() < 0.5 ? "H" : "V";
      const row = Math.floor(Math.random() * BOARD_SIZE);
      const col = Math.floor(Math.random() * BOARD_SIZE);
      if (canPlace(placed, spec.kind, row, col, orientation)) {
        placed.push({
          kind: spec.kind,
          size: spec.size,
          orientation,
          row,
          col,
          hits: Array(spec.size).fill(false),
        });
        break;
      }
    }
  }
  return placed;
}

export function resolveAttack(
  dinos: PlacedDino[],
  coord: Coord
): { result: "miss" | "hit" | "sunk"; sunkCells?: Coord[]; gameOver: boolean } {
  for (const d of dinos) {
    const cs = cellsFor(d.row, d.col, d.size, d.orientation);
    const idx = cs.findIndex((c) => c.row === coord.row && c.col === coord.col);
    if (idx >= 0) {
      d.hits[idx] = true;
      const sunk = d.hits.every(Boolean);
      const gameOver = dinos.every((x) => x.hits.every(Boolean));
      if (sunk) return { result: "sunk", sunkCells: cs, gameOver };
      return { result: "hit", gameOver };
    }
  }
  return { result: "miss", gameOver: false };
}
