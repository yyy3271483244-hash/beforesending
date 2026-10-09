import { useEffect, useMemo, useRef, useState } from 'react';

export function useLetterReplay(letter, active) {
  const events = useMemo(() => letter.events.filter(event => !event.cancelled && event.type !== 'send'), [letter.events]);
  const version = `${events.length}:${events.at(-1)?.id || ''}:${letter.finalText}`;
  const seen = useRef(null);
  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const frame = events[index];
  useEffect(() => {
    if (!active) { setPlaying(false); return; }
    if (seen.current !== version) {
      seen.current = version;
      setIndex(-1);
      setPlaying(events.length > 0);
    }
  }, [active, version]);
  useEffect(() => {
    if (!active || !playing) return;
    if (index >= events.length - 1) { setPlaying(false); return; }
    const next = events[index + 1];
    const duration = frame?.type === 'pause'
      ? Math.min(4200, Math.max(450, frame.duration * .12))
      : Math.min(850, Math.max(70, next.timestamp - (frame?.timestamp || next.timestamp) || 150));
    const timer = setTimeout(() => setIndex(value => value + 1), duration / speed);
    return () => clearTimeout(timer);
  }, [active, playing, index, speed, events, frame]);
  const content = events.length ? frame?.newText ?? '' : letter.finalText;
  const visibleLetter = { ...letter, finalText: content,
    fragments: letter.fragments.filter(item => frame && item.timestamp <= frame.timestamp),
    knots: (letter.knots || []).filter(item => frame && item.timestamp <= frame.timestamp) };
  return { index, setIndex, playing, setPlaying, speed, setSpeed, frame, content, visibleLetter, events,
    restart: () => { setIndex(-1); setPlaying(events.length > 0); } };
}
