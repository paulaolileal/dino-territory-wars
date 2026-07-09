export type DinoKind =
  | "rex"
  | "spino"
  | "mammoth"
  | "argentavis"
  | "direwolf"
  | "therizinosaurus"
  | "triceratops"
  | "ankylosaurus"
  | "carbonemys"
  | "sarco"
  | "pteranodon";

export interface Coord {
  row: number;
  col: number;
}

export interface DinoSpec {
  kind: DinoKind;
  name: string;
  /** Footprint at rotation 0, offsets from (0,0), normalized so min row/col = 0. */
  cells: Coord[];
  emoji: string;
  /** Icon shown in the placement UI. */
  icon: string;
  color: string;
  /** Silhouette PNG used as a CSS mask-image, tinted via `color`. */
  sprite: string;
}

export const DINO_SPECS: DinoSpec[] = [
  {
    kind: "rex",
    name: "T-Rex",
    cells: [
      { row: 0, col: 0 },
      { row: 1, col: 0 },
      { row: 2, col: 0 },
      { row: 3, col: 0 },
      { row: 4, col: 0 },
    ],
    emoji: "🦖",
    icon: "/assets/dino-icon/Rex.webp",
    color: "#8b3a2e",
    sprite: "/assets/dinos/rex.png",
  },
  {
    kind: "spino",
    name: "Spinosaurus",
    cells: [
      { row: 0, col: 0 },
      { row: 1, col: 0 },
      { row: 2, col: 0 },
      { row: 3, col: 0 },
    ],
    emoji: "🐊",
    icon: "/assets/dino-icon/Spino.webp",
    color: "#3a6b4a",
    sprite: "/assets/dinos/spino.png",
  },
  {
    kind: "mammoth",
    name: "Mammoth",
    cells: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 2, col: 0 },
      { row: 2, col: 1 },
    ],
    emoji: "🦣",
    icon: "/assets/dino-icon/Mammoth.webp",
    color: "#6b4a2e",
    sprite: "/assets/dinos/mammoth.png",
  },
  {
    kind: "argentavis",
    name: "Argentavis",
    cells: [
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
    ],
    emoji: "🦅",
    icon: "/assets/dino-icon/Argentavis.webp",
    color: "#5a4030",
    sprite: "/assets/dinos/argentavis.png",
  },
  {
    kind: "direwolf",
    name: "Direwolf",
    cells: [
      { row: 0, col: 0 },
      { row: 1, col: 0 },
    ],
    emoji: "🐺",
    icon: "/assets/dino-icon/Direwolf.webp",
    color: "#4a4a4a",
    sprite: "/assets/dinos/direwolf.png",
  },
  {
    kind: "therizinosaurus",
    name: "Therizinosaurus",
    cells: [
      { row: 0, col: 0 },
      { row: 1, col: 0 },
      { row: 2, col: 0 },
    ],
    emoji: "🦥",
    icon: "/assets/dino-icon/Therizinosaur.webp",
    color: "#5c7a3a",
    sprite: "/assets/dinos/therizinosaurus.png",
  },
  {
    kind: "triceratops",
    name: "Triceratops",
    cells: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
    ],
    emoji: "🦏",
    icon: "/assets/dino-icon/Trike.webp",
    color: "#7a5a3a",
    sprite: "/assets/dinos/triceratops.png",
  },
  {
    kind: "ankylosaurus",
    name: "Ankylosaurus",
    cells: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
    ],
    emoji: "🛡️",
    icon: "/assets/dino-icon/Ankylosaurus.webp",
    color: "#4a5a3a",
    sprite: "/assets/dinos/ankylosaurus.png",
  },
  {
    kind: "carbonemys",
    name: "Carbonemys",
    cells: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
    ],
    emoji: "🐢",
    icon: "/assets/dino-icon/Carbonemys.webp",
    color: "#2e5a4a",
    sprite: "/assets/dinos/carbonemys.png",
  },
  {
    kind: "sarco",
    name: "Sarco",
    cells: [
      { row: 0, col: 0 },
      { row: 1, col: 0 },
      { row: 2, col: 0 },
    ],
    emoji: "🐊",
    icon: "/assets/dino-icon/Sarco.webp",
    color: "#3a5a6b",
    sprite: "/assets/dinos/sarco.png",
  },
  {
    kind: "pteranodon",
    name: "Pteranodon",
    cells: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ],
    emoji: "🦇",
    icon: "/assets/dino-icon/Pteranodon.webp",
    color: "#8a6a4a",
    sprite: "/assets/dinos/pteranodon.png",
  },
];

export type Rotation = 0 | 90 | 180 | 270;

export interface PlacedDino {
  kind: DinoKind;
  rotation: Rotation;
  row: number; // anchor row (top-left of the rotated bounding box), 0-9
  col: number; // anchor col, 0-9
  hits: boolean[]; // indexed the same as rotatePolyomino(spec.cells, rotation)
}

export type CellState = "empty" | "miss" | "hit" | "sunk";

export type NetMsg =
  | { type: "hello"; boardSize: number } // sent by the host right after connecting, to sync board size
  | { type: "ready" }
  | { type: "start"; firstPeer: string } // peerId who goes first
  | { type: "attack"; coord: Coord }
  | {
      type: "result";
      coord: Coord;
      result: "miss" | "hit" | "sunk";
      sunkCells?: Coord[];
      kind?: DinoKind;
      gameOver?: boolean;
    }
  | { type: "restart" };
