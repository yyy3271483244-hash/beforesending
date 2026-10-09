"""Create a contact sheet of the supplied opening reference; leave it unchanged."""
from pathlib import Path
import io
import subprocess
import sys
import tempfile
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(tempfile.gettempdir()) / 'before-sending-media-tools'))
import imageio_ffmpeg

source = Path(sys.argv[1])
target = Path(__file__).resolve().parents[1] / 'ui-preview/welcome-reference.jpg'
reader = imageio_ffmpeg.read_frames(str(source))
metadata = next(reader)
reader.close()
print(metadata)
sheet = Image.new('RGB', (1440, 960), '#e8e8e8')
for index in range(12):
    seconds = max(0, metadata['duration'] * index / 12)
    data = subprocess.check_output([imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error',
        '-ss', str(seconds), '-i', str(source), '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'])
    frame = Image.open(io.BytesIO(data)).convert('RGB')
    frame.thumbnail((470, 204))
    x, y = index % 3 * 480, index // 3 * 240
    sheet.paste(frame, (x + (480 - frame.width) // 2, y))
    ImageDraw.Draw(sheet).text((x + 12, y + 214), f'{seconds:.2f}s', fill='#333333')
sheet.save(target, quality=94)
print(target)
