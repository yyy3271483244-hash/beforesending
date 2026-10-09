import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function useMailboxEntry(root, enter) {
  const motion = useRef(null), running = useRef(false);
  useEffect(() => () => motion.current?.kill(), []);
  return () => {
    if (running.current) return;
    running.current = true;
    const slot = root.current.querySelector('.home-mail-slot');
    document.activeElement?.blur();
    // Navigation must not depend on the decorative acknowledgement finishing.
    enter();
    motion.current = gsap.timeline({ onComplete: () => {
      gsap.set(slot, { clearProps: 'opacity' }); running.current = false;
    } }).to(slot, { opacity: .7, duration: .12 })
      .to(slot, { opacity: 1, duration: .2 });
  };
}
