import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useI18n } from '../i18n/Language';
import { AdministratorCharacter, administrators, useAdministrator } from './AdministratorSystem';
import { keeperSelectionAssets } from '../data/animalAssets';
import '../home-scroll-stage.css';
import '../pink-envelope-entrances.css';

export function JourneyCompanion({ active, chooseKeeper, write, disabled, read, onBusy, onStageChange }) {
  const { language, t } = useI18n(), en = language === 'en';
  const { selectedAdministrator } = useAdministrator();
  const [stage, setStage] = useState('select');
  const [selectionMotion, setSelectionMotion] = useState({ id: null, token: 0, kind: 'hover' });
  const root = useRef(null), motion = useRef(null), phase = useRef('select'), arrivalMotion = useRef(null);
  const selected = useRef(null);
  const entryMotion = useRef(null), entering = useRef(false);
  const [entry, setEntry] = useState(null);
  const chosen = selectedAdministrator || 'dog';
  const keeperLabels = { mouse: '小鼠', cat: '小猫', rabbit: '小兔', dog: '小狗' };
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pace = value => reduce() ? 0 : value * .5;
  function enterStage(value) { phase.current = value; setStage(value); onStageChange(value); }
  function hover(id) {
    if (disabled || !active || phase.current !== 'select') return;
    setSelectionMotion(value => ({ id, token: value.token + 1, kind: 'hover' }));
  }
  function previewEnvelope(event) {
    const button = event.currentTarget;
    const video = button.querySelector('.entrance-preview-video');
    if (!video || button.dataset.preview === 'playing') return;
    for (const other of root.current.querySelectorAll('.restored-envelope-choices button')) {
      if (other !== button && other.dataset.preview) finishPreview(other);
    }
    clearTimeout(button.previewResetTimer);
    button.dataset.preview = 'playing';
    video.currentTime = 0;
    video.playbackRate = 2;
    video.play().catch(() => { button.dataset.preview = 'returning'; });
  }
  function finishPreview(button) {
    const video = button.querySelector('.entrance-preview-video');
    if (!video || !button.dataset.preview) return;
    button.dataset.preview = 'returning';
    clearTimeout(button.previewResetTimer);
    button.previewResetTimer = setTimeout(() => {
      video.pause();
      video.currentTime = 0;
      delete button.dataset.preview;
      delete button.previewResetTimer;
    }, 260);
  }
  function resetEnvelopePreview(event) {
    const button = event.currentTarget;
    finishPreview(button);
  }
  function finishEnvelopeAnimation(event) {
    finishPreview(event.currentTarget.closest('button'));
  }
  function selectedPosition(node) {
    gsap.set(node, { x: 0, y: 0, scale: 1 });
    const scene = root.current.getBoundingClientRect(), box = node.getBoundingClientRect();
    const portrait = node.querySelector('.keeper-portrait').getBoundingClientRect();
    const scale = innerWidth < 700 ? 1.14 : 1.28;
    return { x: scene.left + scene.width / 2 - box.left - box.width / 2, y: scene.top + scene.height * .64 - portrait.bottom, scale };
  }
  function choose(id) {
    if (disabled || phase.current !== 'select') return;
    arrivalMotion.current?.kill();
    setSelectionMotion(value => ({ id, token: value.token + 1, kind: 'select' }));
    chooseKeeper(id); selected.current = id; enterStage('confirming'); onBusy(true);
    const all = [...root.current.querySelectorAll('.home-animal-choice')];
    const keep = all.find(node => node.dataset.keeper === id), others = all.filter(node => node !== keep);
    const envelopes = root.current.querySelectorAll('.restored-envelope-choices button');
    const destination = selectedPosition(keep);
    motion.current?.kill();
    motion.current = gsap.timeline({ onComplete: () => {
      gsap.set(keep, selectedPosition(keep));
      enterStage('confirmed'); onBusy(false);
    } })
      .to(others, { opacity: 0, y: 8, scale: .97, duration: pace(.75), ease: 'sine.inOut' }, 0)
      .to(root.current.querySelector('.home-post-background'), { opacity: .25, duration: pace(.85) }, 0)
      .to(keep, { ...destination, duration: pace(.85), ease: 'power2.inOut' }, 0)
      .set(others, { visibility: 'hidden' })
      .to(envelopes, { opacity: 1, y: 0, scale: 1, duration: pace(.8), stagger: pace(.14), ease: 'sine.out' }, pace(.8));
  }
  function reset() {
    if (disabled || entering.current || phase.current !== 'confirmed') return;
    onBusy(true); enterStage('resetting');
    const all = root.current.querySelectorAll('.home-animal-choice');
    motion.current?.kill();
    motion.current = gsap.timeline({ onComplete: () => { enterStage('select'); onBusy(false); } })
      .to(root.current.querySelectorAll('.restored-envelope-choices button'), { opacity: 0, y: 12, scale: .97, duration: pace(.35) })
      .set(all, { visibility: 'visible' })
      .to(root.current.querySelector('.home-post-background'), { opacity: .42, duration: pace(.7) }, '<')
      .to(all, { opacity: 1, x: 0, y: 0, scale: 1, duration: pace(.7), ease: 'power2.inOut' });
  }
  function enter(kind, event) {
    if (entering.current || disabled || phase.current !== 'confirmed') return;
    entering.current = true; setEntry(kind);
    if (kind === 'write') onBusy(true);
    const object = event.currentTarget.querySelector('.entrance-object');
    const paper = object.querySelector('.entrance-paper');
    entryMotion.current?.kill();
    entryMotion.current = gsap.timeline({ onComplete: () => {
      (kind === 'read' ? read : write)();
      entering.current = false; setEntry(null);
      if (kind === 'read') onBusy(false);
      gsap.set(object, { clearProps: 'transform' });
      if (paper) gsap.set(paper, { clearProps: 'transform' });
    } });
    entryMotion.current.to(object, { y: -14, rotation: kind === 'read' ? -1 : 1, scale: 1.035, duration: reduce() ? .1 : pace(.65), ease: 'power2.out' }, 0);
    if (paper) entryMotion.current.to(paper, { y: -10, duration: reduce() ? .1 : pace(.45), ease: 'power2.out' }, reduce() ? 0 : pace(.2));
  }
  useLayoutEffect(() => {
    const element = root.current;
    gsap.set(element.querySelectorAll('.restored-envelope-choices button'), { opacity: 0, y: 12, scale: .97 });
    function ground() {
      for (const node of element.querySelectorAll('.home-animal-choice')) {
        const portrait = node.querySelector('.keeper-portrait'), asset = keeperSelectionAssets[node.dataset.keeper];
        const scale = Math.min(portrait.clientWidth / asset.width, portrait.clientHeight / asset.height);
        const [footX, footY] = asset.feet;
        portrait.style.setProperty('--foot-gap', `${(asset.height - footY) * scale}px`);
        portrait.style.setProperty('--foot-left', `${(portrait.clientWidth - asset.width * scale) / 2 + footX * scale}px`);
      }
      if (phase.current === 'confirmed') {
        const keep = element.querySelector(`[data-keeper="${selected.current}"]`);
        gsap.set(keep, selectedPosition(keep));
      }
    }
    ground(); element.addEventListener('load', ground, true); window.addEventListener('resize', ground);
    return () => { motion.current?.kill(); entryMotion.current?.kill(); element.removeEventListener('load', ground, true); window.removeEventListener('resize', ground); };
  }, []);
  const ready = stage === 'confirmed';
  useLayoutEffect(() => {
    if (!active || stage !== 'select' || reduce()) return undefined;
    const heading = root.current.querySelector('.home-selection-heading');
    const arrivals = root.current.querySelectorAll('.keeper-arrival');
    arrivalMotion.current?.kill();
    arrivalMotion.current = gsap.timeline()
      .fromTo(heading, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .62, ease: 'power2.out' })
      .fromTo(arrivals, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: .7, stagger: .11, ease: 'power2.out' }, .12);
    return () => { arrivalMotion.current?.kill(); gsap.set([heading, ...arrivals], { clearProps: 'transform,opacity' }); };
  }, [active, stage]);
  useLayoutEffect(() => {
    if (!active) return;
    if (stage === 'confirmed') root.current.querySelector('.restored-envelope-choices button')?.focus({ preventScroll: true });
    if (stage === 'select' && selected.current) root.current.querySelector(`[data-keeper-target="${selected.current}"]`)?.focus({ preventScroll: true });
  }, [stage]);
  return <div ref={root} className="restored-keeper" data-selected-keeper={selectedAdministrator || ''} data-keeper-stage={stage}>
    <img className="home-post-background" src="/assets/administrators/post-office-facade.png" alt="" draggable={false} />
    <div className="home-selection-heading">
      {(stage === 'select' || stage === 'resetting') && <h2 data-chapter-heading tabIndex={-1}>{en ? 'Who will keep you company?' : '谁陪你写这封信？'}</h2>}
    </div>
    <div className="home-animal-lineup">
      {Object.entries(administrators).map(([id, animal], order) => <div className="home-animal-choice" key={id} data-keeper={id} data-reveal-order={order} aria-hidden={stage !== 'select' && stage !== 'resetting' && chosen !== id ? true : undefined}>
        <div className="keeper-arrival"><button className="administrator-choice" data-keeper-target={id} disabled={disabled || stage !== 'select'} aria-pressed={selectedAdministrator === id}
          onMouseEnter={() => hover(id)} onFocus={() => hover(id)} onClick={() => choose(id)} aria-label={en ? `Choose ${id}` : `选择${keeperLabels[id]}`}>
          <span className="keeper-portrait"><span className="keeper-contact-shadow" aria-hidden="true" /><span className="keeper-idle"><AdministratorCharacter id={id} activity="select" selectionPlayback={{ active: active && (stage === 'select' || chosen === id), request: selectionMotion.id === id ? selectionMotion : null }} /></span></span>
          <span>{en ? t(animal.name) : keeperLabels[id]}</span>
        </button></div>
      </div>)}
    </div>
    <nav className="restored-envelope-choices" inert={!ready ? true : undefined} aria-hidden={!ready} aria-label={en ? 'Read or write a letter' : '读信与写信入口'}>
      <button onClick={event => enter('write', event)} onPointerEnter={previewEnvelope} onPointerLeave={resetEnvelopePreview} data-entering={entry === 'write'} disabled={!active || disabled || !ready || !!entry} aria-label={en ? 'Write a Letter' : '写信'}>
        <span className="entrance-object"><video className="entrance-preview-video entrance-preview-write" src="/assets/entrance-envelopes/write-hover.webm" muted playsInline preload="auto" onEnded={finishEnvelopeAnimation} aria-hidden="true" /><img className="entrance-preview-poster" src="/assets/entrance-envelopes/write-poster.png" alt="" draggable={false} /></span>
        <span>{en ? 'Write' : '写信'}</span>
      </button>
      <button onClick={event => enter('read', event)} onPointerEnter={previewEnvelope} onPointerLeave={resetEnvelopePreview} data-entering={entry === 'read'} disabled={!active || disabled || !ready || !!entry} aria-label={en ? 'Read a Letter' : '读信'}>
        <span className="entrance-object"><video className="entrance-preview-video entrance-preview-read" src="/assets/entrance-envelopes/read-hover.webm" muted playsInline preload="auto" onEnded={finishEnvelopeAnimation} aria-hidden="true" /><img className="entrance-preview-poster" src="/assets/entrance-envelopes/read-poster.png" alt="" draggable={false} /></span>
        <span>{en ? 'Read' : '读信'}</span>
      </button>
    </nav>
    {ready && <button className="keeper-reselect" onClick={reset} disabled={disabled}>{en ? 'Choose another keeper' : '换一位陪伴者'}</button>}
  </div>;
}
