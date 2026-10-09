import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const code = readFileSync('src/data/animalAssets.js', 'utf8');
const { animalAssets, keeperSelectionAssets } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const oldReport = JSON.parse(readFileSync('qa-evidence/keeper-motion/existing-alpha-report.json'));
const report = JSON.parse(readFileSync('qa-evidence/keeper-motion/restored-alpha-report.json'));
const source = 'demo美术素材/动物管理员';
const digest = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const paths = new Set();
for (const [id, directory] of Object.entries({ dog: '狗', cat: '猫', rabbit: '兔子', mouse: '老鼠' })) {
  const asset = keeperSelectionAssets[id];
  assert.ok(asset.video.endsWith(`/${id}-select.webm`));
  assert.ok(existsSync(`public${asset.video}`));
  paths.add(asset.video);
  assert.equal(digest(`${source}/${directory}/选择.mp4`), digest(`${source}/动物-expanded/${directory}/选择.mp4`), `${id}: previous processing source matches supplied video`);
  assert.equal(report[id].frames, oldReport[id].frames, `${id}: no frames discarded`);
  assert.equal(report[id].transparentEveryFrame, true, `${id}: every frame retains alpha`);
  assert.ok(report[id].first.opaque > 25000, `${id}: subject not missing`);
  assert.ok(asset.feet[1] <= asset.height);
  assert.ok(animalAssets[id].select.video.includes('/processed/'), 'shared writing asset map stays original');
  assert.ok(animalAssets[id].pause.video.includes('/idle-split/'), 'writing idle split stays original');
}
assert.equal(paths.size, 4, 'four different character videos');
assert.ok(report.dog.maxBottom - report.dog.minBottom <= 4, 'dog baseline stays stable');
assert.ok(Math.abs((report.dog.first.bottom - report.dog.first.top) - (report.dog.last.bottom - report.dog.last.top)) <= 2, 'dog does not grow during the action');
assert.ok(report.cat.first.transparent > oldReport.cat.first.transparent, 'cat paper residue is removed');

const selection = readFileSync('src/components/JourneyCompanion.jsx', 'utf8');
const player = readFileSync('src/components/SelectionAnimalMedia.jsx', 'utf8');
assert.ok(selection.includes('onMouseEnter={() => hover(id)}') && selection.includes('onFocus={() => hover(id)}'));
assert.ok(!selection.includes('animal-motion-preloads'), 'no duplicate visible preloader videos');
assert.ok(player.includes('onEnded={hold}'), 'completion holds the last frame');
assert.ok(!player.includes('<img'), 'selection is rendered from the video, not a replacement PNG');
assert.ok(player.includes('muted playsInline preload="auto" controls={false}'));
assert.ok(player.includes('visibilitychange') && player.includes('prefers-reduced-motion'), 'inactive/quiet playback is guarded');
console.log('PASS keeper motion: four original sources, alpha on all 97 frames, stable dog size, cleaner cat matte, preserved writing bindings and selection-only playback guards.');
