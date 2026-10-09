from pathlib import Path
import subprocess

import imageio_ffmpeg
import numpy as np
from PIL import Image
from rembg import new_session, remove


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "demo美术素材" / "首页视觉"
OUTPUT = ROOT / "public" / "assets" / "entrance-envelopes"
JOBS = (("写信", "write"), ("读信", "read"))


def process(source: Path, name: str, session, ffmpeg: str):
    reader = imageio_ffmpeg.read_frames(str(source))
    meta = next(reader)
    width, height = meta["size"]
    frames = []
    left, top, right, bottom = width, height, 0, 0

    for rgb in reader:
        frame = np.frombuffer(rgb, dtype=np.uint8).reshape(height, width, 3)
        cutout = np.asarray(remove(Image.fromarray(frame), session=session).convert("RGBA"))
        ys, xs = np.where(cutout[:, :, 3] > 8)
        if len(xs):
            left, top = min(left, int(xs.min())), min(top, int(ys.min()))
            right, bottom = max(right, int(xs.max()) + 1), max(bottom, int(ys.max()) + 1)
        frames.append(cutout)

    padding = 16
    left, top = max(0, left - padding), max(0, top - padding)
    right, bottom = min(width, right + padding), min(height, bottom + padding)
    crop_w, crop_h = right - left, bottom - top
    if crop_w < 2 or crop_h < 2:
        raise RuntimeError(f"No subject matte found in {source}")

    poster = OUTPUT / f"{name}-poster.png"
    Image.fromarray(frames[0][top:bottom, left:right]).save(poster, optimize=True)
    target = OUTPUT / f"{name}-hover.webm"
    command = [ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-f", "rawvideo",
               "-pix_fmt", "rgba", "-s", f"{crop_w}x{crop_h}", "-r", str(meta["fps"]),
               "-i", "-", "-an", "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p",
               "-auto-alt-ref", "0", "-b:v", "0", "-crf", "24", str(target)]
    encoder = subprocess.Popen(command, stdin=subprocess.PIPE)
    try:
        for frame in frames:
            encoder.stdin.write(frame[top:bottom, left:right].tobytes())
        encoder.stdin.close()
        if encoder.wait() != 0:
            raise RuntimeError(f"FFmpeg failed for {source}")
    finally:
        if encoder.poll() is None:
            encoder.kill()
    print(f"{source.name}: {len(frames)} frames, crop {crop_w}x{crop_h}, {target}, {poster}")


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    session = new_session("u2net")
    for source_name, output_name in JOBS:
        source = SOURCE / f"{source_name}.mp4"
        process(source, output_name, session, ffmpeg)


if __name__ == "__main__":
    main()
