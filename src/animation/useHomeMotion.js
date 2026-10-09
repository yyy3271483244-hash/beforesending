import { useLayoutEffect } from 'react';
import gsap from 'gsap';

export function useHomeMotion(root) {
  useLayoutEffect(() => {
    const element = root.current;
    const before = element?.querySelector('.home-title-before');
    const sending = element?.querySelector('.home-title-sending');
    if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const entrance = gsap.timeline()
      .fromTo(before, { opacity: 0, x: -24, clipPath: 'inset(0 100% 0 0)' }, { opacity: 1, x: 0, clipPath: 'inset(0 0% 0 0)', duration: .9, ease: 'power2.out' }, .18)
      .fromTo(sending, { opacity: 0, x: 24, clipPath: 'inset(0 0 0 100%)' }, { opacity: 1, x: 0, clipPath: 'inset(0 0 0 0%)', duration: .9, ease: 'power2.out' }, .32);
    return () => entrance.kill();
  }, [root]);
}
