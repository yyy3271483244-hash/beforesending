import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const sharp = require('C:/Users/32714/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const source = 'public/assets/administrators/home-original.png';
const out = 'public/assets/home-stage';
fs.mkdirSync(out, {recursive:true});
const shapes = {
  rabbit: {box:[80,196,227,591], path:'M117 300 Q101 258 106 224 Q108 195 130 205 Q158 215 187 289 Q204 224 235 209 Q265 201 277 215 Q282 235 247 301 L232 333 Q274 364 267 412 L271 443 Q289 470 297 520 Q305 559 281 579 L290 674 L270 687 L269 760 Q260 792 229 780 L209 746 L184 780 Q151 790 137 771 L127 733 L123 690 L99 700 L93 657 L98 602 Q72 576 86 539 L111 470 L120 437 Q99 388 128 353 L137 340 Z'},
  mouse: {box:[314,370,263,414], path:'M392 390 Q345 359 322 408 Q302 446 339 471 L386 484 Q390 510 412 530 L372 549 Q350 581 352 605 L355 668 L349 729 L366 777 L409 780 L426 739 L454 739 L469 779 L508 780 L515 743 L527 638 L544 598 L534 553 L503 531 L518 489 Q558 486 572 453 Q581 410 548 386 Q519 366 490 391 Q444 376 417 400 Z'},
  mailbox: {box:[602,40,241,744], path:'M715 50 Q724 32 735 48 L732 58 L776 68 L805 90 L835 94 L838 122 L800 145 L802 171 L790 186 L797 208 L797 552 L811 565 L812 594 L805 611 L818 755 L836 768 Q745 790 624 774 L621 764 L636 605 L627 584 L638 557 L644 193 L640 178 L651 160 L650 143 L613 123 L606 117 L605 94 Z'},
  cat: {box:[873,361,237,425], path:'M885 376 Q887 356 910 369 L930 380 Q976 372 1011 384 L1050 368 Q1071 357 1073 377 L1068 442 L1054 481 L1029 500 L1038 542 L1052 577 L1042 631 Q1077 690 1099 691 Q1120 711 1084 730 L1039 720 L1033 759 L1019 781 L992 782 L978 738 L950 743 L943 782 L907 783 L902 763 L905 700 L895 665 L891 612 L875 580 L881 536 L901 500 L897 478 L885 420 Z'},
  dog: {box:[1120,328,220,459], path:'M1127 362 Q1161 322 1200 337 Q1239 327 1272 338 L1291 347 Q1326 336 1335 374 L1331 422 Q1322 446 1306 432 L1291 414 L1281 463 L1263 478 L1280 492 L1300 520 L1315 552 L1327 590 Q1344 627 1317 652 L1314 689 L1326 709 L1311 722 L1303 779 L1276 782 L1261 767 L1253 737 L1226 737 L1216 780 L1185 782 L1176 768 L1177 708 L1161 694 L1160 654 Q1134 639 1132 610 L1135 558 L1150 527 L1163 479 L1154 447 L1153 411 Q1133 448 1123 426 Z'},
};
for (const [name,{box}] of Object.entries(shapes)) {
  const [left,top,width,height]=box;
  const {data}=await sharp(source).extract({left,top,width,height}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const visited=new Uint8Array(width*height), queue=[];
  const background=i=>{const r=data[i*4],g=data[i*4+1],b=data[i*4+2];return r>241&&g>231&&b>218&&Math.abs((r-g)-8)<13&&Math.abs((g-b)-9)<13;};
  const add=i=>{if(!visited[i]&&background(i)){visited[i]=1;queue.push(i);}};
  for(let x=0;x<width;x++){add(x);add((height-1)*width+x);}
  for(let y=0;y<height;y++){add(y*width);add(y*width+width-1);}
  for(let n=0;n<queue.length;n++){const i=queue[n],x=i%width,y=Math.floor(i/width);if(x>0)add(i-1);if(x<width-1)add(i+1);if(y>0)add(i-width);if(y<height-1)add(i+width);}
  for(let i=0;i<visited.length;i++)if(visited[i])data[i*4+3]=0;
  await sharp(data,{raw:{width,height,channels:4}}).png().toFile(`${out}/${name}.png`);
}
await sharp(source).extract({left:12,top:12,width:530,height:170}).resize(1456,816,{fit:'fill'}).jpeg({quality:93}).toFile(`${out}/paper-field.jpg`);
console.log('Separated five original painted objects; prepared a matching paper field.');
