import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const sharp = require('C:/Users/32714/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const output = 'public/assets/entrance-envelopes';
const sources = [
  {name:'pink-write', file:'C:/Users/32714/AppData/Local/Temp/codex-clipboard-26ccdc95-0357-49a7-899f-70e7420f0e22.png', crop:{left:85,top:20,width:570,height:450}, outline:'M94 216 L168 196 L150 127 L511 29 L546 79 L555 90 L633 280 L546 318 L569 348 L170 465 L137 369 L132 349 L127 330 Z M475 429 L497 414 L507 411 L528 391 L536 389 L547 380 L633 333 Q642 330 646 336 L649 344 L647 352 L564 403 L555 412 L539 415 L513 427 L502 428 L495 435 L490 431 Z'},
  {name:'pink-read', file:'C:/Users/32714/AppData/Local/Temp/codex-clipboard-97654fed-f3da-426a-a455-cacac60b7f39.png', crop:{left:468,top:326,width:390,height:338}, outline:'M484 388 L555 365 L597 335 L639 345 L726 332 L727 379 L749 393 Q765 413 769 456 L774 487 L779 486 L778 494 L774 501 L782 587 L777 597 L843 636 Q855 640 851 650 Q849 659 840 658 L758 611 L746 600 L520 625 Q504 626 498 605 Q483 569 481 539 L476 536 L478 532 Q474 489 474 453 Q473 430 490 415 Z', paper:'M484 388 L726 332 L731 414 L669 473 L640 495 Q554 467 479 424 L490 415 Z'},
];
fs.mkdirSync(output,{recursive:true});
fs.mkdirSync('qa-evidence',{recursive:true});
for (const item of sources) {
  const {data,info} = await sharp(item.file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  fs.copyFileSync(item.file,`${output}/${item.name}-source.png`);
  async function cut(path, suffix) {
    // A contour matte protects every interior pixel, including the ivory sheet.
    // Antialiased contour + a narrow feather retain the original pencil fringe.
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${info.width}" height="${info.height}"><path d="${path}" fill="white" stroke="white" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
    const mask = await sharp(Buffer.from(svg)).blur(.4).ensureAlpha().raw().toBuffer();
    const rgba = Buffer.from(data);
    for(let p=0;p<info.width*info.height;p++) rgba[p*4+3]=mask[p*4+3];
    await sharp(rgba,{raw:info}).extract(item.crop).png().toFile(`${output}/${item.name}${suffix}.png`);
  }
  if (item.name === 'pink-write') item.outline = item.outline.replace('L569 348 L170 465', 'L571 351 Q470 386 371 412 Q269 443 169 468');
  await cut(item.outline,'');
  if(item.paper) await cut(item.paper,'-paper');
  const check = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${item.crop.width}" height="${item.crop.height}"><defs><pattern id="c" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="#83938f"/><path d="M0 0h12v12H0zM12 12h12v12H12z" fill="#bbc3bf"/></pattern></defs><rect width="100%" height="100%" fill="url(#c)"/></svg>`);
  await sharp(check).composite([{input:`${output}/${item.name}.png`}]).png().toFile(`qa-evidence/${item.name}-alpha.png`);
  const result = await sharp(`${output}/${item.name}.png`).ensureAlpha().raw().toBuffer();
  let holes=0;
  for(let p=0;p<result.length;p+=4) if(result[p+3]===255 && (result[p]!==data[((Math.floor(p/4/item.crop.width)+item.crop.top)*info.width+(p/4)%item.crop.width+item.crop.left)*4])) holes++;
  console.log(`${item.name}: ${item.crop.width}x${item.crop.height}, opaque RGB mismatches: ${holes}`);
}
