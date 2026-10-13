import { useLayoutEffect } from 'react';
import gsap from 'gsap';

export function useHomeMotion(root, ready) {
  useLayoutEffect(() => {
    const element = root.current;
    const before = element?.querySelector('.home-title-before');
    const sending = element?.querySelector('.home-title-sending');
    const artwork = element?.querySelector('.home-art-video');
    if (!element) return undefined;
    if (!ready) {
      gsap.set([artwork, before, sending], { opacity: 0 });
      return undefined;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set([artwork, before, sending], { opacity: 1 });
      gsap.set([before, sending], { x: 0, clipPath: 'inset(0 0 0 0)' });
      return undefined;
    }
    const entrance = gsap.timeline()
      .fromTo(artwork, { opacity: 0 }, { opacity: 1, duration: .9, ease: 'power2.out' }, 0)
      .fromTo(before, { opacity: 0, x: -24, clipPath: 'inset(0 100% 0 0)' }, { opacity: 1, x: 0, clipPath: 'inset(0 0% 0 0)', duration: .9, ease: 'power2.out' }, 0)
      .fromTo(sending, { opacity: 0, x: 24, clipPath: 'inset(0 0 0 100%)' }, { opacity: 1, x: 0, clipPath: 'inset(0 0 0 0%)', duration: .9, ease: 'power2.out' }, 0);
    return () => entrance.kill();
  }, [root, ready]);
}
