import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';

// One sheet stays mounted. Only the repeatable middle grows; its painted edges do not.
export function useDeskPaper(stage, paper, trigger, active, onBusy) {
  const [phase, setPhase] = useState('desk');
  const timeline = useRef(null), locked = useRef(false), phaseRef = useRef('desk');
  const initialized = useRef(false);
  const changePhase = next => { phaseRef.current = next; setPhase(next); };
  const rest = () => ({ x: 0, y: innerHeight * .49 - paper.current.offsetTop - restingHeight() / 2, scale: stage.current.clientWidth <= 700 ? .86 : .74, rotationX: 57, rotationZ: -1 });
  const restingHeight = () => Math.max(innerHeight * .78, paper.current.clientWidth * 782 / 1264);
  function move(open) {
    if (!active || locked.current || (open ? phaseRef.current !== 'desk' : phaseRef.current !== 'write')) return;
    locked.current = true; onBusy(true);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const shade = stage.current.querySelector('.journey-desk-shade');
    const companion = stage.current.querySelector('.desk-resting-companion');
    const details = stage.current.querySelectorAll('[data-writing-detail]');
    document.activeElement?.blur();
    const height = paper.current.offsetHeight;
    const targetHeight = open ? Math.max(restingHeight(), paper.current.querySelector('.journey-paper-content').offsetHeight) : restingHeight();
    gsap.set(paper.current, { height });
    changePhase(open ? 'lifting' : 'returning');
    timeline.current?.kill(); gsap.killTweensOf(paper.current);
    timeline.current = gsap.timeline({ defaults: { ease: 'sine.inOut' }, onComplete: () => {
      locked.current = false; onBusy(false); changePhase(open ? 'write' : 'desk');
      gsap.set(paper.current, { clearProps: 'height' });
      if (!open) {
        requestAnimationFrame(() => { if (!trigger.current?.disabled) trigger.current?.focus({ preventScroll: true }); });
      }
    } });
    if (open) {
      timeline.current.to(paper.current, { y: rest().y - 8, rotationX: 48, duration: reduced ? 0 : .16 }, 0)
        .to(paper.current, { x: 0, y: 0, scale: 1, rotationX: 0, rotationZ: 0, height: targetHeight, duration: reduced ? .01 : .72 }, reduced ? 0 : .16)
        .to(shade, { opacity: .24, duration: reduced ? .01 : .8 }, 0)
        .to(companion, { autoAlpha: 0, duration: reduced ? .01 : .3 }, 0)
        .to(details, { autoAlpha: 1, duration: reduced ? .01 : .16 }, reduced ? 0 : .72);
    } else {
      const section = stage.current.closest('.journey-section');
      const scroll = { y: section.scrollTop };
      timeline.current.to(scroll, { y: 0, duration: reduced ? .01 : .84,
        onUpdate: () => { section.scrollTop = scroll.y; } }, 0)
        .to(details, { autoAlpha: 0, duration: reduced ? .01 : .18 }, 0)
        .to(paper.current, { ...rest(), height: targetHeight, duration: reduced ? .01 : .84 }, 0)
        .to(shade, { opacity: 0, duration: reduced ? .01 : .84 }, 0)
        .to(companion, { autoAlpha: 1, duration: reduced ? .01 : .2 }, reduced ? 0 : .64);
    }
  }
  function hover(inside) {
    if (!active || phaseRef.current !== 'desk' || locked.current) return;
    gsap.to(paper.current, { y: rest().y - (inside ? 4 : 0), duration: .35, ease: 'sine.out', overwrite: true });
  }
  useLayoutEffect(() => {
    // Scrolling away must not turn a raised sheet or replay back into TABLE.
    if (initialized.current) return;
    initialized.current = true;
    timeline.current?.kill(); gsap.killTweensOf(paper.current);
    if (locked.current) onBusy(false);
    locked.current = false; changePhase('desk');
    paper.current.style.setProperty('--paper-rest-height', `${restingHeight()}px`);
    gsap.set(paper.current, { ...rest(), transformOrigin: '50% 50%', transformPerspective: 1800 });
    gsap.set(stage.current.querySelector('.journey-desk-shade'), { opacity: 0 });
    gsap.set(stage.current.querySelector('.desk-resting-companion'), { autoAlpha: 1 });
    gsap.set(stage.current.querySelectorAll('[data-writing-detail]'), { autoAlpha: 0 });
    gsap.set(paper.current, { clearProps: 'height' });
  }, [active]);
  useEffect(() => {
    function resize() {
      paper.current.style.setProperty('--paper-rest-height', `${restingHeight()}px`);
      if (phaseRef.current === 'desk') gsap.set(paper.current, rest());
    }
    // Native scrolling never changes the paper state; only its button opens it.
    window.addEventListener('resize', resize);
    return () => {
      initialized.current = false;
      window.removeEventListener('resize', resize);
      timeline.current?.kill(); gsap.killTweensOf(paper.current);
      if (locked.current) onBusy(false);
    };
  }, []);
  return { phase, hover, open: () => move(true), close: () => move(false) };
}
