import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const sharp = createRequire(import.meta.url)('sharp');
const ffmpeg = process.env.FFMPEG;
if (!ffmpeg) throw new Error('Set FFMPEG to the installed FFmpeg executable.');
const width = 320, height = 444, pixels = width * height, bytes = pixels * 4;
const output = 'public/assets/characters/selection-restored';
mkdirSync(output, { recursive: true });

function cleanCat(frame) {
  const background = new Uint8Array(pixels), queue = new Int32Array(pixels);
  let head = 0, tail = 0;
  const paper = p => {
    const i = p * 4, r = frame[i], g = frame[i + 1], b = frame[i + 2];
    return frame[i + 3] < 12 || (r > 170 && g > 162 && b > 140 && r - g > -5 && r - g < 22 && g - b > -4 && g - b < 34);
  };
  function visit(p) {
    if (p < 0 || p >= pixels || background[p] || !paper(p)) return;
    background[p] = 1; queue[tail++] = p;
  }
  for (let p = 0; p < pixels; p++) if (frame[p * 4 + 3] < 12) visit(p);
  // Remove only background-connected paper, preserving light marks inside the figure.
  while (head < tail) {
    const p = queue[head++], x = p % width;
    if (x) visit(p - 1);
    if (x < width - 1) visit(p + 1);
    visit(p - width); visit(p + width);
  }
  for (let p = 0; p < pixels; p++) if (background[p]) frame[p * 4 + 3] = 0;
  // Drop disconnected bits of paper while keeping the full connected silhouette.
  const seen = new Uint8Array(pixels);
  for (let p = 0; p < pixels; p++) {
    if (seen[p] || frame[p * 4 + 3] < 20) continue;
    const component = []; head = 0; tail = 1; queue[0] = p; seen[p] = 1;
    while (head < tail) {
      const q = queue[head++]; component.push(q);
      for (const n of [q - width, q + width, q % width ? q - 1 : -1, q % width < width - 1 ? q + 1 : -1]) {
        if (n >= 0 && n < pixels && !seen[n] && frame[n * 4 + 3] >= 20) { seen[n] = 1; queue[tail++] = n; }
      }
    }
    if (component.length < 100) for (const q of component) frame[q * 4 + 3] = 0;
  }
  return frame;
}

for (const animal of ['cat', 'dog']) {
  const input = path.resolve(`public/assets/characters/processed/${animal}-select.webm`);
  const decoded = spawnSync(ffmpeg, ['-v', 'error', '-c:v', 'libvpx-vp9', '-i', input, '-an', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'], { maxBuffer: 256 * 1024 * 1024 });
  if (decoded.status) throw new Error(decoded.stderr.toString());
  const frames = [];
  for (let offset = 0; offset < decoded.stdout.length; offset += bytes) {
    let frame = Buffer.from(decoded.stdout.subarray(offset, offset + bytes));
    if (animal === 'cat') frame = cleanCat(frame);
    else {
      let left = width, right = 0, top = height, bottom = 0;
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (frame[(y * width + x) * 4 + 3] > 128) {
        left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
      const bodyHeight = bottom - top + 1;
      left = Math.max(0, left - 4); top = Math.max(0, top - 4);
      right = Math.min(width - 1, right + 4); bottom = Math.min(height - 1, bottom + 4);
      const cropWidth = right - left + 1, cropHeight = bottom - top + 1;
      const targetHeight = Math.round(cropHeight / bodyHeight * 330), targetWidth = Math.round(cropWidth / bodyHeight * 330);
      const resized = await sharp(frame, { raw: { width, height, channels: 4 } }).extract({ left, top, width: cropWidth, height: cropHeight }).resize(targetWidth, targetHeight).png().toBuffer();
      frame = await sharp({ create: { width, height, channels: 4, background: '#00000000' } }).composite([{ input: resized, left: Math.round((width - targetWidth) / 2), top: 422 - targetHeight }]).raw().toBuffer();
    }
    frames.push(frame);
  }
  const encoded = spawnSync(ffmpeg, ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${width}x${height}`, '-r', '24', '-i', '-', '-an', '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-auto-alt-ref', '0', '-b:v', '0', '-crf', '18', path.join(output, `${animal}-select.webm`)], { input: Buffer.concat(frames), maxBuffer: 256 * 1024 * 1024 });
  if (encoded.status) throw new Error(encoded.stderr.toString());
  console.log(`${animal}: restored ${frames.length} frames; original file untouched`);
}
