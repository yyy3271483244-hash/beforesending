import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const sharp = require('C:/Users/32714/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const source = 'demo美术素材/抽屉信封/envelopes-source.png';
const output = 'public/assets/archive-envelopes';
fs.mkdirSync(output, { recursive: true });
for (const [index, kind] of ['ivory', 'pink', 'blue'].entries()) {
  const extracted = await sharp(source).extract({ left: index * 627, top: 150, width: 627, height: 490 }).png().toBuffer();
  await sharp(extracted).trim({ background: '#00000000', threshold: 12 })
    .resize(600, 440, { fit: 'contain', background: '#00000000' })
    .png().toFile(`${output}/${kind}.png`);
}
await sharp(source).extract({ left: 80, top: 475, width: 100, height: 50 }).png().toFile(`${output}/paper-grain.png`);
console.log('Prepared three unlettered transparent envelopes and a quiet paper texture.');
