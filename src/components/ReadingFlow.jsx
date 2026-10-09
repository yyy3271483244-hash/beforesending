import { useI18n } from "../i18n/Language";import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CabinetRoom, EnvelopeImage, RoomHeader, archiveEntries } from './ArchiveRooms';
import { LivingReading } from './LivingLetter';
import { PostOfficeChoices } from './PostOfficeChoices';
import '../reading-flow.css';

gsap.registerPlugin(ScrollTrigger);
export function ReadingFlow({ go, initialId, initialReading = false, stitches = {}, arrival }) {const { t, locale } = useI18n();
  const root = useRef(null),scroll = useRef(null),journey = useRef(null),initial = useRef(true),advance = useRef(false);
  const [entry, setEntry] = useState(() => archiveEntries.find((item) => item.id === initialId) || null);
  const [phase, setPhase] = useState(initialReading ? 'reading' : 'archive');
  const [lifted, setLifted] = useState(initialReading);
  const selected = entry ? { ...entry, stitch: stitches[entry.id] || [] } : null;
  const quiet = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function toScene(units, instant = false) {
    journey.current?.kill();
    const top = root.current.getBoundingClientRect().top + scrollY + innerHeight * units;
    root.current.dataset.targetScene = String(units);
    if (instant) {window.scrollTo({ top, behavior: 'instant' });return;}
    const value = { y: window.scrollY };
    journey.current = gsap.to(value, { y: top, duration: quiet() ? .16 : units > 2 ? 2.1 : .95, ease: 'power2.inOut', onUpdate: () => window.scrollTo({ top: value.y, behavior: 'instant' }) });
  }
  useLayoutEffect(() => {
    const element = root.current,viewport = element.querySelector('.reading-flow-viewport');
    const scene = element.querySelector('.reading-flow-cabinet'),choice = element.querySelector('.reading-action-scene');
    const paper = element.querySelector('.is-flow-reading .living-paper');
    const envelope = element.querySelector('.reading-flow-envelope');
    let current = phase;
    const viewportWidth = () => viewport.clientWidth,viewportHeight = () => viewport.clientHeight;
    function origin() {
      const source = element.querySelector(`[data-letter-id="${entry?.id}"] .drawer-mail-object`);
      if (!source) return { x: 0, y: 0, width: 140, height: 100 };
      const r = source.getBoundingClientRect(),v = viewport.getBoundingClientRect();
      return { x: r.left + r.width / 2 - v.left - viewportWidth() / 2, y: r.top + r.height / 2 - v.top - viewportHeight() / 2, width: r.width, height: r.height };
    }
    const animation = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: 'sine.inOut' }, scrollTrigger: {
          trigger: element, start: 'top top', end: () => `+=${viewportHeight() * (entry ? 3.2 : 1.2)}`, scrub: true, invalidateOnRefresh: true,
          onUpdate: (self) => {
            const units = (self.scroll() - self.start) / viewportHeight();
            element.dataset.sceneProgress = units.toFixed(4);
            const next = units < .8 ? 'actionChoice' : units < 1.52 ? 'archive' : units < 2.96 ? 'openingLetter' : 'reading';
            if (next !== current) {current = next;setPhase(next);}
            setLifted(Boolean(entry) && units > 1.505);
          }
        } });
      scroll.current = timeline.scrollTrigger;
      timeline.fromTo(choice, { autoAlpha: 1, y: 0, scale: 1 }, { autoAlpha: 0, y: quiet() ? 0 : -20, scale: quiet() ? 1 : 1.035, duration: .85 }, 0).
      fromTo(scene, { autoAlpha: 0, scale: quiet() ? 1 : 1.035 }, { autoAlpha: 1, scale: 1, duration: .8 }, .2);
      if (entry && paper && envelope) {
        gsap.set([paper, envelope], { xPercent: -50, yPercent: -50, transformOrigin: '50% 50%' });
        const centerWidth = () => Math.min(410, viewportWidth() * .72);
        timeline.fromTo(envelope, { x: () => origin().x, y: () => origin().y, scaleX: () => origin().width / envelope.offsetWidth, scaleY: () => origin().height / envelope.offsetHeight, autoAlpha: 0 },
        { autoAlpha: 1, duration: .005 }, 1.5).
        to(envelope, { x: 0, y: 40, scaleX: () => centerWidth() / envelope.offsetWidth, scaleY: () => centerWidth() / envelope.offsetWidth, duration: .62 }, 1.505).
        fromTo(element.querySelector('.reading-flow-flap'), { rotateX: 0 }, { rotateX: quiet() ? 0 : -173, duration: .3 }, 2.1).
        to(envelope, { y: 120, autoAlpha: 0, duration: .35 }, 2.62);
        timeline.fromTo(paper, { x: 0, y: 55, scaleX: () => centerWidth() * .84 / paper.offsetWidth, scaleY: () => centerWidth() * .45 / paper.offsetHeight, autoAlpha: 0 },
        { autoAlpha: 1, duration: .08 }, 2.25).
        to(paper, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: .64 }, 2.3).
        fromTo(element.querySelector('.is-flow-reading .reading-text-area'), { opacity: 0 }, { opacity: 1, duration: .18 }, 2.78).
        fromTo(element.querySelector('.is-flow-reading .reading-recipient'), { opacity: 0 }, { opacity: 1, duration: .18 }, 2.78).
        to(scene, { opacity: .24, duration: .8 }, 2.05).
        to({}, { duration: .25 }, 2.95);
      } else timeline.to({}, { duration: .2 }, 1);
      const resize = new ResizeObserver(() => ScrollTrigger.refresh());resize.observe(viewport);
      let arrivalFrame;
      const frame = requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        arrivalFrame = requestAnimationFrame(() => {
          timeline.scrollTrigger.refresh();
          if (initial.current) {initial.current = false;toScene(initialReading ? 3.2 : 1.2, true);} else
          if (advance.current) {advance.current = false;toScene(3.2);}
        });
      });
      return () => {cancelAnimationFrame(frame);cancelAnimationFrame(arrivalFrame);resize.disconnect();timeline.scrollTrigger?.kill();timeline.kill();};
    }, root);
    const cancel = () => journey.current?.kill();
    // A click may carry the object forward; any manual scroll takes control immediately.
    window.addEventListener('wheel', cancel, { passive: true });window.addEventListener('touchstart', cancel, { passive: true });window.addEventListener('keydown', cancel);
    return () => {animation.revert();journey.current?.kill();window.removeEventListener('wheel', cancel);window.removeEventListener('touchstart', cancel);window.removeEventListener('keydown', cancel);};
  }, [entry?.id]);
  function take(letter) {
    if (entry?.id === letter.id) {toScene(3.2);return;}
    advance.current = true;setEntry(letter);
  }
  function navigate(page, id, arrival) {if (page === 'bureau') {toScene(1.2);return;}go(page, id, arrival);}
  return <main className={`reading-scroll-flow${entry ? ' has-selected-letter' : ''}`} ref={root} data-phase={phase} data-selected-letter={entry?.id || ''}>
    <div className="reading-flow-viewport">
      {arrival === 'paper-read' && <ArchiveArrival />}
      <div className="reading-flow-header" hidden={phase === 'actionChoice'}><RoomHeader title={phase === 'reading' ? t("读信台") : t("匿名信件处")} go={navigate} current="bureau" /></div>
      <div className="reading-action-scene" inert={phase !== 'actionChoice' ? true : undefined}>
        <img className="reading-choice-backdrop" src="/assets/administrators/post-office-facade.png" alt="" />
        <PostOfficeChoices initialState="actionChoice" active={phase === 'actionChoice'} go={(page, id, arrival) => page === 'bureau' ? toScene(1.2) : go(page, id, arrival)} />
      </div>
      <div className="reading-flow-cabinet" inert={phase !== 'archive' ? true : undefined}>
        <CabinetRoom embedded go={go} selectedId={entry?.id} onTakeLetter={take} takingId={lifted ? entry?.id : undefined} locked={lifted} onCancelTake={() => toScene(1.2)} />
      </div>
      {selected && <>
        <div className="reading-flow-envelope" data-letter-id={entry.id} aria-hidden="true">
          <div className="reading-envelope-lining" />
          <EnvelopeImage kind={entry.envelopeKind} className="reading-flow-envelope-body" />
          <EnvelopeImage kind={entry.envelopeKind} className="reading-flow-flap" />
        </div>
        <div className="reading-flow-letter" inert={phase !== 'reading' ? true : undefined}>
          <LivingReading key={entry.id} embedded letter={selected} sourceId={entry.id} go={navigate} />
        </div>
      </>}
    </div>
  </main>;
}

function ArchiveArrival() {
  const root = useRef(null);
  useLayoutEffect(() => {
    const motion = gsap.to(root.current, { autoAlpha: 0, delay: .7, duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : .7 });
    return () => motion.kill();
  }, []);
  return <div ref={root} className="archive-paper-arrival" aria-hidden="true" />;
}
