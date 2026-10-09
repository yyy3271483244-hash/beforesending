import { useLayoutEffect, useRef } from 'react';

// Move complete scenes; content scrolling never changes the active scene.
export function useVerticalJourney(track, initialIndex, onSectionChange) {
  const initial = useRef(initialIndex), onChange = useRef(onSectionChange);
  const navigate = useRef(null);
  onChange.current = onSectionChange;
  useLayoutEffect(() => {
    const sections = [...track.current.querySelectorAll('[data-chapter-index]')];
    const find = index => sections.find(node => Number(node.dataset.chapterIndex) === index);
    let current = initial.current, moving = false, disposed = false;
    let animations = [];
    const place = (node, visible) => {
      node.dataset.stageVisible = String(visible);
      node.style.transform = visible ? 'translateY(0)' : 'translateY(100%)';
      node.inert = !visible;
    };
    sections.forEach(node => place(node, node === find(current)));
    navigate.current = (index, behavior = 'smooth', onComplete) => {
      const incoming = find(index), outgoing = find(current);
      if (moving || !incoming || incoming.hidden || index === current) { onComplete?.(); return; }
      moving = true;
      track.current.dataset.transitioning = 'true';
      const direction = index > current ? 1 : -1;
      incoming.scrollTop = 0;
      incoming.dataset.stageVisible = 'true';
      incoming.inert = true;
      if (outgoing) outgoing.inert = true;
      const options = { duration: behavior === 'instant' || matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : behavior === 'quick' ? 420 : 900,
        easing: 'cubic-bezier(0.76, 0, 0.24, 1)', fill: 'both' };
      animations = [incoming.animate([{ transform: 'translateY(' + direction * 100 + '%)' }, { transform: 'translateY(0)' }], options)];
      if (outgoing) animations.push(outgoing.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(' + -direction * 100 + '%)' }], options));
      Promise.all(animations.map(animation => animation.finished)).then(() => {
        if (disposed) return;
        current = index;
        sections.forEach(node => place(node, node === incoming));
        animations.forEach(animation => animation.cancel());
        animations = [];
        moving = false;
        track.current.dataset.transitioning = 'false';
        onChange.current(index);
        onComplete?.();
      }).catch(() => {
        if (disposed) return;
        sections.forEach(node => place(node, node === outgoing));
        animations = [];
        moving = false;
        track.current.dataset.transitioning = 'false';
        onComplete?.();
      });
    };
    return () => { disposed = true; animations.forEach(animation => animation.cancel()); navigate.current = null; };
  }, []);
  return (index, behavior = 'smooth', onComplete) => navigate.current?.(index, behavior, onComplete);
}
