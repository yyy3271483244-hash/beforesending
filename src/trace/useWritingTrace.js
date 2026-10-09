import { useCallback, useEffect, useRef, useState } from "react";
import DiffMatchPatch from "diff-match-patch";
import { emitThreadEvent, THREAD_ACTIONS } from "../animation/threadEvents";

const dmp = new DiffMatchPatch();
const PAUSE_THRESHOLD = 5000;
const REVISION_WINDOW = 2800;
const DELETE_SETTLE = 850;

function meaningful(text) {
  return text.replace(/[\s\p{P}\p{S}]/gu, "").length > 1;
}

function describeChange(previousText, nextText) {
  const diffs = dmp.diff_main(previousText, nextText);
  dmp.diff_cleanupSemantic(diffs);
  let position = 0;
  let changePosition = 0;
  let deletedText = "";
  let addedText = "";

  diffs.forEach(([operation, value]) => {
    if (operation === 0) position += value.length;
    if (operation === -1) {
      if (!deletedText && !addedText) changePosition = position;
      deletedText += value;
    }
    if (operation === 1) {
      if (!deletedText && !addedText) changePosition = position;
      addedText += value;
      position += value.length;
    }
  });

  return { deletedText, addedText, position: changePosition, diffs };
}

function createVersion(text, timestamp, previousText = "") {
  const diffs = dmp.diff_main(previousText, text);
  dmp.diff_cleanupSemantic(diffs);
  return { text, timestamp, diffs };
}

export function useWritingTrace(letter, updateLetter) {
  const [text, setText] = useState(letter.finalText || "");
  const [events, setEvents] = useState(letter.writingEvents || []);
  const [versions, setVersions] = useState(letter.versions || []);
  const [deletedFragments, setDeletedFragments] = useState(letter.deletedFragments || []);
  const [isPaused, setIsPaused] = useState(false);
  const [lastGhost, setLastGhost] = useState(null);
  const textRef = useRef(text);
  const eventsRef = useRef(events);
  const versionsRef = useRef(versions);
  const fragmentsRef = useRef(deletedFragments);
  const startedAtRef = useRef(letter.writingStartedAt);
  const lastInputAtRef = useRef(null);
  const pauseTimerRef = useRef(null);
  const deleteTimerRef = useRef(null);
  const pendingDeleteRef = useRef(null);

  const syncLetter = useCallback(
    (extra = {}) => {
      updateLetter({
        finalText: textRef.current,
        writingEvents: eventsRef.current,
        versions: versionsRef.current,
        deletedFragments: fragmentsRef.current,
        writingStartedAt: startedAtRef.current,
        ...extra,
      });
    },
    [updateLetter],
  );

  const appendEvent = useCallback((event) => {
    const next = [...eventsRef.current, event];
    eventsRef.current = next;
    setEvents(next);
  }, []);

  const appendFragment = useCallback((fragment) => {
    if (!meaningful(fragment.text)) return;
    const next = [...fragmentsRef.current, fragment];
    fragmentsRef.current = next;
    setDeletedFragments(next);
  }, []);

  const settleDeletion = useCallback(
    (asRevision = null) => {
      window.clearTimeout(deleteTimerRef.current);
      const pending = pendingDeleteRef.current;
      if (!pending) return;

      if (asRevision && meaningful(pending.text) && meaningful(asRevision.text)) {
        appendEvent({
          type: "revision",
          timestamp: asRevision.timestamp,
          relativeTime: asRevision.timestamp - startedAtRef.current,
          from: pending.text,
          to: asRevision.text,
          position: pending.position,
          previousText: pending.previousText,
          newText: asRevision.newText,
        });
        appendFragment({
          id: `trace-${asRevision.timestamp}`,
          text: pending.text,
          replacedBy: asRevision.text,
          timestamp: asRevision.timestamp,
          position: pending.position,
        });
      } else if (meaningful(pending.text)) {
        appendEvent({
          type: "delete",
          timestamp: pending.lastAt,
          relativeTime: pending.lastAt - startedAtRef.current,
          text: pending.text,
          position: pending.position,
          previousText: pending.previousText,
          newText: pending.newText,
        });
        appendFragment({
          id: `trace-${pending.lastAt}`,
          text: pending.text,
          replacedBy: "",
          timestamp: pending.lastAt,
          position: pending.position,
        });
      }
      pendingDeleteRef.current = null;
    },
    [appendEvent, appendFragment],
  );

  const schedulePause = useCallback(() => {
    window.clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = window.setTimeout(() => {
      setIsPaused(true);
      emitThreadEvent(THREAD_ACTIONS.pause, {
        text: textRef.current,
        position: textRef.current.length,
        duration: PAUSE_THRESHOLD,
      });
    }, PAUSE_THRESHOLD);
  }, []);

  const handleChange = useCallback(
    (event) => {
      const nextText = event.target.value;
      const previousText = textRef.current;
      const now = Date.now();
      const change = describeChange(previousText, nextText);

      if (!startedAtRef.current && nextText.length > 0) {
        startedAtRef.current = now;
        appendEvent({
          type: "start",
          timestamp: now,
          relativeTime: 0,
          previousText: "",
          newText: nextText,
        });
      }

      if (lastInputAtRef.current && now - lastInputAtRef.current >= PAUSE_THRESHOLD) {
        appendEvent({
          type: "pause",
          timestamp: now,
          relativeTime: now - startedAtRef.current,
          duration: now - lastInputAtRef.current,
          position: event.target.selectionStart,
          previousText,
          newText: previousText,
        });
        emitThreadEvent(THREAD_ACTIONS.pause, {
          text: previousText,
          position: event.target.selectionStart,
          duration: now - lastInputAtRef.current,
        });
      }

      const rawEvent = {
        type: "input",
        action: change.deletedText && change.addedText ? "replace" : change.deletedText ? "erase" : "write",
        timestamp: now,
        relativeTime: startedAtRef.current ? now - startedAtRef.current : 0,
        position: change.position,
        deletedText: change.deletedText,
        addedText: change.addedText,
        previousText,
        newText: nextText,
        cursor: event.target.selectionStart,
      };
      appendEvent(rawEvent);

      if (change.deletedText) {
        emitThreadEvent(THREAD_ACTIONS.delete, {
          text: change.deletedText,
          position: change.position,
          previousText,
          newText: nextText,
        });
        const pending = pendingDeleteRef.current;
        pendingDeleteRef.current = pending && now - pending.lastAt <= DELETE_SETTLE
          ? {
              ...pending,
              text: change.position <= pending.position
                ? change.deletedText + pending.text
                : pending.text + change.deletedText,
              position: Math.min(change.position, pending.position),
              lastAt: now,
              newText: nextText,
            }
          : {
              text: change.deletedText,
              position: change.position,
              startedAt: now,
              lastAt: now,
              previousText,
              newText: nextText,
            };
        setLastGhost({ text: change.deletedText, id: now, position: change.position });
        window.clearTimeout(deleteTimerRef.current);
        deleteTimerRef.current = window.setTimeout(() => settleDeletion(), DELETE_SETTLE);
      }

      if (change.addedText && !change.deletedText) {
        emitThreadEvent(THREAD_ACTIONS.typing, {
          text: change.addedText,
          position: change.position,
          previousText,
          newText: nextText,
        });
      }

      if (change.addedText && pendingDeleteRef.current) {
        const pending = pendingDeleteRef.current;
        if (now - pending.lastAt <= REVISION_WINDOW) {
          settleDeletion({ text: change.addedText, timestamp: now, newText: nextText });
        } else {
          settleDeletion();
        }
      }

      if (change.addedText && !change.deletedText) {
        const nextVersions = [...versionsRef.current, createVersion(nextText, now, previousText)].slice(-80);
        versionsRef.current = nextVersions;
        setVersions(nextVersions);
      }

      textRef.current = nextText;
      setText(nextText);
      setIsPaused(false);
      lastInputAtRef.current = now;
      schedulePause();
      window.requestAnimationFrame(() => syncLetter());
      return rawEvent;
    },
    [appendEvent, schedulePause, settleDeletion, syncLetter],
  );

  const finish = useCallback(() => {
    const now = Date.now();
    settleDeletion();
    window.clearTimeout(pauseTimerRef.current);
    setIsPaused(false);
    appendEvent({
      type: "finish",
      timestamp: now,
      relativeTime: startedAtRef.current ? now - startedAtRef.current : 0,
      previousText: textRef.current,
      newText: textRef.current,
    });
    window.requestAnimationFrame(() => syncLetter({ writingEndedAt: now, deliveryStatus: "written" }));
  }, [appendEvent, settleDeletion, syncLetter]);

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    return () => {
      window.clearTimeout(pauseTimerRef.current);
      window.clearTimeout(deleteTimerRef.current);
    };
  }, []);

  return {
    text,
    events,
    versions,
    deletedFragments,
    isPaused,
    lastGhost,
    handleChange,
    finish,
  };
}
