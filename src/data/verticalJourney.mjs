import { chapters, chapterIndex, companions, unlockedChapter } from './journey.mjs';

// Keep saved chapter IDs and progress intact; all four keeper routes share one scene.
export const keeperChapter = chapterIndex('dog');
export const visualChapter = index => companions.some(({ id }) => chapters[index]?.[0] === id) ? keeperChapter : index;
export const verticalSections = chapters.flatMap(([id, zh, en], index) => {
  if (visualChapter(index) !== index) return [];
  return [{ id, index, zh: index === keeperChapter ? '信件管理员' : zh, en: index === keeperChapter ? 'Letter Keepers' : en }];
});
export const availableChapter = (letter, keeper, progress) => visualChapter(unlockedChapter(letter, keeper, progress));
export const isPublicSection = index => [0, keeperChapter, chapterIndex('bureau')].includes(visualChapter(index));
export const navigationTarget = (index, letter, keeper, progress) => isPublicSection(index)
  ? visualChapter(index) : Math.min(visualChapter(index), availableChapter(letter, keeper, progress));
