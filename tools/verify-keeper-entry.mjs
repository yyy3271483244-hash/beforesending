import assert from 'node:assert/strict';
import test from 'node:test';
import { keeperPlaybackStart } from '../src/animation/keeperPlayback.mjs';

test('first selector visit plays every keeper from the beginning', () => {
  for (const animal of ['mouse', 'cat', 'rabbit', 'dog']) {
    assert.equal(keeperPlaybackStart({ mode: 'idle', duration: 4.016667 }), 0, animal);
  }
});

test('completed or interrupted greeting returns to the existing idle loop', () => {
  assert.equal(keeperPlaybackStart({ mode: 'idle', duration: 4.016667, idleIntroPlayed: true }), 2.016667);
  assert.equal(keeperPlaybackStart({ mode: 'idle', duration: 1.5, idleIntroPlayed: true }), 0);
});

test('hover and selection actions still play their complete action', () => {
  for (const mode of ['hover', 'select']) {
    assert.equal(keeperPlaybackStart({ mode, duration: 4.016667, idleIntroPlayed: true }), 0);
  }
});

test('selected idle keeps its own entry and per-animal loop point', () => {
  const clip = { mode: 'selected-idle', duration: 8.033334, selectedIdleLoopStart: 2.25 };
  assert.equal(keeperPlaybackStart(clip), 0);
  assert.equal(keeperPlaybackStart({ ...clip, selectedIntroPlayed: true }), 2.25);
  assert.equal(keeperPlaybackStart({ ...clip, selectedIntroPlayed: true, selectedIdleLoopStart: 0 }), 0);
  assert.equal(keeperPlaybackStart({ mode: 'selected-idle', duration: 4.016667, selectedIntroPlayed: true }), 2.016667);
});
