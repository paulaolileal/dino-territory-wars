import type { CSSProperties } from "react";
import { boundingBox, rotatePolyomino } from "@/game/board";
import { DINO_SPECS, type PlacedDino } from "@/game/types";
import GridOverlayItem from "./GridOverlayItem";

export type DinoSpriteState = "normal" | "hit" | "sunk" | "preview-ok" | "preview-bad";

interface DinoSpriteProps {
  dino: PlacedDino;
  state?: DinoSpriteState;
}

const TINTS: Partial<Record<DinoSpriteState, string>> = {
  hit: "#e2a35a",
  sunk: "#c0453f",
  "preview-ok": "#9dd06a",
  "preview-bad": "#e07575",
};

export default function DinoSprite({ dino, state = "normal" }: DinoSpriteProps) {
  const spec = DINO_SPECS.find((s) => s.kind === dino.kind)!;
  const rotated = rotatePolyomino(spec.cells, dino.rotation);
  const { width, height } = boundingBox(rotated);
  const needsSwap = dino.rotation === 90 || dino.rotation === 270;
  const tint = TINTS[state] ?? spec.color;

  const innerStyle: CSSProperties = {
    width: needsSwap ? `${(height / width) * 100}%` : "100%",
    height: needsSwap ? `${(width / height) * 100}%` : "100%",
    "--dino-mask": `url(${spec.sprite})`,
    "--dino-tint": tint,
    "--dino-rot": `${dino.rotation}deg`,
  } as CSSProperties;

  return (
    <GridOverlayItem
      row={dino.row}
      col={dino.col}
      width={width}
      height={height}
      className="ark-dino-sprite-cell"
    >
      <div className="ark-dino-sprite-inner" style={innerStyle} />
    </GridOverlayItem>
  );
}
