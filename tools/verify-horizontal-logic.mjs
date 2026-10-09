import assert from 'node:assert/strict';
import { chapters, companions, chapterIndex, companionChapter, emptyLetter, chapterFromHash, unlockedChapter, invalidateDelivery, normalizeJourneyProgress, hasDeliveryAddress } from '../src/data/journey.mjs';

assert.deepEqual(chapters.map(([id]) => id), ['opening', 'dog', 'cat', 'rabbit', 'mouse', 'write', 'stamp', 'post', 'waiting', 'bureau']);
assert.deepEqual(companions.map(({ id }) => id), ['dog', 'cat', 'rabbit', 'mouse']);
assert.equal(unlockedChapter(emptyLetter, null), chapterIndex('dog'));
assert.equal(unlockedChapter(emptyLetter, 'cat'), chapterIndex('dog'), 'Cached animal cannot bypass introductions');
assert.equal(unlockedChapter(emptyLetter, 'unknown'), chapterIndex('dog'));
assert.equal(companionChapter(null), chapterIndex('dog'));
let progress = normalizeJourneyProgress();
for (const person of companions) {
  assert.equal(companionChapter(person.id), chapterIndex(person.id));
  assert.equal(unlockedChapter(emptyLetter, null, progress), chapterIndex(person.id));
  progress.dialogueProgress[person.id] = 1;
}
assert.equal(unlockedChapter(emptyLetter, 'cat', progress), chapterIndex('mouse'), 'Passing every room still requires an explicit choice');
progress.confirmedAdministrator = 'cat';
assert.equal(unlockedChapter(emptyLetter, 'cat', progress), chapterIndex('write'));
assert.equal(unlockedChapter(emptyLetter, 'mouse', progress), chapterIndex('mouse'));
for (const person of companions) {
  const chosenInRoom = normalizeJourneyProgress({ confirmedAdministrator: person.id, dialogueProgress: { [person.id]: 1 } });
  assert.equal(unlockedChapter(emptyLetter, person.id, chosenInRoom), chapterIndex('write'), 'Choosing in any room goes to the existing desk');
  assert.equal(normalizeJourneyProgress(JSON.parse(JSON.stringify(chosenInRoom))).confirmedAdministrator, person.id);
}
assert.deepEqual(normalizeJourneyProgress(JSON.parse(JSON.stringify(progress))), progress);
assert.equal(normalizeJourneyProgress(null).confirmedAdministrator, null);
let letter = { ...emptyLetter, recipient: 'A friend', finalText: 'A letter', events: [{ type: 'insert' }], fragments: [{ content: 'An earlier word' }] };
assert.equal(unlockedChapter(letter, 'cat', progress), chapterIndex('write'));
letter = { ...letter, letterConfirmed: true, writingFinishedAt: 1, replayConfirmedAt: 2 };
for (const [fields, maximum] of [
  [{ packedAt: null }, chapterIndex('stamp')],
  [{ packedAt: 2 }, chapterIndex('stamp')],
  [{ stampAppliedAt: 3 }, chapterIndex('stamp')],
  [{ sealedAt: 4 }, chapterIndex('post')],
  [{ sentAt: 5, scheduledDeliveryAt: 17 }, chapterIndex('waiting')],
]) {
  letter = { ...letter, ...fields };
  assert.equal(unlockedChapter(letter, 'cat', progress), maximum);
}
progress.waitingVisitedFor = 5;
assert.equal(unlockedChapter(letter, 'cat', progress), chapterIndex('bureau'));
assert.equal(unlockedChapter({ ...letter, sentAt: 6 }, 'cat', progress), chapterIndex('waiting'), 'Each new dispatch has its own waiting scene');
assert.equal(unlockedChapter(letter, null, progress), chapterIndex('mouse'));
assert.equal(unlockedChapter({ ...letter, deliveryRecipient: '' }, 'cat', progress), chapterIndex('stamp'));
assert.equal(hasDeliveryAddress({ deliveryMode: 'email', deliveryRecipient: 'invalid' }), false);
assert.equal(hasDeliveryAddress({ deliveryMode: 'email', deliveryRecipient: 'friend@example.test' }), true);
const revised = invalidateDelivery(letter, { ...letter, finalText: 'A revised letter' });
assert.equal(unlockedChapter(revised, 'cat', progress), chapterIndex('write'));
for (const key of ['writingFinishedAt', 'packedAt', 'sealedAt', 'stampAppliedAt', 'sentAt', 'scheduledDeliveryAt']) assert.equal(revised[key], null);
assert.equal(revised.events, letter.events);
assert.equal(revised.fragments, letter.fragments);
assert.equal(invalidateDelivery(letter, { ...letter, stampId: 'night' }).sentAt, 5);
assert.equal(invalidateDelivery(letter, { ...letter, recipient: 'Someone else' }).packedAt, null);
assert.equal(invalidateDelivery(letter, { ...letter, deliveryRecipient: 'Another person' }).sentAt, null);
assert.equal(unlockedChapter({ ...letter, finalText: '  ' }, 'cat', progress), chapterIndex('write'));
assert.equal(unlockedChapter({ ...letter, writingFinishedAt: null }, 'cat', progress), chapterIndex('write'));
assert.equal(unlockedChapter({ ...revised, packedAt: 2, sealedAt: 4, stampAppliedAt: 3 }, 'cat', progress), chapterIndex('write'));
for (const [hash, id] of [['#opening', 'opening'], ['#write', 'write'], ['#pack', 'stamp'], ['#seal', 'stamp'], ['#bureau', 'bureau'], ['#waiting', 'waiting'], ['#replay', 'bureau'], ['#cat', 'cat'], ['#administrators', 'dog'], ['#office', 'dog'], ['#read', 'bureau'], ['#missing', 'opening']]) assert.equal(chapterFromHash(hash), chapterIndex(id));
console.log('Keeper rooms: explicit room choice, persistence, legacy links and all unchanged writing/delivery gates passed.');
