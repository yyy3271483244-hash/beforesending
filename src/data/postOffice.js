import { archiveEntries } from './archiveCollection';

export const postOfficeAssets = {
  exterior: '/assets/administrators/home-original.png',
  building: '/assets/administrators/home-original.png',
  interior: '/assets/demo-cutouts/reader-room-bg.jpg',
  bureau: '/assets/demo-cutouts/drawer-bg.jpg',
};
export const categories = [
  ['all', '所有信件', 'All Letters'], ['love', '爱', 'Love'], ['grief', '思念与告别', 'Grief'],
  ['apology', '道歉', 'Apology'], ['friendship', '朋友', 'Friendship'], ['younger', '过去的自己', 'To My Younger Self'],
];
export const categoryLabels = {
  love: ['爱', 'Love'], grief: ['告别', 'Grief'], apology: ['道歉', 'Apology'],
  friendship: ['朋友', 'Friends'], younger: ['从前', 'Past Self'], family: ['家人', 'Family'], future: ['未来', 'Tomorrow'],
};
const relation = { '恋人': 'love', '已经离开的人': 'grief', '过去的自己': 'younger', '家人': 'family', '朋友': 'friendship', '未来的自己': 'future' };
const apology = [
  ['给那天的你', '对不起，那天我把沉默留给了你。', '那时候我以为不说话就不会说错。后来才知道，没有回应也会让人难过。今天不急着请求原谅，只想认真把这句话说完。'],
  ['给没有接住的话', '我还记得，你说想聊一会儿。', '而我一直看着时间。现在想来，那天需要被放下的是我的匆忙。下次见面，我愿意把整个下午留给你。'],
].map(([recipient, opening, text], index) => ({ id: `apology-demo-${index}`, recipient, opening, finalText: `${opening}\n\n${text}`, archiveCategory: 'apology', events: [], fragments: [], knots: [], allowTraces: false }));
const letters = [...archiveEntries.map(letter => ({ ...letter, archiveCategory: relation[letter.category] })), ...apology];
// Coordinates belong to the supplied 1672 x 941 cabinet illustration, not viewport pixels.
const columns = [[252, 423], [438, 603], [619, 785], [799, 965], [980, 1147]];
const rows = [[386, 479], [490, 582], [594, 685], [699, 792]];
export const postalDrawers = letters.map((letter, index) => {
  const [left, right] = columns[index % 5], [top, bottom] = rows[Math.floor(index / 5)];
  return { id: `postal-drawer-${index}`, category: letter.archiveCategory, label: categoryLabels[letter.archiveCategory], previewText: letter.opening, letterCount: 1, letters: [letter],
    bounds: { x: left / 1672 * 100, y: top / 941 * 100, width: (right - left) / 1672 * 100, height: (bottom - top) / 941 * 100 } };
});
