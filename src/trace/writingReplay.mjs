// Snapshots are the source of truth, including edits later undone by the writer.
import { graphemeCount } from './graphemes.mjs';

export function buildWritingReplay(letter) {
  const validTime = value => Number.isFinite(value) && value >= 0;
  // Epoch seconds from older imports are distinct from millisecond timestamps.
  const milliseconds = value => value >= 1e9 && value < 1e11 ? value * 1000 : value;
  const events = (letter.events || []).map((event, order) => ({ ...event, order })).filter(e => (validTime(e.time) || validTime(e.replayTime) || validTime(e.timestamp))
    && (typeof e.newText === 'string' || typeof e.text === 'string') && e.type !== 'send')
    .map(event => ({ ...event, newText: event.newText ?? event.text }));
  // Legacy wall-clock snapshots are ordered once; new recordings use relative time.
  if (letter.writingTimelineVersion !== 2 && events.every(e => validTime(e.timestamp))) events.sort((a, b) => a.timestamp - b.timestamp || a.order - b.order);
  const first = events[0];
  const start = milliseconds(first?.timestamp || 0);
  let initialText = '';
  if (first) {
    if (first.type === 'insert' || first.type === 'delete' || first.type === 'replace') {
      const position = first.position || 0;
      initialText = first.newText.slice(0, position) + (first.deleted || '') + first.newText.slice(position + (first.added || '').length);
    } else initialText = first.newText;
  } else initialText = letter.finalText || '';
  let previous = 0, previousRaw = 0;
  const frames = events.map(event => {
    const relative = validTime(event.time) ? event.time - (validTime(first.time) ? first.time : 0) : validTime(event.replayTime)
      ? event.replayTime - (validTime(first.replayTime) ? first.replayTime : 0) : milliseconds(event.timestamp) - start;
    const raw = Math.max(previousRaw, Number.isFinite(relative) ? relative : previousRaw, 0);
    const gap = raw - previousRaw;
    // Old drafts sometimes stored an overnight tab suspension as writing time.
    // Explicit pause events and ordinary gaps keep their original duration.
    previous += gap > 3600000 && (event.type !== 'pause' || !validTime(event.duration) || event.duration < gap - 10000) ? 3000 : gap;
    previousRaw = raw;
    return { ...event, time: previous, text: event.newText };
  });
  // Preserve an explicitly recorded trailing pause, never wall time since Finish.
  const last = frames.at(-1);
  if (last?.type === 'pause' && validTime(last.duration)) {
    const remaining = Math.max(0, last.duration - (last.timestamp - last.startTime || 3000));
    if (remaining) frames.push({ ...last, id: `${last.id || 'pause'}-end`, type: 'suspend', time: last.time + remaining });
  }
  const end = frames.at(-1)?.time;
  const duration = validTime(end) ? end : 0;
  return { frames, start, duration, initialText };
}

export function normalizeWritingHistory(letter) {
  if (letter.writingTimelineVersion === 2) return letter;
  const timeline = buildWritingReplay(letter);
  const normalized = new Map(timeline.frames.filter(event => event.type !== 'suspend' || !String(event.id).endsWith('-end')).map(event => [event.order, event]));
  return { ...letter, writingTimelineVersion: 2, recordedWritingDuration: timeline.duration,
    events: (letter.events || []).map((event, index) => normalized.has(index) ? { ...event, time: normalized.get(index).time } : event) };
}

export function formatReplayTime(milliseconds) {
  const seconds = Math.floor(Number.isFinite(milliseconds) ? Math.max(0, milliseconds) / 1000 : 0);
  const parts = [Math.floor(seconds / 60) % 60, seconds % 60];
  if (seconds >= 3600) parts.unshift(Math.floor(seconds / 3600));
  return parts.map(value => String(value).padStart(2, '0')).join(':');
}

export function writingReplayAt(timeline, time) {
  const target = Math.max(0, Math.min(timeline.duration, time));
  let low = 0, high = timeline.frames.length - 1, index = -1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (timeline.frames[mid].time <= target) { index = mid; low = mid + 1; } else high = mid - 1;
  }
  const event = timeline.frames[index];
  const text = event?.newText ?? timeline.initialText;
  // A visual residue only: it never delays, mutates or replaces the real snapshot.
  const recentFrames = timeline.frames.slice(0, index + 1);
  const interrupt = recentFrames.findLastIndex(frame => ['insert', 'replace', 'undo', 'redo'].includes(frame.type));
  const recent = recentFrames.slice(interrupt + 1).reverse();
  const concealed = recent.find(frame => frame.type === 'deleteSequence' && target - frame.time < (frame.duration || 1250));
  const erased = recent.find(frame => frame.type === 'delete' && frame.deleted && !frame.private
    && frame.deletionVisual !== 'backside' && target - frame.time < 190);
  const effect = concealed || erased;
  const deletion = effect ? {
    ...effect,
    mode: concealed ? 'backside' : 'unpick',
    text: effect.deleted,
    position: Math.min(effect.position || 0, text.length),
    opacity: concealed ? 1 : 1 - (target - effect.time) / 190,
  } : null;
  return { text, event, index, deletion, time: target };
}

export function replayEventLabel(event, en = false) {
  if (event.type === 'pause') return en ? `Pause ${(event.duration / 1000).toFixed(1)} s` : `停顿 ${(event.duration / 1000).toFixed(1)} 秒`;
  if (event.type === 'delete') return en ? `Deleted ${graphemeCount(event.deleted || '')} characters` : `删除 ${graphemeCount(event.deleted || '')} 个字符`;
  if (event.type === 'replace') return en ? 'Revised text' : '修改文字';
  if (event.type === 'undo') return en ? 'Undo' : '撤回一笔';
  return en ? 'Typed text' : '输入文字';
}

// Seeking inspects a snapshot; only elapsed playback contributes watched ranges.
export function addWatchedRange(ranges, start, end) {
  const sorted = [...ranges, [start, end]].sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const range of sorted) {
    const last = merged.at(-1);
    if (last && range[0] <= last[1] + .01) last[1] = Math.max(last[1], range[1]);
    else merged.push([...range]);
  }
  return merged;
}

export const hasWatchedReplay = (ranges, duration) => duration === 0
  || (ranges.length === 1 && ranges[0][0] <= 0 && ranges[0][1] >= duration);
