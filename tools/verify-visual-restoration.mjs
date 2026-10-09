import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const excluded = ['demo美术素材/新版', 'animals_v2_cutout', '/assets/keeper-rooms/', '/assets/post-office/'];
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const file = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(file) : [file];
});
const required = [
  'administrators/home-original.png', 'administrators/post-office-facade.png',
  'home-stage/paper-field.jpg',
  'writing-desk/paper.png', 'writing-desk/desk-empty.png', 'demo-cutouts/drawer-bg.jpg',
  'writing-desk/paper-middle.png',
  'entrance-envelopes/read-complete.png', 'entrance-envelopes/write-complete.png',
  ...['mouse', 'cat', 'rabbit', 'dog'].flatMap(animal =>
    ['idle', 'following', 'weaving', 'carrying'].map(pose => `administrators/${animal}-${pose}.png`)),
  'administrators/mouse-reacting.png',
];
for (const asset of required) assert.ok(fs.existsSync(path.join(root, 'public/assets', asset)), `Missing old asset: ${asset}`);
for (const folder of ['animals_v2_cutout', 'keeper-rooms', 'post-office']) {
  for (const directory of ['public/assets', 'dist/assets']) {
    assert.ok(!fs.existsSync(path.join(root, directory, folder)), `Excluded visual directory still distributed: ${directory}/${folder}`);
  }
}
let scanned = 0;
for (const directory of ['src', 'dist']) {
  assert.ok(fs.existsSync(path.join(root, directory)), `Run npm run check before this test: missing ${directory}`);
  for (const file of walk(path.join(root, directory))) {
    if (!/\.(?:jsx?|mjs|css|html)$/.test(file)) continue;
    const source = fs.readFileSync(file, 'utf8').replaceAll('\\', '/');
    for (const banned of excluded) assert.ok(!source.includes(banned), `Excluded asset reference in ${file}: ${banned}`);
    scanned++;
  }
}
console.log(`PASS: ${required.length} old assets present; ${scanned} source/build files scanned; zero excluded asset references.`);
