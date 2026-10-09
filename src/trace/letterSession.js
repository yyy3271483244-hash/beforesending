import { useEffect, useRef, useState } from "react";
import { buildWritingReplay, normalizeWritingHistory } from './writingReplay.mjs';
import { emitThreadEvent, THREAD_ACTIONS } from "../animation/threadEvents";
import { graphemeCount } from './graphemes.mjs';

export const idFor = (type) => `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
export const pauseLevel = (duration) => duration >= 8000 ? 3 : duration >= 5000 ? 2 : duration >= 3000 ? 1 : 0;

export function changeRange(previous, next) {
  let start = 0, end = 0;
  while (start < previous.length && start < next.length && previous[start] === next[start]) start++;
  while (end < previous.length - start && end < next.length - start && previous[previous.length - 1 - end] === next[next.length - 1 - end]) end++;
  return { start, deleted: previous.slice(start, previous.length - end), added: next.slice(start, next.length - end) };
}

export function measureCaret(element, text, index) {
  if (!element) return { x: 0, y: 0, animalX: 0, width: 0, index: 0 };
  const style = getComputedStyle(element);
  const mirror = document.createElement("div");
  const properties = ["fontFamily", "fontSize", "fontWeight", "fontStyle", "lineHeight", "letterSpacing", "wordSpacing", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "textIndent", "tabSize"];
  properties.forEach((property) => { mirror.style[property] = style[property]; });
  Object.assign(mirror.style, { position: "absolute", visibility: "hidden", left: "-20000px", top: "0", boxSizing: "border-box", width: `${element.clientWidth}px`, whiteSpace: "pre-wrap", overflowWrap: "anywhere" });
  const safeIndex = Math.max(0, Math.min(index, text.length));
  mirror.textContent = text.slice(0, safeIndex);
  const marker = document.createElement("span");
  marker.textContent = text.slice(safeIndex, safeIndex + 1) || "\u200b";
  mirror.appendChild(marker);
  document.body.appendChild(mirror);
  const rect = marker.getBoundingClientRect();
  const origin = mirror.getBoundingClientRect();
  const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 2;
  const x = rect.left - origin.left;
  const y = rect.top - origin.top - element.scrollTop;
  mirror.remove();
  const width = element.clientWidth;
  const inMiddle = safeIndex < text.length && text[safeIndex] !== "\n";
  const animalX = inMiddle ? width - 64 : Math.min(width - 64, x + 30);
  return { x, y, width, animalX: Math.max(0, animalX), index: safeIndex, line: Math.floor(y / lineHeight), paragraphId: `p${text.slice(0, safeIndex).split("\n").length}`, availableSide: x > width - 100 ? "left" : "right" };
}

function shiftAnchor(position, start, deleted, added) {
  if (position <= start) return position;
  if (position < start + deleted) return start + added;
  return position + added - deleted;
}

export function hideFragment(letter, fragmentId) {
  const fragment = letter.fragments.find((item) => item.id === fragmentId);
  if (!fragment) return letter;
  const hidden = new Set(fragment.tokenIds || []);
  const filterText = (text, ids) => (text || "").split("").filter((_, index) => !hidden.has(ids?.[index])).join("");
  const cutoff = Math.max(...(fragment.eventIds || [fragment.eventId]).map((id) => letter.events.findIndex((event) => event.id === id)));
  const events = letter.events.map((event, index) => {
    if (!event.tokenIds && index <= cutoff) return { id: event.id, type: event.type, timestamp: event.timestamp, time: event.time, replayTime: event.replayTime, duration: event.duration, newText: "", text: "", private: true };
    return { ...event, newText: filterText(event.newText, event.tokenIds), text: filterText(event.newText, event.tokenIds), tokenIds: event.tokenIds?.filter((id) => !hidden.has(id)), added: filterText(event.added, event.addedTokenIds), addedTokenIds: event.addedTokenIds?.filter((id) => !hidden.has(id)), deleted: filterText(event.deleted, event.deletedTokenIds), deletedTokenIds: event.deletedTokenIds?.filter((id) => !hidden.has(id)) };
  });
  return { ...letter, events: [...events, { id: idFor("hide"), type: "permanentHide", fragmentId, timestamp: Date.now(), time: buildWritingReplay(letter).duration, newText: letter.finalText, text: letter.finalText, tokenIds: letter.characterIds }], fragments: letter.fragments.map((item) => item.id === fragmentId ? { ...item, content: "", tokenIds: [], cut: true, isPermanentHidden: true, context: undefined } : item) };
}

export function useLetterSession(letter, setLetter, editor) {
  const current = useRef(letter);
  current.current = letter;
  const lastInput = useRef(null);
  const focused = useRef(false);
  const activePause = useRef(null);
  const lastPauseUpdate = useRef(0);
  const previousCaret = useRef(null);
  const composition = useRef(null);
  const history = useRef([]);
  const redoHistory = useRef([]);
  const deletionSequence = useRef(null);
  const deletionTimer = useRef(null);
  const recordingClock = useRef(null);
  if (!recordingClock.current) recordingClock.current = {
    elapsed: buildWritingReplay({ ...letter, writingFinishedAt: null }).duration, started: null,
  };
  const elapsed = () => recordingClock.current.elapsed + (recordingClock.current.started === null ? 0 : performance.now() - recordingClock.current.started);
  function startClock() {
    if (recordingClock.current.started === null) recordingClock.current.started = performance.now();
  }
  function snapshot(type, time = elapsed()) {
    const data = current.current;
    const event = { id: idFor(type), type, time, timestamp: Date.now(), text: data.finalText, newText: data.finalText,
      selectionStart: editor.current?.selectionStart ?? 0, selectionEnd: editor.current?.selectionEnd ?? 0, tokenIds: data.characterIds, textStyle: data.textStyle };
    commit({ ...data, writingTimelineVersion: 2, recordedWritingDuration: time, events: [...data.events, event] });
  }
  const [activity, setActivity] = useState("idle");
  const [ghost, setGhost] = useState(null);
  const [caret, setCaret] = useState({ x: 0, y: 0, animalX: 20, width: 500, index: 0 });

  function commit(next) { current.current = next; setLetter(next); }
  function closeDeletionSequence() {
    clearTimeout(deletionTimer.current);
    const sequence = deletionSequence.current;
    deletionSequence.current = null;
    if (!sequence?.visualEventId) return;
    const data = current.current;
    commit({ ...data, events: data.events.map(event => event.id === sequence.visualEventId
      ? { ...event, deleted: sequence.text, sequenceEndTimestamp: Date.now(), sequenceEndTime: elapsed(), sequenceText: sequence.text, characterCount: sequence.count, rawEventIds: sequence.rawEventIds }
      : event) });
  }
  function track(index = editor.current?.selectionStart || 0, text = current.current.finalText) {
    if (deletionSequence.current && index !== deletionSequence.current.caretIndex) closeDeletionSequence();
    if (activePause.current && previousCaret.current?.index !== index) {
      tick(performance.now(), true);
      activePause.current = null;
      lastInput.current = null;
      setActivity("idle");
    }
    const next = measureCaret(editor.current, text, index);
    previousCaret.current = next;
    setCaret(next);
    return next;
  }

  function tick(now = performance.now(), force = false) {
    if (!focused.current || lastInput.current === null || composition.current !== null) return;
    const duration = now - lastInput.current;
    if (!current.current.finalText.trim()) return;
    if (duration < 3000) { if (duration >= 800) setActivity("pausePending"); return; }
    if (activePause.current && !force && now - lastPauseUpdate.current < 1000) return;
    const data = current.current;
    const point = previousCaret.current || caret;
    const pauseId = activePause.current || idFor("pause");
    const event = { id: pauseId, type: "pause", timestamp: Date.now() - duration + 3000, time: elapsed() - duration + 3000, startTime: Date.now() - duration, duration, position: point.index, caretIndex: point.index, selectionStart: point.index, selectionEnd: point.index, paragraphId: point.paragraphId, textRange: [point.index, point.index], linePosition: point, knotLevel: pauseLevel(duration), text: data.finalText, newText: data.finalText, tokenIds: data.characterIds };
    const knot = { ...event, complexity: event.knotLevel };
    const exists = activePause.current;
    activePause.current = pauseId;
    lastPauseUpdate.current = now;
    setActivity("weaving");
    commit({ ...data, recordedWritingDuration: elapsed(), events: exists ? data.events.map((item) => item.id === pauseId ? event : item) : [...data.events, event], knots: exists ? (data.knots || []).map((item) => item.id === pauseId ? knot : item) : [...(data.knots || []), knot] });
    if (!exists) emitThreadEvent(THREAD_ACTIONS.pause, event);
  }

  function suspend() {
    if (focused.current) tick(performance.now(), true);
    closeDeletionSequence();
    if (recordingClock.current.started !== null) {
      recordingClock.current.elapsed = elapsed();
      recordingClock.current.started = null;
      snapshot('suspend', recordingClock.current.elapsed);
    }
    focused.current = false;
    activePause.current = null;
    lastInput.current = null;
    setActivity("idle");
  }

  useEffect(() => {
    // Also migrate a draft already mounted when this repair arrives through HMR.
    if (current.current.writingTimelineVersion !== 2) {
      const normalized = normalizeWritingHistory(current.current);
      recordingClock.current = { elapsed: normalized.recordedWritingDuration, started: null };
      commit(normalized);
    }
    const timer = setInterval(() => tick(), 250);
    const visibility = () => { if (document.hidden) suspend(); };
    window.addEventListener("blur", suspend);
    document.addEventListener("visibilitychange", visibility);
    const resize = new ResizeObserver(() => track());
    const remeasure = () => track();
    window.addEventListener('before-sending-languagechange', remeasure);
    if (editor.current) resize.observe(editor.current);
    return () => { clearInterval(timer); clearTimeout(deletionTimer.current); resize.disconnect(); window.removeEventListener("blur", suspend); document.removeEventListener("visibilitychange", visibility); window.removeEventListener('before-sending-languagechange', remeasure); };
  }, []);

  function record(nextText, index, previousOverride, inputType = '') {
    tick(performance.now(), true);
    let data = current.current;
    const previous = previousOverride ?? data.finalText;
    const change = changeRange(previous, nextText);
    if (!change.deleted && !change.added) return;
    const now = Date.now();
    const activeDelete = Boolean(change.deleted && !change.added && inputType.startsWith('delete'));
    const direction = inputType.endsWith('Backward') ? 'backward' : inputType.endsWith('Forward') ? 'forward' : 'selection';
    let sequence = deletionSequence.current;
    const expectedPosition = sequence?.direction === 'backward' ? sequence.lastPosition - sequence.lastCodeUnits : sequence?.lastPosition;
    const continues = activeDelete && sequence && now - sequence.lastAt <= 400
      && sequence.direction === direction && change.start === expectedPosition;
    if (!continues) closeDeletionSequence();
    data = current.current;
    startClock();
    if (!data.events.length) { snapshot('initial', 0); data = current.current; }
    const originalIds = data.characterIds?.length === previous.length ? data.characterIds : previous.split("").map(() => idFor("c"));
    const addedIds = change.added.split("").map(() => idFor("c"));
    const deletedIds = originalIds.slice(change.start, change.start + change.deleted.length);
    const ids = [...originalIds.slice(0, change.start), ...addedIds, ...originalIds.slice(change.start + change.deleted.length)];
    const type = inputType === 'historyUndo' ? 'undo' : inputType === 'historyRedo' ? 'redo'
      : change.deleted ? change.added ? "replace" : "delete" : "insert";
    const point = measureCaret(editor.current, previous, change.start);
    const event = { id: idFor(type), type, timestamp: now, time: elapsed(), position: change.start, deleted: change.deleted, added: change.added, text: nextText, newText: nextText, selectionStart: editor.current?.selectionStart ?? index, selectionEnd: editor.current?.selectionEnd ?? index, tokenIds: ids, addedTokenIds: addedIds, deletedTokenIds: deletedIds, linePosition: point, caretIndex: index, inputType, textStyle: data.textStyle };
    const fragments = (data.fragments || []).map((fragment) => {
      const position=shiftAnchor(fragment.position, change.start, change.deleted.length, change.added.length);
      return { ...fragment, position, anchorPosition: { ...fragment.anchorPosition, index:position } };
    });
    let visualEffect = null;
    let nextEvents = [...data.events, event];
    if (activeDelete) {
      // Every real delete asks the keeper to unpick immediately. The longer
      // deletion sequence below still owns the paper-side visual treatment.
      emitThreadEvent(THREAD_ACTIONS.delete, { ...event, deleted: change.deleted });
      const currentSequence = continues ? sequence : {
        id: idFor('delete-sequence'), direction, text: '', tokenIds: [], rawEventIds: [], count: 0,
        position: change.start, linePosition: point, startedAt: now, triggered: false, visualEventId: null,
      };
      currentSequence.text = direction === 'backward' ? change.deleted + currentSequence.text : currentSequence.text + change.deleted;
      currentSequence.tokenIds = direction === 'backward' ? [...deletedIds, ...currentSequence.tokenIds] : [...currentSequence.tokenIds, ...deletedIds];
      currentSequence.rawEventIds.push(event.id);
      currentSequence.count += graphemeCount(change.deleted);
      currentSequence.lastAt = now;
      currentSequence.lastPosition = change.start;
      currentSequence.lastCodeUnits = change.deleted.length;
      currentSequence.caretIndex = index;
      currentSequence.position = Math.min(currentSequence.position, change.start);
      const crossedThreshold = !currentSequence.triggered && currentSequence.count >= 3;
      if (crossedThreshold) {
        currentSequence.triggered = true;
        currentSequence.visualEventId = idFor('delete-sequence-visual');
        const visualEvent = {
          id: currentSequence.visualEventId, type: 'deleteSequence', mode: 'backside',
          timestamp: now, time: event.time, duration: 1250, position: currentSequence.position,
          deleted: currentSequence.text, sequenceText: currentSequence.text, text: nextText, newText: nextText,
          characterCount: currentSequence.count, rawEventIds: [...currentSequence.rawEventIds],
          sequenceStartTimestamp: currentSequence.startedAt, linePosition: currentSequence.linePosition,
          tokenIds: ids, deletedTokenIds: [...currentSequence.tokenIds], textStyle: data.textStyle,
        };
        nextEvents = nextEvents.map(item => currentSequence.rawEventIds.includes(item.id)
          ? { ...item, deletionSequenceId: currentSequence.id, deletionVisual: item.id === event.id ? 'backside' : 'unpick' }
          : item);
        nextEvents.push(visualEvent);
        visualEffect = { ...visualEvent, sequenceId: currentSequence.id };
      } else if (currentSequence.triggered) {
        nextEvents = nextEvents.map(item => item.id === currentSequence.visualEventId
          ? { ...item, sequenceText: currentSequence.text, characterCount: currentSequence.count, rawEventIds: [...currentSequence.rawEventIds] }
          : item.id === event.id ? { ...item, deletionSequenceId: currentSequence.id } : item);
        visualEffect = { id: currentSequence.id, sequenceId: currentSequence.id, type: 'deleteSequence', mode: 'backside', deleted: currentSequence.text, position: currentSequence.position, linePosition: currentSequence.linePosition, duration: 1250, continuing: true };
      } else {
        nextEvents = nextEvents.map(item => item.id === event.id
          ? { ...item, deletionSequenceId: currentSequence.id, deletionVisual: 'unpick' } : item);
        visualEffect = { id: event.id, type: 'delete', mode: 'unpick', deleted: change.deleted, position: change.start, linePosition: point, duration: 190 };
      }
      if (currentSequence.triggered) {
        const fragmentId = `fragment-${currentSequence.id}`;
        const existingIndex = fragments.findIndex(fragment => fragment.id === fragmentId);
        const fragment = {
          id: fragmentId, eventId: event.id, eventIds: [...currentSequence.rawEventIds],
          content: currentSequence.text, tokenIds: [...currentSequence.tokenIds],
          originalRange: [currentSequence.position, currentSequence.position + currentSequence.text.length],
          position: currentSequence.position, timestamp: currentSequence.startedAt,
          linePosition: currentSequence.linePosition,
          backsidePosition: { x: 10 + (fragments.length % 3) * 23, y: 12 + Math.floor(fragments.length / 3) * 16 },
          cut: false, threadId: `thread-${currentSequence.id}`, paragraphId: currentSequence.linePosition.paragraphId,
          anchorPosition: { index: currentSequence.position, line: currentSequence.linePosition.line }, isPermanentHidden: false,
        };
        if (existingIndex >= 0) fragments[existingIndex] = fragment; else fragments.push(fragment);
      }
      sequence = currentSequence;
      deletionSequence.current = currentSequence;
      clearTimeout(deletionTimer.current);
      deletionTimer.current = setTimeout(closeDeletionSequence, 400);
      setGhost(visualEffect ? { ...visualEffect, id: visualEffect.id } : null);
    } else {
      deletionSequence.current = null;
      clearTimeout(deletionTimer.current);
      setGhost(null);
      emitThreadEvent(THREAD_ACTIONS.typing, event);
    }
    redoHistory.current = [];
    history.current.push(previousOverride === undefined ? data : { ...data, finalText: previous });
    if (history.current.length > 40) history.current.shift();
    activePause.current = null;
    lastInput.current = performance.now();
    focused.current = true;
    setActivity("following");
    commit({ ...data, finalText: nextText, recordedWritingDuration: elapsed(), characterIds: ids, startedAt: data.startedAt || now, fragments, knots: (data.knots || []).map((item) => ({ ...item, position: shiftAnchor(item.position, change.start, change.deleted.length, change.added.length) })), events: nextEvents });
    track(index, nextText);
    return { ...event, visualEffect, graphemeCount: graphemeCount(change.added) };
  }

  function change(event, inputType = event.nativeEvent?.inputType || '') {
    if (composition.current !== null) { commit({ ...current.current, finalText: event.target.value }); track(event.target.selectionStart, event.target.value); return null; }
    return record(event.target.value, event.target.selectionStart, undefined, inputType);
  }
  function undo() {
    suspend();
    const previous = history.current.pop();
    if (!previous) return;
    redoHistory.current.push(current.current);
    const currentEvents = current.current.events;
    const previousIds = new Set(previous.events.map((event) => event.id));
    commit({ ...previous, recordedWritingDuration: elapsed(), events: [...currentEvents.map((event) => previousIds.has(event.id) ? event : { ...event, cancelled: true }), { id: idFor("undo"), type: "undo", timestamp: Date.now(), time: elapsed(), text: previous.finalText, newText: previous.finalText, selectionStart: editor.current?.selectionStart ?? 0, selectionEnd: editor.current?.selectionEnd ?? 0, tokenIds: previous.characterIds }] });
    setGhost(null);
  }
  function redo() {
    suspend();
    const next = redoHistory.current.pop();
    if (!next) return;
    history.current.push(current.current);
    const nextEvents = new Map(next.events.map(event => [event.id, event]));
    const currentEvents = current.current.events.map(event => nextEvents.has(event.id)
      ? nextEvents.get(event.id)
      : { ...event, cancelled: true });
    commit({ ...next, recordedWritingDuration: elapsed(), events: [...currentEvents, {
      id: idFor('redo'), type: 'redo', timestamp: Date.now(), time: elapsed(),
      text: next.finalText, newText: next.finalText, selectionStart: editor.current?.selectionStart ?? 0,
      selectionEnd: editor.current?.selectionEnd ?? 0, tokenIds: next.characterIds,
    }] });
    setGhost(null);
  }
  function cut(id) { suspend(); history.current = []; setGhost(null); commit(hideFragment(current.current, id)); }

  return { caret, activity, ghost, change, track, undo, redo, cut, suspend, elapsed, canUndo: history.current.length > 0, canRedo: redoHistory.current.length > 0,
    focus: () => { focused.current = true; if (current.current.events.length) { startClock(); snapshot('resume'); } track(); },
    compositionStart: () => { suspend(); composition.current = current.current.finalText; },
    compositionEnd: (event) => { const previous = composition.current; composition.current = null; return record(event.currentTarget.value, event.currentTarget.selectionStart, previous, event.nativeEvent?.inputType || 'insertCompositionText'); },
  };
}
