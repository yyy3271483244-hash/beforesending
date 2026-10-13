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
    let animations = [], transitionTimer;
    const place = (node, visible) => {
      node.dataset.stageVisible = String(visible);
      node.style.transform = visible ? 'translateY(0)' : 'translateY(100%)';
      node.inert = !visible;
    };
    sections.forEach(node => place(node, node === find(current)));
    track.current.dataset.transitioning = 'false';
    track.current.dataset.transitionState = `${find(current)?.id?.toUpperCase() || 'PAGE'}_ACTIVE`;
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
      const duration = behavior === 'instant' || matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : behavior === 'quick' ? 680 : 760;
      const transitionDelay = duration ? 80 : 0;
      const options = { duration, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'both' };
      track.current.dataset.transitionState = `${outgoing?.id?.toUpperCase() || 'PAGE'}_EXITING`;
      clearTimeout(transitionTimer);
      transitionTimer = setTimeout(() => {
        if (!disposed) track.current.dataset.transitionState = `${incoming.id.toUpperCase()}_ENTERING`;
      }, transitionDelay);
      animations = [incoming.animate([
        { transform: 'translateY(' + direction * 100 + '%)', opacity: .78 },
        { transform: 'translateY(0)', opacity: 1 },
      ], options)];
      if (outgoing) animations.push(outgoing.animate([
        { transform: 'translateY(0)', opacity: 1 },
        { transform: 'translateY(' + -direction * 100 + '%)', opacity: .82 },
      ], options));
      Promise.all(animations.map(animation => animation.finished)).then(() => {
        if (disposed) return;
        clearTimeout(transitionTimer);
        current = index;
        sections.forEach(node => place(node, node === incoming));
        animations.forEach(animation => animation.cancel());
        animations = [];
        moving = false;
        track.current.dataset.transitioning = 'false';
        track.current.dataset.transitionState = `${incoming.id.toUpperCase()}_ACTIVE`;
        onChange.current(index);
        onComplete?.();
      }).catch(() => {
        if (disposed) return;
        clearTimeout(transitionTimer);
        sections.forEach(node => place(node, node === outgoing));
        animations = [];
        moving = false;
        track.current.dataset.transitioning = 'false';
        track.current.dataset.transitionState = `${outgoing?.id?.toUpperCase() || 'PAGE'}_ACTIVE`;
        onComplete?.();
      });
    };
    return () => { disposed = true; clearTimeout(transitionTimer); animations.forEach(animation => animation.cancel()); navigate.current = null; };
  }, []);
  return (index, behavior = 'smooth', onComplete) => navigate.current?.(index, behavior, onComplete);
}
