from pathlib import Path
import subprocess
import sys

import cv2
import imageio_ffmpeg
import numpy as np
from PIL import Image
from rembg import new_session, remove


ROOT = Path(__file__).parents[1]
SOURCE = ROOT / "demo美术素材" / "动物管理员" / "动物-expanded"
OUTPUT = ROOT / "public" / "assets" / "characters" / "processed"
WORK_SIZE = (320, 568)
OUTPUT_SIZE = (320, 444)
SESSION = new_session("isnet-general-use")

ANIMALS = {"猫": "cat", "兔子": "rabbit", "狗": "dog", "老鼠": "mouse"}
ACTIONS = {"选择": "select", "缝纫": "sewing", "停顿": "pause"}


def action_for(path):
    stem = path.stem.replace("mp4", "")
    return next(value for key, value in ACTIONS.items() if key in stem)


def foreground_mask(frame, animal=None):
    frame = cv2.resize(frame, WORK_SIZE, interpolation=cv2.INTER_AREA)
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    alpha = np.asarray(remove(
        Image.fromarray(rgb),
        session=SESSION,
        only_mask=True,
        alpha_matting=True,
        alpha_matting_foreground_threshold=220,
        alpha_matting_background_threshold=20,
        alpha_matting_erode_size=5,
        post_process_mask=True,
    ), dtype=np.uint8)
    alpha = cv2.GaussianBlur(alpha, (0, 0), .45)
    alpha[alpha < 5] = 0
    if animal == "cat":
        ys, xs = np.where(alpha > 20)
        if len(xs):
            center = WORK_SIZE[0] // 2
            central = (xs > center - WORK_SIZE[0] * .31) & (xs < center + WORK_SIZE[0] * .31)
            points = np.column_stack([xs[central], ys[central]]).astype(np.int32)
            if len(points) >= 3:
                body = np.zeros_like(alpha)
                cv2.fillConvexPoly(body, cv2.convexHull(points), 255)
                hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
                color = ((hsv[:, :, 1] > 35) & (hsv[:, :, 2] < 252)).astype(np.uint8) * 255
                color = cv2.morphologyEx(color, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
                count, labels, stats, _ = cv2.connectedComponentsWithStats(color)
                colored = np.isin(labels, [i for i in range(1, count) if stats[i, 4] > 8]).astype(np.uint8) * 255
                alpha = cv2.max(cv2.max(alpha, body), colored)
                alpha = cv2.GaussianBlur(alpha, (0, 0), .7)
    return frame, alpha


def union_bounds(paths, animal):
    bounds = [WORK_SIZE[0], WORK_SIZE[1], 0, 0]
    for path in paths:
        capture = cv2.VideoCapture(str(path))
        frame_count = max(1, int(capture.get(cv2.CAP_PROP_FRAME_COUNT)))
        for frame_index in np.linspace(0, frame_count - 1, 14, dtype=int):
            capture.set(cv2.CAP_PROP_POS_FRAMES, int(frame_index))
            ok, frame = capture.read()
            if not ok:
                continue
            _, alpha = foreground_mask(frame, animal)
            points = cv2.findNonZero((alpha > 20).astype(np.uint8))
            if points is None:
                continue
            x, y, width, height = cv2.boundingRect(points)
            bounds[0] = min(bounds[0], x)
            bounds[1] = min(bounds[1], y)
            bounds[2] = max(bounds[2], x + width)
            bounds[3] = max(bounds[3], y + height)
        capture.release()
    padding = round(max(bounds[2] - bounds[0], bounds[3] - bounds[1]) * 0.045)
    return (max(0, bounds[0] - padding), max(0, bounds[1] - padding),
            min(WORK_SIZE[0], bounds[2] + padding), min(WORK_SIZE[1], bounds[3] + padding))


def render(path, animal, action, bounds):
    capture = cv2.VideoCapture(str(path))
    fps = capture.get(cv2.CAP_PROP_FPS) or 24
    x1, y1, x2, y2 = bounds
    crop_w, crop_h = x2 - x1, y2 - y1
    out_w, out_h = OUTPUT_SIZE
    scale = min((out_w - 20) / crop_w, (out_h - 20) / crop_h)
    width, height = max(1, round(crop_w * scale)), max(1, round(crop_h * scale))
    offset_x, offset_y = (out_w - width) // 2, out_h - height - 10
    target = OUTPUT / f"{animal}-{action}.webm"
    poster = OUTPUT / f"{animal}-{action}.png"
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    command = [ffmpeg, "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{out_w}x{out_h}",
               "-r", f"{fps:.6f}", "-i", "-", "-an", "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p",
               "-auto-alt-ref", "0", "-b:v", "0", "-crf", "30", str(target)]
    process = subprocess.Popen(command, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    frame_index = 0
    while True:
        ok, frame = capture.read()
        if not ok:
            break
        frame, alpha = foreground_mask(frame, animal)
        color = frame[y1:y2, x1:x2]
        matte = alpha[y1:y2, x1:x2]
        color = cv2.resize(color, (width, height), interpolation=cv2.INTER_AREA)
        matte = cv2.resize(matte, (width, height), interpolation=cv2.INTER_AREA)
        rgba = np.zeros((out_h, out_w, 4), np.uint8)
        rgba[offset_y:offset_y + height, offset_x:offset_x + width, :3] = cv2.cvtColor(color, cv2.COLOR_BGR2RGB)
        rgba[offset_y:offset_y + height, offset_x:offset_x + width, 3] = matte
        if frame_index == min(12, max(0, int(capture.get(cv2.CAP_PROP_FRAME_COUNT)) - 1)):
            cv2.imwrite(str(poster), cv2.cvtColor(rgba, cv2.COLOR_RGBA2BGRA))
        process.stdin.write(rgba.tobytes())
        frame_index += 1
    capture.release()
    process.stdin.close()
    if process.wait() != 0:
        raise RuntimeError(f"FFmpeg failed for {path}")
    return frame_index, fps


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    selected = set(sys.argv[1:])
    for source_name, animal in ANIMALS.items():
        if selected and animal not in selected:
            continue
        paths = sorted((SOURCE / source_name).glob("*.mp4"))
        bounds = union_bounds(paths, animal)
        print(animal, "shared bounds", bounds)
        for path in paths:
            action = action_for(path)
            frames, fps = render(path, animal, action, bounds)
            print(f"  {action}: {path.name} -> {animal}-{action}.webm ({frames / fps:.2f}s)")


if __name__ == "__main__":
    main()
