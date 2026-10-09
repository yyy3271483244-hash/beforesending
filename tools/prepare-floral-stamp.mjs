import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const sharp = require('C:/Users/32714/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const { data, info: { width, height } } = await sharp('public/assets/floral-stamp-button.png').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const count = width * height, exterior = new Uint8Array(count), queue = new Int32Array(count);
let head = 0, tail = 0;
const barrier = p => data[p * 4 + 1] < 215 && data[p * 4 + 2] < 200;
function visit(p) {
  if (p < 0 || p >= count || exterior[p] || barrier(p)) return;
  exterior[p] = 1; queue[tail++] = p;
}
for (let x = 0; x < width; x++) { visit(x); visit((height - 1) * width + x); }
for (let y = 0; y < height; y++) { visit(y * width); visit(y * width + width - 1); }
while (head < tail) {
  const p = queue[head++], x = p % width;
  if (x) visit(p - 1);
  if (x < width - 1) visit(p + 1);
  visit(p - width); visit(p + width);
}
// A closed contour is mandatory: no interior color-keying is allowed.
assert.equal(exterior[Math.floor(height / 2) * width + Math.floor(width / 2)], 0);
assert.ok(tail / count > .15 && tail / count < .35, 'Contour leaked into the paper');
const result = Buffer.from(data);
for (let p = 0; p < count; p++) {
  if (!exterior[p]) continue;
  const neighbors = [p - width, p + width, ...(p % width ? [p - 1] : []), ...(p % width < width - 1 ? [p + 1] : [])];
  const edge = neighbors.filter(n => n >= 0 && n < count && !exterior[n]).sort((a,b) => data[a*4+2] - data[b*4+2])[0];
  let alpha = 0;
  if (edge !== undefined) {
    alpha = Math.max(0, Math.min(1, (234 - data[p*4+2]) / Math.max(1, 234 - data[edge*4+2])));
    // Remove the beige matte only from fractional exterior edge pixels.
    if (alpha > .02) for (let c = 0; c < 3; c++) result[p*4+c] = Math.max(0, Math.min(255, (data[p*4+c] - [249,247,234][c]*(1-alpha))/alpha));
  }
  result[p*4+3] = Math.round(alpha * 255);
}
await sharp(result, { raw: { width, height, channels: 4 } }).png().toFile('public/assets/floral-stamp-button-transparent.png');
console.log({ width, height, exteriorPixels: tail, interiorPreserved: count - tail });
