import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const sharp = require('C:/Users/32714/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const folder = 'public/assets/stamp-scene';
const source = `${folder}/scene.png`;
const clean = process.argv[2];
if (!clean) throw new Error('Pass the edited clean wall plate path');
const papers = [
  { id:'left', left:452, top:556, width:101, height:84, path:'M462 565 Q467 562 479 566 Q498 568 517 566 L537 563 Q544 561 545 570 L546 622 Q547 630 539 631 L468 632 Q458 632 459 622 L461 579Z', clip:'M500 556 L509 556 L508 567 L500 567Z' },
  { id:'middle', left:606, top:556, width:77, height:92, path:'M615 576 Q617 571 631 570 L650 566 Q662 561 668 568 L674 624 Q677 633 667 636 L632 641 Q620 644 617 629 L613 593 Q610 580 615 576Z', clip:'M630 564 L651 564 L650 574 L630 574Z' },
  { id:'right', left:841, top:552, width:108, height:83, path:'M860 566 Q861 559 869 561 L928 564 Q942 563 941 573 L936 614 Q935 626 926 626 L858 620 Q846 620 849 610Z', clip:'M891 554 L910 554 L911 566 L892 566Z' },
];
for (const p of papers) {
  const box = { left:p.left, top:p.top, width:p.width, height:p.height };
  const svg = content => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${p.width}" height="${p.height}" viewBox="${p.left} ${p.top} ${p.width} ${p.height}">${content}</svg>`);
  const mask = svg(`<path d="${p.path}" fill="white"/><path d="${p.clip}" fill="black"/>`);
  // Luminance mask leaves the clip stationary while the original paper pixels move.
  const raw = await sharp(mask).ensureAlpha().raw().toBuffer();
  for(let i=0;i<raw.length;i+=4) raw[i+3] = Math.round(raw[i+3]*raw[i]/255);
  const alpha = await sharp(raw,{raw:{width:p.width,height:p.height,channels:4}}).png().toBuffer();
  const original = await sharp(source).extract(box).png().toBuffer();
  await sharp(original).composite([{input:alpha,blend:'dest-in'}]).png().toFile(`${folder}/hanging-${p.id}.png`);
  await sharp(original).composite([{input:svg(`<path d="${p.clip}" fill="white"/>`),blend:'dest-in'}]).png().toFile(`${folder}/hanging-${p.id}-clip.png`);
  const wallMask = await sharp(svg(`<path d="${p.path}" fill="white" stroke="white" stroke-width="6" stroke-linejoin="round"/>`)).blur(1).png().toBuffer();
  const wall = await sharp(clean).extract(box).composite([{input:wallMask,blend:'dest-in'}]).png().toBuffer();
  await sharp(original).composite([{input:wall}]).png().toFile(`${folder}/hanging-${p.id}-wall.png`);
}
console.log('Exported three original paper cutouts, fixed clips and local clean wall patches.');
