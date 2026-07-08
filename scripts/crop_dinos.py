"""One-off asset pipeline: crops the 12-creature silhouette sheet into 11
individual transparent PNGs (Ankylosaurus is a new piece, kept from the
sheet too), used later as CSS mask-image sources.

Reads from the user's Downloads folder, writes into public/assets/dinos/.
Does not touch or move the source files.
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

SRC = Path(r"C:\Users\paula\Downloads\ChatGPT Image 8 de jul. de 2026, 15_19_31.png")
OUT_DIR = Path(r"C:\Users\paula\source\repos\dino-territory-wars\public\assets\dinos")
DEBUG_DIR = Path(r"C:\Users\paula\source\repos\dino-territory-wars\scripts\_debug_dinos")

# Reading order: row1 (5 cols) then row2 (6 cols) -> 11 DinoKind slugs.
KIND_ORDER = [
    "rex", "spino", "mammoth", "argentavis", "direwolf",
    "therizinosaurus", "triceratops", "ankylosaurus", "carbonemys", "sarco", "pteranodon",
]

WHITE_THRESHOLD = 245  # luminance above this = background
MIN_GAP = 10  # consecutive near-empty rows/cols to count as a separator
MIN_BAND_INK_ROWS = 3  # a band needs at least this many rows with ink to be considered


def find_bands(ink_profile: np.ndarray, min_gap: int) -> list[tuple[int, int]]:
    """Given a 1D boolean 'has ink' profile, return contiguous (start, end) bands."""
    bands = []
    in_band = False
    start = 0
    gap = 0
    for i, has_ink in enumerate(ink_profile):
        if has_ink:
            if not in_band:
                in_band = True
                start = i
            gap = 0
        else:
            if in_band:
                gap += 1
                if gap >= min_gap:
                    bands.append((start, i - gap + 1))
                    in_band = False
    if in_band:
        bands.append((start, len(ink_profile)))
    return bands


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    DEBUG_DIR.mkdir(parents=True, exist_ok=True)

    im = Image.open(SRC).convert("L")
    arr = np.array(im)
    mask = arr < WHITE_THRESHOLD

    row_has_ink = mask.sum(axis=1) > 0
    row_bands = find_bands(row_has_ink, MIN_GAP)
    row_bands = [b for b in row_bands if (b[1] - b[0]) >= MIN_BAND_INK_ROWS]
    # The 2 tallest bands are the silhouette rows; thin bands are titles/captions.
    row_bands_sorted = sorted(row_bands, key=lambda b: b[1] - b[0], reverse=True)
    silhouette_bands = sorted(row_bands_sorted[:2], key=lambda b: b[0])

    print(f"Detected {len(row_bands)} row bands total, heights: {[b[1]-b[0] for b in row_bands]}")
    print(f"Silhouette bands (top,bottom): {silhouette_bands}")

    slots: list[tuple[int, int, int, int]] = []  # (row0, row1, col0, col1)
    for row0, row1 in silhouette_bands:
        strip_mask = mask[row0:row1, :]
        col_has_ink = strip_mask.sum(axis=0) > 0
        col_bands = find_bands(col_has_ink, MIN_GAP)
        print(f"  band {row0}-{row1}: {len(col_bands)} column slots, widths {[c[1]-c[0] for c in col_bands]}")
        for col0, col1 in col_bands:
            slots.append((row0, row1, col0, col1))

    if len(slots) != len(KIND_ORDER):
        print(f"ERROR: expected {len(KIND_ORDER)} slots, found {len(slots)}. Aborting before writing files.")
        sys.exit(1)

    for kind, (row0, row1, col0, col1) in zip(KIND_ORDER, slots):
        pad = 6
        sub_arr = arr[max(0, row0 - pad):row1 + pad, max(0, col0 - pad):col1 + pad]
        sub_mask = sub_arr < WHITE_THRESHOLD

        labeled, n = ndimage.label(sub_mask)
        if n == 0:
            print(f"WARNING: no component found for {kind}, skipping")
            continue
        sizes = ndimage.sum(sub_mask, labeled, range(1, n + 1))
        largest_label = int(np.argmax(sizes)) + 1
        objs = ndimage.find_objects(labeled)
        (rs, cs) = objs[largest_label - 1]

        tight_pad = 4
        r0 = max(0, rs.start - tight_pad)
        r1 = min(sub_arr.shape[0], rs.stop + tight_pad)
        c0 = max(0, cs.start - tight_pad)
        c1 = min(sub_arr.shape[1], cs.stop + tight_pad)

        crop_lum = sub_arr[r0:r1, c0:c1].astype(np.float32)
        alpha = np.clip(255.0 - crop_lum, 0, 255).astype(np.uint8)

        rgba = np.zeros((*alpha.shape, 4), dtype=np.uint8)
        rgba[..., 3] = alpha  # RGB stays black (0,0,0); alpha carries the silhouette

        out_im = Image.fromarray(rgba, mode="RGBA")
        out_im.save(OUT_DIR / f"{kind}.png")
        out_im.save(DEBUG_DIR / f"{kind}.png")
        print(f"Saved {kind}.png ({out_im.size[0]}x{out_im.size[1]})")

    print("Done.")


if __name__ == "__main__":
    main()
