"""One-off asset pipeline: prepares board/page backgrounds, copies the logo,
and generates a favicon from its first frame. Reads from Downloads, writes
into public/, never touches the source files.
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance

DOWNLOADS = Path(r"C:\Users\paula\Downloads")
PUBLIC = Path(r"C:\Users\paula\source\repos\dino-territory-wars\public")

BOARD_BASE_SRC = DOWNLOADS / "ChatGPT Image 8 de jul. de 2026, 15_24_08.png"
BATTLE_SCENE_SRC = DOWNLOADS / "tnF6zleKF1aDqp1udCTwy9EQ.webp"
LOGO_SRC = DOWNLOADS / "ark icon.gif"

BACKGROUNDS_DIR = PUBLIC / "assets" / "backgrounds"
BRANDING_DIR = PUBLIC / "assets" / "branding"


def process_board_backgrounds() -> None:
    im = Image.open(BOARD_BASE_SRC).convert("RGB")
    im.save(BACKGROUNDS_DIR / "board-base.jpg", quality=88)

    fog = ImageEnhance.Color(im).enhance(0.25)
    fog = ImageEnhance.Brightness(fog).enhance(0.55)
    fog.save(BACKGROUNDS_DIR / "board-fog.jpg", quality=88)
    print("Saved board-base.jpg and board-fog.jpg")


def process_battle_scene() -> None:
    im = Image.open(BATTLE_SCENE_SRC).convert("RGB")
    target_width = 1920
    if im.width > target_width:
        ratio = target_width / im.width
        im = im.resize((target_width, round(im.height * ratio)), Image.LANCZOS)
    im.save(BACKGROUNDS_DIR / "battle-scene.jpg", quality=85)
    print(f"Saved battle-scene.jpg ({im.size[0]}x{im.size[1]})")


def copy_logo() -> None:
    data = LOGO_SRC.read_bytes()
    (BRANDING_DIR / "ark-logo.gif").write_bytes(data)
    print("Copied ark-logo.gif")


def generate_favicon() -> None:
    im = Image.open(LOGO_SRC)
    im.seek(0)
    frame = im.convert("RGBA")
    arr = np.array(frame)

    rgb = arr[..., :3].astype(np.int16)
    is_dark_bg = rgb.sum(axis=-1) < 60  # near-black background pixels
    arr[..., 3] = np.where(is_dark_bg, 0, 255)

    alpha_im = Image.fromarray(arr, mode="RGBA")
    bbox = alpha_im.getbbox()
    if bbox:
        alpha_im = alpha_im.crop(bbox)

    size = max(alpha_im.size)
    square = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    square.paste(alpha_im, ((size - alpha_im.width) // 2, (size - alpha_im.height) // 2))

    square.save(PUBLIC / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    print("Saved favicon.ico")


def main() -> None:
    BACKGROUNDS_DIR.mkdir(parents=True, exist_ok=True)
    BRANDING_DIR.mkdir(parents=True, exist_ok=True)
    process_board_backgrounds()
    process_battle_scene()
    copy_logo()
    generate_favicon()
    print("Done.")


if __name__ == "__main__":
    main()
