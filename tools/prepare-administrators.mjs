import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const sharp = require('C:/Users/32714/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const base = 'demo美术素材/动物管理员';
const out = 'public/assets/administrators';
fs.mkdirSync(out, { recursive: true });
const sources = {
  mouse: { file: '老鼠/0_3.jpeg', frames: { following: [285, 0, 390, 450], weaving: [755, 450, 390, 450], carrying: [310, 450, 320, 450], idle: [765, 10, 340, 445] } },
  rabbit: { file: '兔子/0_1.jpeg', frames: { following: [170, 0, 320, 450], weaving: [730, 460, 360, 460], carrying: [165, 460, 330, 460], idle: [760, 0, 330, 450] } },
  dog: { file: '狗/0_3 (1).jpeg', frames: { following: [185, 0, 310, 460], weaving: [710, 460, 350, 460], carrying: [180, 460, 300, 450], idle: [700, 0, 350, 460] } },
  cat: { file: '猫/0_3.jpeg', frames: { following: [60, 15, 375, 435], weaving: [775, 460, 420, 455], carrying: [65, 465, 355, 450], idle: [675, 15, 410, 435] } },
};
// Remove only connected background. Enclosed pale fabric stays opaque.
async function cutout(file, bounds, output, tolerance = 47, feather = 24) {
  const [left, top, width, height] = bounds;
  const { data, info } = await sharp(file).extract({ left, top, width, height }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const corners = [0, width - 1, (height - 1) * width, width * height - 1];
  const background = [0, 1, 2].map(c => corners.reduce((sum, p) => sum + data[p * 4 + c], 0) / 4);
  const seen = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0, tail = 0;
  function visit(p) {
    if (seen[p]) return;
    seen[p] = 1;
    const distance = Math.hypot(data[p * 4] - background[0], data[p * 4 + 1] - background[1], data[p * 4 + 2] - background[2]);
    if (distance < tolerance) { queue[tail++] = p; data[p * 4 + 3] = Math.round(Math.max(0, (distance - feather) / (tolerance - feather)) * 255); }
  }
  for (let x = 0; x < width; x++) { visit(x); visit((height - 1) * width + x); }
  for (let y = 0; y < height; y++) { visit(y * width); visit(y * width + width - 1); }
  while (head < tail) { const p = queue[head++]; if (p % width > 0) visit(p - 1); if (p % width < width - 1) visit(p + 1); if (p >= width) visit(p - width); if (p < width * (height - 1)) visit(p + width); }
  await sharp(data, { raw: info }).png().toFile(output);
}
for (const [animal, source] of Object.entries(sources)) {
  for (const [pose, bounds] of Object.entries(source.frames)) await cutout(path.join(base, source.file), bounds, `${out}/${animal}-${pose}.png`);
}
await cutout(path.join(base, '老鼠/0_2 (1).jpeg'), [95, 25, 275, 465], `${out}/mouse-idle.png`);
await cutout(path.join(base, '老鼠/0_2 (1).jpeg'), [615, 540, 285, 450], `${out}/mouse-reacting.png`);
fs.copyFileSync('demo美术素材/首页视觉/image (1).png', `${out}/home-original.png`);
fs.copyFileSync('demo美术素材/写信页/0_2 (2).jpeg', `${out}/letter-paper.jpg`);
await cutout('demo美术素材/写信页/0_2 (2).jpeg', [0, 0, 1232, 928], `${out}/letter-paper.png`, 20, 10);
console.log('Prepared 17 character poses, original home image and letter paper.');
