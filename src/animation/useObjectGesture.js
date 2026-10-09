import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function useObjectGesture(object, target, enabled, complete) {
  const drag = useRef(null), moved = useRef(false);
  const latest = useRef({ enabled, complete }); latest.current = { enabled, complete };
  useEffect(() => () => gsap.killTweensOf(object.current), []);
  function cancel() {
    drag.current = null;
    gsap.to(object.current, { x: 0, y: 0, duration: .3, ease: 'power2.out' });
  }
  return {
    onPointerDown(event) {
      if (!latest.current.enabled || event.button !== 0) return;
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      moved.current = false;
      drag.current = { x: event.clientX, y: event.clientY };
      gsap.killTweensOf(object.current);
    },
    onPointerMove(event) {
      if (!drag.current) return;
      const x = event.clientX - drag.current.x, y = event.clientY - drag.current.y;
      if (Math.hypot(x, y) > 6) moved.current = true;
      if (moved.current) gsap.set(object.current, { x, y });
    },
    onPointerUp(event) {
      if (!drag.current) return;
      drag.current = null;
      if (!moved.current) return;
      const bounds = target.current.getBoundingClientRect();
      if (event.clientX >= bounds.left - 24 && event.clientX <= bounds.right + 24 && event.clientY >= bounds.top - 24 && event.clientY <= bounds.bottom + 24) latest.current.complete();
      else cancel();
    },
    onPointerCancel: cancel,
    onClick() {
      if (moved.current) { moved.current = false; return; }
      if (latest.current.enabled) latest.current.complete();
    },
  };
}
