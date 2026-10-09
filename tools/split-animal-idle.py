from pathlib import Path
import subprocess

import imageio_ffmpeg


ROOT = Path(__file__).parents[1]
SOURCE = ROOT / "public" / "assets" / "characters" / "processed"
OUTPUT = ROOT / "public" / "assets" / "characters" / "idle-split"
FPS = 24.149377593360995

# Loop candidates are frame-based so clips remain aligned to the source cadence.
SEGMENTS = {
    "cat": {"entry_end": 97, "loop": None},
    "dog": {"entry_end": 97, "loop": None},
    "mouse": {"entry_end": 97, "loop": None},
    "rabbit": {"entry_end": 73, "loop": (73, 96)},
}


def run(ffmpeg, args):
    subprocess.run([ffmpeg, "-hide_banner", "-loglevel", "error", "-y", *args], check=True)


def cut(ffmpeg, source, target, start, end):
    frames = f"trim=start_frame={start}:end_frame={end},setpts=PTS-STARTPTS"
    run(ffmpeg, ["-i", str(source), "-vf", frames, "-an", "-fps_mode", "passthrough",
                 "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-auto-alt-ref", "0",
                 "-b:v", "0", "-crf", "30", str(target)])


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    for animal, segment in SEGMENTS.items():
        source = SOURCE / f"{animal}-pause.webm"
        entry_end = segment["entry_end"]
        cut(ffmpeg, source, OUTPUT / f"{animal}_idle_entry.webm", 0, entry_end)
        if segment["loop"]:
            start, end = segment["loop"]
            cut(ffmpeg, source, OUTPUT / f"{animal}_idle_loop.webm", start, end + 1)
        print(f"{animal}: entry frames 0-{entry_end - 1}; "
              f"loop {segment['loop'] or 'not safe to loop'}")


if __name__ == "__main__":
    main()
