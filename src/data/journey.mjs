import { isLetterConfirmed } from './writingWorkflow.mjs';

export const chapters = [
  ['opening', '走进邮局', 'At the door'],
  ['dog', '小狗管理员', 'Meet Dog'],
  ['cat', '猫管理员', 'Meet Cat'],
  ['rabbit', '兔子管理员', 'Meet Rabbit'],
  ['mouse', '老鼠管理员', 'Meet Mouse'],
  ['write', '把话写下来', 'Words on paper'],
  ['stamp', '留下邮票', 'A stamp, a seal'],
  ['post', '交给邮路', 'Let it travel'],
  ['waiting', '留一点时间', 'A little time'],
  ['bureau', '匿名档案室', 'Anonymous Bureau'],
];

export const companions = [
  { id: 'dog', name: ['小狗', 'Dog'], title: ['先把心里的话，说出来。', 'Begin with what you feel.'],
    description: ['它总在门边，准备好接住一封信，也准备好回应一个还没说完的开头。', 'By the door, ready to carry a letter, or listen to a beginning that is not quite finished.'],
    mood: ['陪伴想马上说出来的你', 'For the words that cannot wait'],
    note: ['直接 · 热情 · 回应', 'Open · Warm · Encouraging'], scene: '/assets/entrance/post-office-exterior.png' },
  { id: 'cat', name: ['猫', 'Cat'], title: ['停一会儿，也没有关系。', 'There is no hurry here.'],
    description: ['它守着窗边的一小块安静。你没有落笔的时候，它也不会离开。', 'It keeps a quiet corner by the window. Even when the words stop, it stays.'],
    mood: ['陪伴需要沉默与停顿的你', 'For those who need a little silence'],
    note: ['安静 · 观察 · 等待', 'Quiet · Attentive · Patient'], scene: '/assets/writing-desk/desk-empty.png' },
  { id: 'rabbit', name: ['兔子', 'Rabbit'], title: ['乱掉的线，可以慢慢理。', 'A tangle can be unraveled.'],
    description: ['它把针线放在手边，听懂那些反复修改的句子，也珍惜每一次犹豫。', 'With thread close at hand, it makes room for every revision, every uncertain beginning.'],
    mood: ['陪伴细腻、反复斟酌的你', 'For feelings that need gentle care'],
    note: ['敏感 · 温柔 · 共情', 'Sensitive · Gentle · Understanding'], scene: '/assets/writing-desk/desk-empty.png' },
  { id: 'mouse', name: ['老鼠', 'Mouse'], title: ['没说完的话，也有地方放。', 'Unfinished words belong, too.'],
    description: ['它把旧纸条一张张归好。被删掉的句子、暂时说不清的心事，都可以先留下。', 'It puts each little scrap in its place. Erased sentences and tangled thoughts can stay for a while.'],
    mood: ['陪伴想整理混乱思绪的你', 'For thoughts waiting to find their place'],
    note: ['收集 · 归档 · 记忆', 'Collecting · Keeping · Remembering'], scene: '/assets/demo-cutouts/drawer-bg.jpg' },
];

export const draftKey = 'before-sending-letter-v3';
export const journeyProgressKey = 'before-sending-journey-v1';
export const emptyLetter = {
  recipient: '', finalText: '', events: [], fragments: [], knots: [], stitch: [], allowTraces: true,
  startedAt: null, letterConfirmed: false,
  textStyle: { color: '#8f5968', family: 'fine', size: 'medium' },
  selectedEnvelope: 'peach', stampPosition: null, deliveryEmail: '',
};
export function normalizeJourneyProgress(saved = {}) {
  return {
    dialogueProgress: Object.fromEntries(companions.map(({ id }) => [id, saved?.dialogueProgress?.[id] ? 1 : 0])),
    confirmedAdministrator: companions.some(({ id }) => id === saved?.confirmedAdministrator) ? saved.confirmedAdministrator : null,
    waitingVisitedFor: Number(saved?.waitingVisitedFor) || null,
  };
}
export const chapterIndex = id => chapters.findIndex(chapter => chapter[0] === id);
export const companionChapter = animal => chapterIndex(companions.some(person => person.id === animal) ? animal : 'dog');
export function chapterFromHash(hash) {
  const key = hash.replace(/^#/, '').split('/')[0];
  const legacy = { administrators: 'dog', office: 'dog', read: 'bureau', replay: 'bureau', pack: 'stamp', seal: 'stamp', reading: 'bureau', unseal: 'bureau', receive: 'bureau', receiverReplay: 'bureau', stitch: 'bureau' };
  const index = chapters.findIndex(c => c[0] === key);
  return index < 0 ? chapterIndex(legacy[key] || 'opening') : index;
}
export function unlockedChapter(letter, animal, progress = normalizeJourneyProgress()) {
  if (!companions.some(person => person.id === animal) || progress.confirmedAdministrator !== animal) {
    const unmet = companions.find(person => !progress.dialogueProgress?.[person.id]);
    return chapterIndex(unmet?.id || 'mouse');
  }
  if (!isLetterConfirmed(letter)) return chapterIndex('write');
  if (!letter.packedAt) return chapterIndex('stamp');
  if (!letter.stampAppliedAt) return chapterIndex('stamp');
  if (!hasDeliveryAddress(letter)) return chapterIndex('stamp');
  if (!letter.sentAt) return chapterIndex('stamp');
  if (progress.waitingVisitedFor !== letter.sentAt) return chapterIndex('waiting');
  return chapterIndex('bureau');
}
export function hasDeliveryAddress(letter) {
  const recipient = (letter.deliveryRecipient ?? letter.recipient ?? '').trim();
  const email = (letter.deliveryEmail ?? '').trim();
  return Boolean(recipient) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
export function invalidateDelivery(previous, next) {
  if (previous.finalText !== next.finalText || previous.recipient !== next.recipient) {
    return { ...next, letterConfirmed: false, writingFinishedAt: null, replayCompletedAt: null, replayConfirmedAt: null, packedAt: null, sealedAt: null, stampAppliedAt: null, sentAt: null, scheduledDeliveryAt: null };
  }
  if (previous.deliveryRecipient !== next.deliveryRecipient || previous.deliveryEmail !== next.deliveryEmail || previous.deliveryMode !== next.deliveryMode) return { ...next, sentAt: null, scheduledDeliveryAt: null };
  return next;
}
export const languageText = (locale, pair) => pair[locale === 'en' ? 1 : 0];
