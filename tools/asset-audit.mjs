import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const sharp = require('C:/Users/32714/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = process.cwd();
function walk(folder) { return fs.readdirSync(folder, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(folder, entry.name)) : [path.join(folder, entry.name)]); }
const files = walk(path.join(root, 'demo美术素材')).filter(file => /\.(png|jpe?g|webp|gif|svg)$/i.test(file));
fs.mkdirSync('ui-preview', { recursive: true });
const records = [];
const descriptions = [
  ['俯视书桌、线团、纸张与笔', '写信台 / 读写分流'], ['不规则边缘双折信纸', '信纸正反面'], ['灰绿桌面与素纸', '备用写信背景'], ['粉色桌面与笔', '备用写信背景'], ['空白横向纸面', '备用信纸'], ['浅色室内纵深', '备用室内空间'],
  ['三个邮局管理员', '角色参考'], ['角色、纸条、针孔与收纳袋', '旧版角色 / 痕迹参考'], ['管理员、拉车与信纸', '寄信动作参考'], ['三管理员正面', '角色参考'], ['管理员与线结', '角色 / 回针参考'], ['三管理员与收纳箱', '角色参考'],
  ['兔子四种站姿', '管理员备选动作'], ['兔子拉线、提信、抱信、打结', '兔子四种工作姿势'], ['兔子完整立绘', '管理员备选'], ['兔子拿信立绘', '管理员备选'],
  ['小狗完整正面', '管理员备选'], ['小狗邮局制服正面', '管理员备选'], ['小狗拉线、提信、抱信、整理线', '小狗四种工作姿势'], ['小狗四种站姿', '管理员备选动作'],
  ['猫完整立绘带定位线', '角色参考'], ['猫完整正面', '管理员备选'], ['猫四种站姿', '管理员备选动作'], ['猫拉线、提信、抱信、整理线', '猫四种工作姿势'],
  ['管理员寄信与邮局物件', '旧版管理员 / 寄信参考'], ['老鼠制服完整立绘', '角色参考'], ['老鼠正面、拿线、转身、挥手', '老鼠静止与选择回应'], ['老鼠不同服装 / 工作动作', '角色参考'], ['老鼠拉线、线圈、抱信与线结', '老鼠跟随 / 搬运 / 织线'],
  ['展开信封、封口绳、标签', '寄信素材备选'], ['信封、别针、标签、针线', '寄信素材备选'], ['三种开口信封与封口线', '寄信素材备选'], ['信封、封蜡与线团', '寄信素材备选'], ['纸面邮路、线轴、纸信', '寄信台 / 等待空间'],
  ['粉色桌面、线轴与纸笔', '写信素材备选'], ['俯视书桌与工具', '写信素材参考'], ['刺绣绷、针与缝线装饰', '留针回应工具'], ['粉色桌面与信纸', '写信素材备选'], ['七列五行水彩档案柜', '互动抽屉原图'], ['浅色房间纵深与地面', '选管理员 / 拆信 / 读信 / 留针'], ['四只动物、红色邮箱与线', '完整首页 / 邮箱裁切'], ['独立水彩邮箱', '旧版邮箱参考'],
];
for (let batch = 0; batch * 20 < files.length; batch++) {
  const tiles = [];
  for (const [i, file] of files.slice(batch * 20, batch * 20 + 20).entries()) {
    const metadata = await sharp(file).metadata();
    const id = batch * 20 + i;
    records.push({ id, path: path.relative(root, file), width: metadata.width, height: metadata.height, content: descriptions[id]?.[0], suggestedPage: descriptions[id]?.[1] });
    const thumb = await sharp(file).resize(230, 205, { fit: 'contain', background: '#eeefea' }).png().toBuffer();
    tiles.push({ input: thumb, left: i % 5 * 240, top: Math.floor(i / 5) * 235 });
    const label = Buffer.from(`<svg width="230" height="26"><rect width="230" height="26" fill="#ffffff"/><text x="8" y="19" font-size="16" fill="#222">${id} / ${metadata.width} x ${metadata.height}</text></svg>`);
    tiles.push({ input: label, left: i % 5 * 240, top: Math.floor(i / 5) * 235 + 205 });
  }
  await sharp({ create: { width: 1200, height: 940, channels: 3, background: '#eeefea' } }).composite(tiles).jpeg({ quality: 85 }).toFile(`ui-preview/assets-${batch}.jpg`);
}
fs.writeFileSync('ui-preview/asset-inventory.json', JSON.stringify(records, null, 2));
const table = records.map(record => `| ${record.id} | ${record.path.replaceAll('\\', '/')} | ${record.width} x ${record.height} | ${record.content} | ${record.suggestedPage} |`).join('\n');
fs.writeFileSync('ASSET_INVENTORY.md', `# Before Sending 素材核对\n\n本轮实际查看 demo美术素材 中的 42 张图片，见 ui-preview/assets-0.jpg 至 assets-2.jpg。重点使用的角色动作图、首页、抽屉与房间原图另外打开大图检查。未声称重新逐项检查所有旧版素材。原始文件均保留。\n\n| 编号 | 原始路径 | 尺寸 | 实际内容 | 适合位置 |\n|---|---|---|---|---|\n${table}\n\n角色工作图按已查看的原图边界裁切，并对边界连通底色作透明处理；没有生成新角色。抽屉由 SVG viewBox 在浏览器内裁切，同一张原图同时构成柜体和 35 张可动前板。\n`);
console.log(JSON.stringify(records));
