import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require('C:/Users/32714/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const source = 'demo美术素材/信封入口';
const output = 'public/assets/entrance-envelopes';
const width = 1232, height = 928;
fs.mkdirSync(output, { recursive: true });

// Traced in source-image coordinates, not a brightness key: pale paper stays opaque.
const outlines = {
  write: 'M174 346 Q222 322 308 265 Q371 219 434 181 Q490 145 563 124 Q622 98 667 117 Q709 131 755 158 Q847 211 934 262 Q1003 310 1069 350 Q1080 366 1076 402 L1077 587 L1077 774 Q1075 780 1066 779 L864 784 Q794 801 748 794 Q657 789 594 786 L433 780 Q314 771 186 766 Q175 765 176 745 Q167 587 171 387 Q168 360 174 346Z',
  read: 'M160 350 Q181 302 246 267 Q400 169 524 97 Q611 49 667 64 Q733 88 803 134 Q946 218 1030 288 Q1063 319 1074 349 Q1093 432 1093 545 L1091 846 Q1093 852 1084 851 Q921 857 753 861 Q639 866 527 854 L149 841 Q143 841 143 833 Q128 663 129 565 Q129 470 160 350Z',
};
const paper = 'M310 267 L932 263 L814 515 Q623 526 427 517Z';
const writeFlap = 'M165 340 Q319 259 436 180 Q613 80 682 125 Q854 215 1080 348 L1080 356 Q949 461 814 546 L814 515 Q623 526 427 517 L427 549 Q360 514 274 430 L171 376Z';
const pen = 'M1034 531 L1040 539 L1012 587 L1017 600 L1005 618 L968 681 L951 692 L946 715 L932 734 L932 749 L905 764 L916 733 L938 701 L946 682 L940 672 L948 647 L994 574Z';
const readFlap = 'M159 351 Q610 370 1076 350 L819 523 Q712 612 637 625 Q563 629 449 564Z';

async function mask(path) {
  return sharp(Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><path d="${path}" fill="white"/></svg>`)).ensureAlpha().raw().toBuffer();
}

async function save(name, rgb, alpha, crop) {
  const data = Buffer.from(rgb);
  for (let p = 0; p < width * height; p++) {
    data[p * 4 + 3] = alpha[p];
    if (!alpha[p]) data.fill(0, p * 4, p * 4 + 3);
  }
  let result = sharp(data, { raw: { width, height, channels: 4 } });
  if (crop) result = result.extract(crop);
  await result.png().toFile(`${output}/${name}.png`);
}

for (const kind of ['write', 'read']) {
  const rgb = await sharp(`${source}/${kind}-source.png`).ensureAlpha().raw().toBuffer();
  const outerMask = await mask(outlines[kind]);
  const outer = Uint8Array.from({ length: width * height }, (_, p) => outerMask[p * 4 + 3]);
  await save(`${kind}-complete`, rgb, outer);

  const thread = new Uint8Array(width * height);
  for (let y = kind === 'write' ? 578 : 598; y < (kind === 'write' ? 647 : 802); y++) {
    for (let x = kind === 'write' ? 510 : 607; x < (kind === 'write' ? 1082 : 795); x++) {
      const p = y * width + x, i = p * 4;
      const redness = rgb[i] - rgb[i + 1];
      if (kind === 'write' && Math.abs(y - (683.2 - .0895 * x)) > 5) continue;
      thread[p] = outer[p] ? Math.round(Math.min(1, Math.max(0, (redness - 21) / 20)) * outer[p]) : 0;
    }
  }
  await save(`${kind}-thread`, rgb, thread);
  const penMask = kind === 'write' ? await mask(pen) : null;
  const penAlpha = penMask && Uint8Array.from({ length: width * height }, (_, p) => Math.min(outer[p], penMask[p * 4 + 3]));
  if (penAlpha) await save('write-pen', rgb, penAlpha);

  // Fill only the thin extracted details with adjacent original paper pixels.
  const clean = Buffer.from(rgb);
  for (let p = 0; p < width * height; p++) {
    if (!thread[p] && !penAlpha?.[p]) continue;
    const x = p % width, y = Math.floor(p / width);
    for (let distance = 1; distance < 80; distance++) {
      const candidates = penAlpha?.[p] ? [[x + distance, y], [x - distance, y]] : [[x, y - distance], [x, y + distance]];
      const sample = candidates.find(([sx, sy]) => sx >= 0 && sx < width && sy >= 0 && sy < height && outer[sy * width + sx] === 255 && !thread[sy * width + sx] && !penAlpha?.[sy * width + sx]);
      if (!sample) continue;
      const q = sample[1] * width + sample[0];
      for (let channel = 0; channel < 3; channel++) clean[p * 4 + channel] = rgb[q * 4 + channel];
      break;
    }
  }

  const flapMask = await mask(kind === 'write' ? writeFlap : readFlap);
  const paperMask = kind === 'write' ? await mask(paper) : null;
  const flap = new Uint8Array(width * height), body = new Uint8Array(width * height);
  for (let p = 0; p < width * height; p++) {
    const paperValue = paperMask?.[p * 4 + 3] || 0;
    flap[p] = Math.min(outer[p], Math.max(0, flapMask[p * 4 + 3] - paperValue));
    body[p] = Math.max(0, outer[p] - flap[p] - paperValue);
  }
  await save(`${kind}-flap`, clean, flap);
  await save(`${kind}-body`, clean, body);
  if (paperMask) {
    // Extend the hidden sheet using its own paper texture, so lifting reveals paper, not a gap.
    const extendedMask = await mask('M310 267 L932 263 L814 515 L814 720 L427 720 L427 517Z');
    const sheet = Buffer.from(rgb);
    for (let y = 505; y < 721; y++) {
      for (let x = 427; x <= 814; x++) {
        const sampleY = 450 + (y - 505) % 48;
        for (let channel = 0; channel < 3; channel++) sheet[(y * width + x) * 4 + channel] = rgb[(sampleY * width + x) * 4 + channel];
      }
    }
    const paperAlpha = Uint8Array.from({ length: width * height }, (_, p) => extendedMask[p * 4 + 3]);
    await save('write-paper', sheet, paperAlpha, { left: 308, top: 260, width: 628, height: 470 });
  }
  console.log(`Prepared ${kind}: transparent original contour and separate motion layers.`);
}
