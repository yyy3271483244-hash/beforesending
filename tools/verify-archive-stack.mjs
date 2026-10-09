import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { makeArchiveDrawers } from '../src/data/archiveDrawers.mjs';
import { archiveStack } from '../src/data/archiveStack.mjs';

const entries = Array.from({ length: 20 }, (_, i) => ({ id: `drawer-${i}`, category: i % 2 ? 'love' : 'future', letters: [{ id: `letter-${i}`, finalText: `Sample ${i}` }] }));
const drawers = makeArchiveDrawers(entries);
assert.equal(drawers.length, 35);
assert.equal(drawers.filter(drawer => drawer.kind !== 'empty').length, 20);
for (const drawer of drawers) {
  const stack = archiveStack(drawer, drawers);
  if (drawer.kind === 'empty') assert.deepEqual(stack, []);
  else {
    assert.equal(stack.length, 7);
    assert.equal(new Set(stack.map(letter => letter.id)).size, 7);
    assert.equal(stack[0], drawer.letters[0]);
    assert.ok(stack.every(letter => entries.some(entry => entry.letters.includes(letter))));
    assert.deepEqual(archiveStack(drawer, drawers), stack);
  }
}
const component = readFileSync(new URL('../src/components/ArchiveCabinet.jsx', import.meta.url), 'utf8');
assert.ok(!/scrollTo|scrollIntoView|location\.|router\./.test(component));
assert.match(component, /readingState.current !== 'reading'/);
assert.match(component, /originTransform\(\)/);
assert.match(component, /stagger: duration\(\.05\)/);
assert.match(component, /focus\(\{ preventScroll: true \}\)/);
console.log('PASS: 35 original cells, 20 interactive drawers, 7 unique existing letters per stack, stable filing order, guarded transitions, no scroll or route changes.');
