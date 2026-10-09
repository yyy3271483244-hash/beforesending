import fs from 'node:fs';
import {createRequire} from 'node:module';
const sharp=createRequire(import.meta.url)('C:/Users/32714/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const dir='C:/Users/32714/xwechat_files/wxid_r5d1ueav6n4h22_1b9d/temp/RWTemp/2026-09/9e20f478899dc29eb19741386f9343c8/';
const out='public/assets/stamp-scene'; fs.mkdirSync(out,{recursive:true});
const files=['2c5b38bbd30e22271197b69a43747b38.png','c42c7eed48b3e5c9823709bc3c15deec.png','c6c4f8fbf71c31d00be91c90bed9df5e.png','6809bf7243d5134808ca43b07811b046.png'];
const images=await Promise.all(files.map(file=>sharp(dir+file).ensureAlpha().raw().toBuffer({resolveWithObject:true})));
async function cut(index,name,path,crop){
 const {data,info}=images[index]; const rgba=Buffer.from(data);
 const mask=await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${info.width}" height="${info.height}"><path d="${path}" fill="white"/></svg>`)).blur(.4).ensureAlpha().raw().toBuffer();
 for(let p=0;p<info.width*info.height;p++)rgba[p*4+3]=mask[p*4+3];
 await sharp(rgba,{raw:info}).extract(crop).png().toFile(`${out}/${name}.png`);
}
await cut(1,'open','M535 803 L550 777 L564 612 Q645 548 711 507 Q735 491 756 505 L904 613 L920 791 Q730 801 550 793 Z',{left:529,top:490,width:397,height:315});
await cut(2,'sealed','M530 788 L550 778 L579 664 Q732 658 895 661 L934 794 L550 797 Z',{left:529,top:650,width:410,height:155});
await cut(0,'back','M673 712 L1037 712 L1065 912 L641 914 Z',{left:634,top:702,width:438,height:222});
// Remove the reference's pre-attached stamp using only adjacent envelope paper.
await sharp(`${out}/back.png`).composite([{input:await sharp(`${out}/back.png`).extract({left:60,top:90,width:170,height:90}).resize(172,110).png().toBuffer(),left:230,top:18}]).png().toFile(`${out}/back-blank.png`);
await cut(3,'seal-tool','M85 896 L95 859 L133 840 Q118 815 126 796 Q141 769 170 784 Q194 800 174 843 L225 848 L214 901 L86 903 Z',{left:80,top:772,width:151,height:134});
const boxes=[[[285,768],[337,768],[330,815],[274,815]],[[355,768],[405,768],[399,816],[344,816]],[[414,768],[464,768],[460,816],[409,816]],[[476,768],[525,769],[528,817],[474,817]],[[271,828],[325,827],[319,877],[256,877]],[[340,827],[395,827],[391,878],[332,878]],[[407,827],[463,827],[460,878],[403,878]],[[476,827],[531,827],[535,878],[474,878]]];
for(let i=0;i<boxes.length;i++){
 const points=boxes[i],xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
 const left=Math.min(...xs)-1,top=Math.min(...ys)-1;
 await cut(3,`stamp-${i+1}`,'M'+points.map(p=>p.join(' ')).join(' L')+' Z',{left,top,width:Math.max(...xs)-left+2,height:Math.max(...ys)-top+2});
}
// Clear baked lettering and movable objects with feathered copies of existing paper/table grain.
const patches=[
 {x:85,y:24,w:240,h:53,sx:90,sy:90},
 {x:1125,y:26,w:500,h:45,sx:0,sy:0,table:true},
 {x:85,y:289,w:250,h:128,sx:20,sy:130},
 {x:636,y:754,w:472,h:149,sx:640,sy:732,table:true},
 {x:83,y:775,w:148,h:132,sx:9,sy:765,table:true},
 {x:1408,y:823,w:180,h:57,sx:1408,sy:811,table:true},
];
let composites=[];
for(const p of patches){
 const input=await sharp(dir+files[3]).extract({left:p.sx,top:p.sy,width:p.w,height:p.table?12:p.h}).resize(p.w,p.h).png().toBuffer();
 const mask=await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${p.w}" height="${p.h}"><rect x="3" y="3" width="${p.w-6}" height="${p.h-6}" fill="white"/></svg>`)).blur(2).png().toBuffer();
 composites.push({input:await sharp(input).composite([{input:mask,blend:'dest-in'}]).png().toBuffer(),left:p.x,top:p.y});
}
await sharp(dir+files[3]).composite(composites).png().toFile(`${out}/scene.png`);
