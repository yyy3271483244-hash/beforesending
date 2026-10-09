import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const sharp = require('C:/Users/32714/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const source = 'demo美术素材/新写信桌面/paper-source.png';
const output = 'public/assets/writing-desk/paper.png';
// Follow the supplied paper edge; preserve the light paper interior instead of color-keying white.
const mask = Buffer.from(`<svg width="1376" height="880" xmlns="http://www.w3.org/2000/svg"><path fill="white" d="M68 108 Q64 77 89 78 Q87 61 116 63 L262 65 L388 59 L516 66 L658 64 L685 69 L831 62 L1005 62 L1161 57 L1274 56 Q1299 54 1295 80 Q1311 80 1308 104 L1315 173 L1309 300 L1314 426 L1308 526 L1311 653 L1314 766 Q1316 786 1296 783 L1298 801 L1190 806 L1068 802 L958 809 L847 802 L748 810 L699 805 L680 829 L663 805 L571 804 L455 805 L340 799 L234 804 L141 798 L91 805 L78 788 Q61 782 66 760 L67 656 L61 543 L69 427 L64 297 L67 192 Z"/></svg>`);
fs.mkdirSync('public/assets/writing-desk', { recursive: true });
const cutout = await sharp(source).ensureAlpha().composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
await sharp(cutout).extract({ left: 58, top: 52, width: 1264, height: 782 }).png().toFile(output);
console.log(output);
const readingMask = Buffer.from(`<svg width="675" height="864" xmlns="http://www.w3.org/2000/svg"><path fill="white" d="M1 31 Q-1 15 17 15 L120 10 L226 14 L308 9 L451 13 L546 9 L668 13 L672 166 L669 325 L673 491 L669 663 L673 835 L670 850 L565 854 L433 848 L305 850 L182 844 L85 848 L17 847 Q0 846 2 826 L5 794 L1 650 L3 494 L0 340 L4 185 Z"/></svg>`);
await sharp('demo美术素材/新写信桌面/reading-paper-source.png').ensureAlpha().composite([{input: readingMask, blend: 'dest-in'}]).png().toFile('public/assets/writing-desk/reading-paper.png');
