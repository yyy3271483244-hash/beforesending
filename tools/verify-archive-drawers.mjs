import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { makeArchiveDrawers } from '../src/data/archiveDrawers.mjs';

const entries = Array.from({ length: 20 }, (_, n) => ({ id: `postal-drawer-${n}`, category: n === 15 ? 'future' : 'love', letters: [{ id: `letter-${n}`, slot: 0 }], letterCount: 1 }));
const drawers = makeArchiveDrawers(entries);
assert.equal(drawers.length, 35);
assert.equal(new Set(drawers.map(d => d.id)).size, 35);
assert.equal(drawers.filter(d => d.kind === 'empty').length, 15);
assert.equal(drawers.filter(d => d.kind === 'special').length, 1);
assert.equal(drawers.flatMap(d => d.letters).length, 20);
for (const { bounds: b } of drawers) {
  assert.ok(b.width > 0 && b.height > 0 && b.x >= 0 && b.y >= 0);
  assert.ok(b.x + b.width <= 100 && b.y + b.height <= 100);
}
for (let i = 0; i < drawers.length; i++) for (let j = i + 1; j < drawers.length; j++) {
  const a = drawers[i].bounds, b = drawers[j].bounds;
  const overlap = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > .001 && Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > .001;
  assert.equal(overlap, false, `Overlapping drawer targets: ${i + 1}, ${j + 1}`);
}
const component = readFileSync(new URL('../src/components/PostOfficeScenes.jsx', import.meta.url), 'utf8');
assert.match(component, /restoredDrawers\.map/);
assert.doesNotMatch(component, /disabled=\{dimmed\}|restored-archive-envelope/);
assert.match(component, /gsap\.timeline/);
assert.match(component, /inert=\{!ready/);
assert.match(component, /document\.addEventListener\('pointerdown', outside\)/);
assert.match(component, /timeline\.kill\(\)/);
console.log('PASS: 35 unique non-overlapping drawer targets, 3 content states, 20 preserved letters, no filter disabling, staged GSAP reveal and outside close.');
