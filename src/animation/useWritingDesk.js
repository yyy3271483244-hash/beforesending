import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
export const writingPhases = { desk: 0, write: .22, replay: .39, prepare: .65, drop: .98 };
const phaseAt = p => p < .16 ? 'desk' : p < .32 ? 'write' : p < .50 ? 'replay' : p < .74 ? 'prepare' : p < .87 ? 'packing' : p < .91 ? 'stamping' : 'drop';

export function useWritingDesk(root, paper, initialStage) {
  const [phase, setPhase] = useState('desk');
  const controls = useRef({});
  useLayoutEffect(() => {
    const media = gsap.matchMedia();
    media.add({ reduced: '(prefers-reduced-motion: reduce)', regular: '(prefers-reduced-motion: no-preference)' }, ({ conditions }) => {
      const reduced = conditions.reduced;
      const element = root.current, viewport = element.querySelector('.desk-viewport');
      const select = selector => element.querySelector(selector);
      const w = () => viewport.clientWidth, h = () => viewport.clientHeight;
      const small = () => w() <= 700;
      const envelopeX = () => small() ? 0 : w() * .17;
      const envelopeY = () => -h() * (small() ? .12 : .06);
      const rest = () => {
        const cover = Math.max(w() / 1376, h() / 880);
        return { x: w() * .025, y: h() * .04, scaleX: Math.min(.86, 610 * cover / paper.current.offsetWidth), scaleY: Math.min(.48, 226 * cover / paper.current.offsetHeight) };
      };
      let current = 'desk';
      let timeline;
      let controlled = false, action = null;
      function takeControl() {
        if (controlled) return;
        controlled = true;
        timeline.scrollTrigger.getTween()?.pause();
        timeline.scrollTrigger.disable(false);
        timeline.pause();
        element.style.height = '100svh';
        window.scrollTo({ top: element.offsetTop, behavior: 'instant' });
      }
      function update(self) {
        if (!timeline || !self) return;
        const progress = timeline.progress();
        if (!controlled && progress >= .65) {
          takeControl();
          timeline.progress(.65);
          return;
        }
        const next = phaseAt(progress);
        // Focusing a low paper corner must not scroll the story into replay.
        if (current === 'write' && next !== 'write' && paper.current.contains(document.activeElement)) {
          self.scroll(self.start + (self.end - self.start) * writingPhases.write);
          return;
        }
        element.dataset.scrollProgress = progress.toFixed(4);
        element.dataset.introProgress = Math.min(1, progress / .16).toFixed(4);
        if (next !== current) { current = next; setPhase(next); }
      }
      function leavePaper(event) {
        if (!paper.current.contains(event.target) && paper.current.contains(document.activeElement)) document.activeElement.blur();
      }
      viewport.addEventListener('wheel', leavePaper, { passive: true });
      viewport.addEventListener('touchstart', leavePaper, { passive: true });
      timeline = gsap.timeline({ defaults: { ease: 'sine.inOut' }, onUpdate: () => update(timeline?.scrollTrigger), scrollTrigger: {
        trigger: element, start: 'top top', end: 'bottom bottom', scrub: reduced ? true : .28,
        invalidateOnRefresh: true, onRefresh: update,
      }});
      gsap.set(paper.current, { xPercent: -50, yPercent: -50, transformOrigin: '50% 50%' });
      timeline.fromTo(paper.current, {
        x: () => reduced ? 0 : rest().x, y: () => reduced ? 0 : rest().y,
        scaleX: () => reduced ? 1 : rest().scaleX, scaleY: () => reduced ? 1 : rest().scaleY,
        rotation: reduced ? 0 : -1.5, skewX: reduced ? 0 : -7,
      }, { y: () => reduced ? 0 : rest().y - 18, duration: 4 }, 0)
        .to(paper.current, { x: 0, y: reduced ? 0 : -10, scaleX: .98, scaleY: .96, rotation: 0, skewX: 0, duration: 8 }, 4)
        .to(paper.current, { y: 0, scaleX: 1, scaleY: 1, duration: 4 }, 12)
        .to(paper.current, { x: () => -w() * (small() ? .31 : .23), y: () => -h() * .12, scaleX: () => small() ? .3 : .4, scaleY: () => small() ? .3 : .4, rotation: reduced ? 0 : -5, duration: 7 }, 50)
        .to(paper.current, { x: envelopeX, y: () => envelopeY() - h() * .14, rotation: 0, scaleX: () => small() ? .54 : .38, scaleY: () => small() ? .54 : .38, duration: 5 }, 74)
        .to(paper.current, { y: envelopeY, duration: 5 }, 79)
        .to(paper.current, { autoAlpha: 0, duration: 1 }, 83);
      timeline.fromTo(select('.desk-scene'), { opacity: 1 }, { opacity: .82, duration: 16 }, 0)
        .to(select('.desk-scene'), { opacity: .55, duration: 7 }, 50)
        .to(select('.desk-scene'), { opacity: 0, duration: 8 }, 87);
      timeline.fromTo(select('.desk-writing-shade'), { opacity: 0 }, { opacity: .66, duration: 12 }, 4)
        .to(select('.desk-writing-shade'), { opacity: 0, duration: 7 }, 50);
      timeline.fromTo(paper.current, { '--paper-extension': '0px' }, {
        '--paper-extension': () => `${Math.max(0, (h() - paper.current.offsetHeight) / 2 - 8)}px`,
        duration: 12,
      }, 4).to(paper.current, { '--paper-extension': '0px', duration: 7 }, 50);
      timeline.fromTo(paper.current, { '--sheet-min-height': () => `${paper.current.offsetHeight}px` }, {
        '--sheet-min-height': () => `${h() + 80}px`, duration: 12,
      }, 4).to(paper.current, { '--sheet-min-height': () => `${paper.current.offsetHeight}px`, duration: 7 }, 50);
      timeline.fromTo(element.querySelectorAll('.living-to,.letter-editing-area'),
        { opacity: 0 }, { opacity: 1, duration: 5 }, 11);
      timeline.fromTo(paper.current, { '--paper-shadow': .08 }, { '--paper-shadow': .17, duration: 16 }, 0);
      // Fold over the original sheet, then slide it behind the envelope front.
      timeline.fromTo(select('.flow-fold-top'), { rotateX: 0, autoAlpha: 0 }, { autoAlpha: 1, rotateX: reduced ? 0 : -174, duration: 3 }, 74)
        .fromTo(select('.flow-fold-bottom'), { rotateX: 0, autoAlpha: 0 }, { autoAlpha: 1, rotateX: reduced ? 0 : 174, duration: 3 }, 76)
        .fromTo(select('.flow-paper-content'), { clipPath: 'inset(0% 0%)' }, { clipPath: 'inset(33% 0%)', duration: 5 }, 74);
      const envelope = element.querySelectorAll('.flow-envelope-placement');
      gsap.set(envelope, { xPercent: -50, yPercent: -50 });
      timeline.fromTo(envelope, { x: envelopeX, y: () => envelopeY() + 30, autoAlpha: 0 }, { x: envelopeX, y: envelopeY, autoAlpha: 1, duration: 6 }, 51)
        .to(envelope, { x: () => -w() * .24, y: () => small() ? h() * .18 : h() * .05, scale: () => small() ? .72 : .84, rotation: reduced ? 0 : -6, duration: 8 }, 87);
      timeline.fromTo(select('.flow-envelope-flap'), { rotateX: -164, autoAlpha: 0 }, { autoAlpha: 1, duration: .01 }, 84)
        .to(select('.flow-envelope-flap'), { rotateX: 0, duration: 3 }, 84)
        .fromTo(select('.flow-envelope-back-flap'), { rotateX: -164, autoAlpha: 1 }, { autoAlpha: 0, duration: .01 }, 84)
        .to(select('.flow-envelope-back'), { autoAlpha: 0, duration: .01 }, 87);
      gsap.set(select('.flow-postage'), { autoAlpha: 0 });
      timeline.fromTo(select('.drop-scene'), { autoAlpha: 0, scale: reduced ? 1 : 1.04 }, { autoAlpha: .46, scale: 1, duration: 8 }, 87)
        .fromTo(select('.flow-mailbox'), { autoAlpha: 0, y: reduced ? 0 : 25 }, { autoAlpha: 1, y: 0, duration: 5 }, 91);
      timeline.to({}, { duration: 4 }, 96);
      controls.current = {
        seal() {
          if (action?.isActive()) return;
          takeControl();
          current = 'packing'; setPhase('packing');
          // The same sheet and envelope now follow a timed gesture, not scroll.
          timeline.progress(Math.max(.74, timeline.progress()));
          action = timeline.tweenTo(87, { duration: reduced ? .01 : 1.9, ease: 'sine.inOut',
            onComplete: () => { current = 'stamping'; setPhase('stamping'); } });
        },
        stamped() {
          if (action?.isActive()) return;
          action = timeline.tweenTo(98, { duration: reduced ? .01 : 1.1, ease: 'sine.inOut',
            onComplete: () => { current = 'drop'; setPhase('drop'); } });
        },
      };
      const observer = new ResizeObserver(() => ScrollTrigger.refresh());
      observer.observe(viewport);
      const frame = requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        if (initialStage && writingPhases[initialStage] != null) {
          const st = timeline.scrollTrigger;
          window.scrollTo({ top: st.start + (st.end - st.start) * writingPhases[initialStage], behavior: 'instant' });
        }
      });
      return () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        action?.kill();
        controls.current = {};
        element.style.removeProperty('height');
        viewport.removeEventListener('wheel', leavePaper);
        viewport.removeEventListener('touchstart', leavePaper);
        timeline.scrollTrigger?.kill();
        timeline.kill();
      };
    });
    return () => media.revert();
  }, []);
  return { phase, ready: phase === 'write', seal: () => controls.current.seal?.(), stamped: () => controls.current.stamped?.() };
}
