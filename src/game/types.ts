export type DinoKind = "rex" | "spino" | "mammoth" | "argentavis" | "direwolf";

export interface DinoSpec {
  kind: DinoKind;
  name: string;
  size: number;
  emoji: string;
  color: string;
}

export const DINO_SPECS: DinoSpec[] = [
  { kind: "rex", name: "T-Rex", size: 5, emoji: "🦖", color: "#8b3a2e" },
  { kind: "spino", name: "Spinosaurus", size: 4, emoji: "🐊", color: "#3a6b4a" },
  { kind: "mammoth", name: "Mammoth", size: 4, emoji: "🦣", color: "#6b4a2e" },
  { kind: "argentavis", name: "Argentavis", size: 3, emoji: "🦅", color: "#5a4030" },
  { kind: "direwolf", name: "Direwolf", size: 2, emoji: "🐺", color: "#4a4a4a" },
];

export type Orientation = "H" | "V";

export interface PlacedDino {
  kind: DinoKind;
  size: number;
  orientation: Orientation;
  row: number; // 0-9
  col: number; // 0-9
  hits: boolean[]; // length = size
}

export type CellState = "empty" | "miss" | "hit" | "sunk";

export interface Coord { row: number; col: number }

export type NetMsg =
  | { type: "ready" }
  | { type: "start"; firstPeer: string } // peerId who goes first
  | { type: "attack"; coord: Coord }
  | { type: "result"; coord: Coord; result: "miss" | "hit" | "sunk"; sunkCells?: Coord[]; gameOver?: boolean }
  | { type: "restart" };
