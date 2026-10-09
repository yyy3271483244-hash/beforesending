import { useEffect, useMemo, useRef, useState } from 'react';
import { addWatchedRange, buildWritingReplay, hasWatchedReplay, writingReplayAt } from '../trace/writingReplay.mjs';

export function useWritingReplay(letter, active) {
  const timeline = useMemo(() => buildWritingReplay(letter), [letter.events, letter.startedAt, letter.writingFinishedAt, letter.recordedWritingDuration]);
  const [time, setTime] = useState(0), [playing, setPlaying] = useState(false), [speed, setSpeed] = useState(1);
  const [completed, setCompleted] = useState(false), [preparing, setPreparing] = useState(false);
  const clock = useRef(0), position = useRef(0), watched = useRef([]), seeking = useRef(false), wasActive = useRef(false);
  useEffect(() => {
    const pauseWhenHidden = () => { if (document.hidden) setPlaying(false); };
    document.addEventListener('visibilitychange', pauseWhenHidden);
    return () => document.removeEventListener('visibilitychange', pauseWhenHidden);
  }, []);
  useEffect(() => {
    if (!active) { wasActive.current = false; setPlaying(false); return; }
    if (wasActive.current) return;
    wasActive.current = true;
    setPlaying(false);
    setTime(0); position.current = 0; watched.current = []; setCompleted(false); setPreparing(true);
    setPlaying(timeline.duration > 0);
    const fade = setTimeout(() => { setPreparing(false); if (!timeline.duration) setCompleted(true); }, 240);
    return () => clearTimeout(fade);
  }, [active]);
  useEffect(() => {
    if (!active || !playing || preparing) return;
    let raf;
    clock.current = performance.now();
    const tick = now => {
      if (document.hidden) { setPlaying(false); return; }
      if (seeking.current) { clock.current = now; raf = requestAnimationFrame(tick); return; }
      const previous = position.current;
      position.current = Math.min(timeline.duration, position.current + (now - clock.current) * speed);
      watched.current = addWatchedRange(watched.current, previous, position.current);
      clock.current = now; setTime(position.current);
      if (hasWatchedReplay(watched.current, timeline.duration)) setCompleted(true);
      if (position.current >= timeline.duration) setPlaying(false);
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, playing, preparing, speed, timeline.duration]);
  function seek(value) {
    position.current = Math.max(0, Math.min(timeline.duration, value));
    clock.current = performance.now(); setTime(position.current);
  }
  function restart() { seek(0); watched.current = []; setCompleted(timeline.duration === 0); setPlaying(timeline.duration > 0); }
  return { ...writingReplayAt(timeline, time), timeline, playing, preparing, speed, completed, setSpeed, seek, restart,
    beginSeek: () => { seeking.current = true; },
    endSeek: () => { seeking.current = false; clock.current = performance.now(); },
    toggle: () => { if (time >= timeline.duration) restart(); else setPlaying(value => !value); } };
}
