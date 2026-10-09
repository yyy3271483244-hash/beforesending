import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const sharp = require('sharp');
const ffmpeg = process.env.FFMPEG;
if (!ffmpeg) throw new Error('Set FFMPEG to the installed FFmpeg executable.');
const output = path.resolve('qa-evidence/keeper-motion');
mkdirSync(output, { recursive: true });
const width = 320, height = 444, frameBytes = width * height * 4;
const report = {};
const rows = [];
for (const animal of ['mouse', 'cat', 'rabbit', 'dog']) {
  const restored = process.argv.includes('--restored') && ['cat', 'dog'].includes(animal);
  const video = path.resolve(`public/assets/characters/${restored ? 'selection-restored' : 'processed'}/${animal}-select.webm`);
  const decoded = spawnSync(ffmpeg, ['-v', 'error', '-c:v', 'libvpx-vp9', '-i', video, '-an', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'], { maxBuffer: 256 * 1024 * 1024 });
  if (decoded.status) throw new Error(decoded.stderr.toString());
  const frames = decoded.stdout.length / frameBytes;
  if (!Number.isInteger(frames)) throw new Error(`Unexpected dimensions for ${animal}`);
  const bounds = [];
  for (let i = 0; i < frames; i++) {
    const rgba = decoded.stdout.subarray(i * frameBytes, (i + 1) * frameBytes);
    let left = width, top = height, right = 0, bottom = 0, opaque = 0, transparent = 0;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const alpha = rgba[(y * width + x) * 4 + 3];
      if (!alpha) transparent++;
      if (alpha > 128) { opaque++; left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y); }
    }
    bounds.push({ left, top, right, bottom, opaque, transparent });
  }
  report[animal] = { frames, first: bounds[0], last: bounds.at(-1), minBottom: Math.min(...bounds.map(x => x.bottom)), maxBottom: Math.max(...bounds.map(x => x.bottom)), transparentEveryFrame: bounds.every(x => x.transparent > width * height * .2) };
  const samples = [0, .25, .5, .75, 1].map(f => Math.round(f * (frames - 1)));
  const tiles = [];
  for (let i = 0; i < samples.length; i++) {
    const frame = decoded.stdout.subarray(samples[i] * frameBytes, (samples[i] + 1) * frameBytes);
    const png = await sharp(frame, { raw: { width, height, channels: 4 } }).png().toBuffer();
    const tile = await sharp({ create: { width, height, channels: 4, background: i % 2 ? '#3f4b53' : '#f5efe4' } }).composite([{ input: png }]).png().toBuffer();
    tiles.push({ input: tile, left: i * width, top: 0 });
  }
  const row = await sharp({ create: { width: width * 5, height, channels: 4, background: '#f5efe4' } }).composite(tiles).png().toBuffer();
    writeFileSync(path.join(output, `${animal}-${process.argv.includes('--restored') ? 'restored' : 'source'}-frames.png`), row);
  rows.push({ input: row, left: 0, top: rows.length * height });
}
const prefix = process.argv.includes('--restored') ? 'restored' : 'existing';
await sharp({ create: { width: width * 5, height: height * 4, channels: 4, background: '#f5efe4' } }).composite(rows).png().toFile(path.join(output, `${prefix}-alpha-contact.png`));
writeFileSync(path.join(output, `${prefix}-alpha-report.json`), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
