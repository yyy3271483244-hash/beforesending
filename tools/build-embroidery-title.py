from pathlib import Path
import sys

import cv2
import numpy as np
from PIL import Image, ImageChops, ImageDraw


def trim(image: Image.Image, padding: int = 12) -> Image.Image:
    alpha = image.getchannel("A").point(lambda value: 255 if value >= 12 else 0)
    box = alpha.getbbox()
    if not box:
        raise ValueError("The source image has no visible pixels")
    left, top, right, bottom = box
    return image.crop((
        max(0, left - padding),
        max(0, top - padding),
        min(image.width, right + padding),
        min(image.height, bottom + padding),
    ))


def reveal_frame(image: Image.Image, progress: float) -> Image.Image:
    frame = image.copy()
    width, height = frame.size
    if progress <= 0:
        frame.putalpha(Image.new("L", frame.size, 0))
        return frame
    edge = int(width * progress)
    mask = Image.new("L", frame.size, 0)
    draw = ImageDraw.Draw(mask)

    # A slightly uneven leading edge keeps the reveal feeling hand stitched.
    for y in range(height):
        wobble = ((y * 13) % 17) - 8
        draw.line((0, y, max(0, min(width, edge + wobble)), y), fill=255)

    frame.putalpha(ImageChops.multiply(frame.getchannel("A"), mask))
    return frame


def export_word(
    image: Image.Image,
    name: str,
    output: Path,
    reveal_start: int,
    reveal_end: int,
) -> None:
    word = trim(image)
    output.mkdir(parents=True, exist_ok=True)
    word.save(output / f"{name}.png", optimize=True)

    frames = []
    durations = []
    frame_count = 31
    for index in range(frame_count):
        progress = max(0, min(1, (index - reveal_start) / (reveal_end - reveal_start)))
        frames.append(reveal_frame(word, progress))
        durations.append(95 if index else 180)

    durations[-1] = 1900
    frames[0].save(
        output / f"{name}.webp",
        save_all=True,
        append_images=frames[1:],
        duration=durations,
        loop=1,
        lossless=True,
        method=6,
    )


def main() -> None:
    if len(sys.argv) != 4:
        raise SystemExit("usage: build-embroidery-title.py BEFORE_PNG SENDING_PNG OUTPUT_DIR")

    output = Path(sys.argv[3])
    for source_path, name, start, end in (
        (sys.argv[1], "before-embroidered", 0, 14),
        (sys.argv[2], "sending-embroidered", 14, 28),
    ):
        source = Image.open(source_path).convert("RGBA")
        alpha = source.getchannel("A").point(lambda value: max(0, value - 10) if value >= 10 else 0)
        alpha_array = np.asarray(alpha).copy()
        _, labels, stats, _ = cv2.connectedComponentsWithStats((alpha_array > 0).astype(np.uint8), 8)
        stray_labels = np.flatnonzero(stats[:, cv2.CC_STAT_AREA] < 400)
        stray_labels = stray_labels[stray_labels != 0]
        if len(stray_labels):
            alpha_array[np.isin(labels, stray_labels)] = 0
        alpha = Image.fromarray(alpha_array)
        source.putalpha(alpha)
        export_word(source, name, output, start, end)


if __name__ == "__main__":
    main()
