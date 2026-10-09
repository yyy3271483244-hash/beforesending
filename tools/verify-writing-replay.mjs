import assert from 'node:assert/strict';
import { addWatchedRange, buildWritingReplay, formatReplayTime, normalizeWritingHistory, hasWatchedReplay, writingReplayAt } from '../src/trace/writingReplay.mjs';
import { isLetterConfirmed, writingWorkflowReducer } from '../src/data/writingWorkflow.mjs';
import { invalidateDelivery, unlockedChapter, chapterIndex, normalizeJourneyProgress } from '../src/data/journey.mjs';
import { navigationTarget } from '../src/data/verticalJourney.mjs';
const events = [
  { id: '1', type: 'insert', timestamp: 1000, position: 0, added: 'I wanted', deleted: '', newText: 'I wanted' },
  { id: '2', type: 'pause', timestamp: 4000, startTime: 1000, duration: 5000, newText: 'I wanted' },
  { id: '3', type: 'delete', timestamp: 6000, position: 2, deleted: 'wanted', added: '', newText: 'I ' },
  { id: '4', type: 'insert', timestamp: 6700, position: 2, added: 'needed', newText: 'I needed' },
  { id: '5', type: 'replace', timestamp: 9000, position: 2, added: 'hope', deleted: 'needed', newText: 'I hope', cancelled: true },
  { id: '6', type: 'undo', timestamp: 9500, newText: 'I needed' },
];
const letter = { finalText: 'I needed', events, startedAt: 1000, writingFinishedAt: 10000 };
const timeline = buildWritingReplay(letter);
assert.equal(timeline.duration, 8500);
assert.equal(timeline.initialText, '');
assert.equal(writingReplayAt(timeline, 4999).text, 'I wanted');
assert.equal(writingReplayAt(timeline, 5000).text, 'I ');
assert.equal(writingReplayAt(timeline, 5000).deletion.text, 'wanted');
assert.equal(writingReplayAt(timeline, 5699).deletion, null);
assert.equal(writingReplayAt(timeline, 5700).text, 'I needed');
assert.equal(writingReplayAt(timeline, 8000).text, 'I hope');
assert.equal(writingReplayAt(timeline, 8500).text, 'I needed');
assert.equal(writingReplayAt(timeline, 8500).deletion.text, 'needed', 'Deletion residue survives the following undo snapshot');
assert.equal(writingWorkflowReducer('writing', { type: 'POSTAGE', letter }), 'writing');
assert.equal(writingWorkflowReducer('replay', { type: 'POSTAGE', letter }), 'replay');
assert.equal(writingWorkflowReducer('confirmed', { type: 'POSTAGE', letter }), 'confirmed');
assert.equal(writingReplayAt(timeline, 4999).text, 'I wanted');
assert.equal(buildWritingReplay({ finalText: 'Legacy', events: [] }).duration, 0);
assert.equal(writingReplayAt(buildWritingReplay({ finalText: 'Legacy', events: [] }), 0).text, 'Legacy');
const progress = normalizeJourneyProgress({ confirmedAdministrator: 'rabbit' });
assert.equal(unlockedChapter(letter, 'rabbit', progress), chapterIndex('write'));
for (const id of ['stamp', 'post', 'waiting']) {
  assert.equal(navigationTarget(chapterIndex(id), letter, 'rabbit', progress), chapterIndex('write'), `${id} cannot be opened before confirmation`);
}
const confirmed = { ...letter, letterConfirmed: true, replayCompletedAt: 10500, replayConfirmedAt: 11000 };
assert.equal(unlockedChapter(confirmed, 'rabbit', progress), chapterIndex('stamp'));
assert.equal(unlockedChapter({ ...letter, replayConfirmedAt: 11000 }, 'rabbit', progress), chapterIndex('write'));
assert.equal(isLetterConfirmed(invalidateDelivery(confirmed, { ...confirmed, finalText: 'Edited' })), false);
assert.equal(invalidateDelivery(letter, { ...letter, replayConfirmedAt: 11000, finalText: 'Edited' }).replayConfirmedAt, null);
console.log('Passed: original 5-second pause, snapshot seek both directions, deletion residue, rewrite, undone edits, legacy drafts and confirmation gate.');
let watched = addWatchedRange([], 0, 2000);
watched = addWatchedRange(watched, 8000, 9000);
assert.equal(hasWatchedReplay(watched, 9000), false, 'Seek must not certify the skipped pause');
watched = addWatchedRange(watched, 2000, 8000);
assert.equal(hasWatchedReplay(watched, 9000), true);
let state = 'desk';
assert.equal(writingWorkflowReducer(state, { type: 'POSTAGE', letter: confirmed }), 'desk');
for (const event of [{ type: 'LIFT' }, { type: 'READY' }]) state = writingWorkflowReducer(state, event);
assert.equal(state, 'writing');
assert.equal(writingWorkflowReducer(state, { type: 'SCROLL' }), 'writing');
assert.equal(writingWorkflowReducer(state, { type: 'POSTAGE', letter: confirmed }), 'writing');
assert.equal(writingWorkflowReducer(state, { type: 'FINISH', hasText: false }), 'writing');
state = writingWorkflowReducer(state, { type: 'FINISH', hasText: true });
assert.equal(writingWorkflowReducer(state, { type: 'CONFIRM', replayReady: false }), 'replay');
state = writingWorkflowReducer(state, { type: 'CONFIRM', replayReady: true });
assert.equal(writingWorkflowReducer(state, { type: 'POSTAGE', letter }), 'confirmed');
state = writingWorkflowReducer(state, { type: 'POSTAGE', letter: confirmed });
assert.equal(state, 'stamp');
state = writingWorkflowReducer(state, { type: 'STAMPED', letter: { ...confirmed, packedAt: 12000, sealedAt: 13000, stampAppliedAt: 14000 } });
assert.equal(state, 'recipient');
assert.equal(writingWorkflowReducer(state, { type: 'SENT', letter: { ...confirmed, sentAt: 15000 } }), 'send');
console.log('Passed: legal workflow transitions, illegal scroll/seek shortcuts, incomplete replay gate and edit invalidation.');
const resumed = buildWritingReplay({
  startedAt: 1, writingFinishedAt: 86401000, recordedWritingDuration: 7000,
  events: [
    { type: 'insert', timestamp: 1000, replayTime: 0, added: 'A', position: 0, newText: 'A' },
    { type: 'pause', timestamp: 4000, replayTime: 3000, startTime: 1000, duration: 6000, newText: 'A' },
    { type: 'insert', timestamp: 86400000, replayTime: 6500, added: 'B', position: 1, newText: 'AB' },
  ],
});
assert.equal(resumed.duration, 6500);
assert.equal(writingReplayAt(resumed, 6000).text, 'A', 'Real six-second pause is preserved');
assert.equal(writingReplayAt(resumed, 6500).text, 'AB', 'Off-page time is excluded');
console.log('Passed: active recording clock, real pause duration and resumed-session timing.');

const polluted = { ...letter, writingFinishedAt: 1915150000, recordedWritingDuration: 1915148000 };
assert.equal(buildWritingReplay(polluted).duration, 8500, 'Finish date / stale duration cannot create a month-long replay');
const migrated = normalizeWritingHistory(polluted);
assert.equal(migrated.recordedWritingDuration, 8500);
assert.equal(migrated.events.length, events.length);
assert.equal(migrated.events[2].deleted, 'wanted');
assert.equal(buildWritingReplay(migrated).duration, 8500);
assert.equal(normalizeWritingHistory(migrated), migrated, 'Migration is idempotent');
assert.equal(buildWritingReplay({ events: [{ id: 'x', time: 0, type: 'initial', text: '' }, { id: 'y', time: 65000, type: 'insert', text: 'Hello' }] }).duration, 65000);
const interrupted = buildWritingReplay({ writingTimelineVersion: 2, events: [
  { id: 'a', type: 'initial', time: 0, newText: '' },
  { id: 'b', type: 'insert', time: 1000, newText: 'Hello' },
  { id: 'c', type: 'suspend', time: 1200, newText: 'Hello' },
  { id: 'd', type: 'resume', time: 1915148000, newText: 'Hello' },
  { id: 'e', type: 'delete', time: 1915148500, newText: 'Hel', deleted: 'lo' },
] });
assert.equal(interrupted.duration, 4700, 'An old wall-clock suspension must not create a multi-day replay');
assert.equal(writingReplayAt(interrupted, 4200).text, 'Hello');
assert.equal(writingReplayAt(interrupted, 4700).text, 'Hel');
const hello = buildWritingReplay({ writingTimelineVersion: 2, events: [
  { id: '0', type: 'initial', time: 0, newText: '' },
  ...['H', 'He', 'Hel', 'Hell', 'Hello'].map((newText, index) => ({ id: `type-${index}`, type: 'insert', time: (index + 1) * 100, newText })),
  { id: 'pause', type: 'pause', time: 2500, duration: 2000, newText: 'Hello' },
  { id: 'del-1', type: 'delete', time: 2600, deleted: 'o', newText: 'Hell' },
  { id: 'del-2', type: 'delete', time: 2700, deleted: 'l', newText: 'Hel' },
  { id: 'rewrite', type: 'insert', time: 2800, added: 'p', newText: 'Help' },
] });
assert.deepEqual([0, 100, 200, 300, 400, 500, 2499, 2600, 2700, 2800].map(time => writingReplayAt(hello, time).text),
  ['', 'H', 'He', 'Hel', 'Hell', 'Hello', 'Hello', 'Hell', 'Hel', 'Help']);
assert.equal(formatReplayTime(hello.duration), '00:02');
assert.equal(formatReplayTime(0), '00:00');
assert.equal(formatReplayTime(65000), '01:05');
assert.equal(formatReplayTime(204000), '03:24');
assert.equal(formatReplayTime(3600000), '01:00:00');
assert.equal(formatReplayTime(3661000), '01:01:01');
assert.equal(buildWritingReplay({ events: [
  {type:'insert', time: 1915148000, newText:'H'},
  {type:'insert', time: 1915150000, newText:'Hi'}] }).duration, 2000);
assert.equal(buildWritingReplay({ events: [
  {type:'insert', timestamp: 1790762523, newText:'H'},
  {type:'insert', timestamp: 1790762525, newText:'Hi'}] }).duration, 2000);
assert.equal(formatReplayTime(NaN), '00:00');
assert.equal(formatReplayTime(Infinity), '00:00');
console.log('Passed: old-draft duration migration, snapshot-only relative schema, finite time formatting.');
assert.equal(isLetterConfirmed({ ...confirmed, replayCompletedAt: null }), true, 'Explicit Send This Letter confirmation is sufficient; watching every frame is optional');
assert.equal(writingWorkflowReducer('writing', { type: 'CONFIRM', replayReady: true }), 'writing');
const resumedV2 = { ...migrated, events: [...migrated.events,
  { id: 'resume', type: 'resume', time: 8500, timestamp: 1e12, newText: 'I needed' },
  { id: 'edit', type: 'insert', time: 9300, timestamp: 1e12 + 800, newText: 'I needed you' },
  { id: 'finish', type: 'suspend', time: 10000, timestamp: 1e12 + 1500, newText: 'I needed you' }] };
assert.equal(buildWritingReplay(resumedV2).duration, 10000);
assert.equal(writingReplayAt(buildWritingReplay(resumedV2), 5000).text, 'I ');
assert.equal(writingReplayAt(buildWritingReplay(resumedV2), 9300).text, 'I needed you');
console.log('Passed: explicit-send gate and append-only editing across wall-clock gaps.');
