import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ArrowLeft, Shuffle, X } from 'lucide-react';
import { useI18n } from '../i18n/Language';
import { categories, postalDrawers, postOfficeAssets } from '../data/postOffice';
import { makeArchiveDrawers } from '../data/archiveDrawers.mjs';
import { archiveStack } from '../data/archiveStack.mjs';
import { SentLetterMemory } from './SentLetterMemory';
import '../archive-cabinet.css';

const drawers = makeArchiveDrawers(postalDrawers);
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
// Cubic bezier (0.22, 1, 0.36, 1), evaluated without another animation plugin.
export function archiveEase(progress) {
  let low = 0, high = 1, t = progress;
  for (let i = 0; i < 12; i++) {
    const x = 3 * (1 - t) ** 2 * t * .22 + 3 * (1 - t) * t * t * .36 + t ** 3;
    if (x < progress) low = t; else high = t;
    t = (low + high) / 2;
  }
  return 1 - (1 - t) ** 3;
}

export function DrawerItem({ drawer, selected, opening, phase, blocked, dimmed, onToggle, onSettled, onRead, onHover, lifted, en }) {
  const root = useRef(null), initialized = useRef(false);
  const callbacks = useRef({ onSettled });
  callbacks.current = { onSettled };
  const letters = useMemo(() => archiveStack(drawer, drawers), [drawer]);
  const ready = selected && ['open', 'hoveringLetter'].includes(phase) && !blocked;
  useLayoutEffect(() => {
    const node = root.current, cards = node.querySelectorAll('.archive-card-arrival');
    if (!cards.length) return;
    if (!initialized.current) {
      initialized.current = true;
      gsap.set(cards, { opacity: 0, y: 16 });
      if (!opening) return;
    }
    const duration = value => reduced() ? 0 : value;
    const motion = gsap.timeline({ onComplete: () => callbacks.current.onSettled(drawer.id, opening) });
    if (opening) {
      motion.to(node, { '--handle-pull': 1, duration: duration(.12) })
        .to(node, { '--drawer-open': 1, duration: duration(.78), ease: archiveEase }, duration(.08))
        .to(node, { '--interior-open': 1, duration: duration(.32) }, duration(.23))
        .to(cards, { opacity: 1, y: 0, duration: duration(.38), stagger: duration(.05), ease: archiveEase }, duration(.38));
    } else {
      motion.to(cards, { opacity: 0, y: 16, duration: duration(.18), stagger: { each: duration(.025), from: 'end' }, ease: 'sine.in' })
        .to(node, { '--drawer-open': 0, '--handle-pull': 0, duration: duration(.52), ease: 'power2.inOut' }, duration(.16))
        .to(node, { '--interior-open': 0, duration: duration(.3) }, duration(.32));
    }
    return () => motion.kill();
  }, [opening, drawer.id]);
  const b = drawer.bounds;
  const crop = { backgroundImage: `url(${postOfficeAssets.bureau})`, backgroundSize: `${10000 / b.width}% ${10000 / b.height}%`, backgroundPosition: `${b.x / (100 - b.width) * 100}% ${b.y / (100 - b.height) * 100}%` };
  return <div ref={root} className={`postal-drawer archive-cell${selected ? ' is-open' : ''}${dimmed ? ' is-dimmed' : ''}`} data-cell={drawer.cell + 1} data-kind={drawer.kind} data-state={selected ? phase : 'closed'} style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.width}%`, height: `${b.height}%` }}>
    <div className="restored-drawer-cavity" aria-hidden="true" />
    <div className="archive-drawer-tray" aria-hidden="true" />
    <div className="archive-file-stack" inert={!ready ? true : undefined} aria-hidden={!ready}>
      {letters.map((letter, slot) => <div className="archive-card-slot" key={letter.id} style={{ '--slot': slot }} data-lifted={lifted === letter.id}>
        <div className="archive-card-arrival">
          <button className="archive-card-target" data-letter-id={letter.id} disabled={!ready} onPointerEnter={() => onHover(letter.id)} onPointerLeave={() => onHover(null)} onFocus={() => onHover(letter.id)} onBlur={() => onHover(null)} onClick={event => onRead(letter, event.currentTarget.querySelector('.archive-card-face'))} aria-label={`${en ? 'Read' : '阅读'} ${String(slot + 1).padStart(2, '0')}: ${letter.recipient}`}>
            <span className="archive-card-face"><img src="/assets/writing-desk/reading-paper.png" alt="" draggable={false} /><small>No. {drawer.number}.{String(slot + 1).padStart(2, '0')}</small></span>
          </button>
        </div>
      </div>)}
    </div>
    <button className="postal-drawer-front" style={crop} disabled={drawer.kind === 'empty' || blocked || (selected && !ready)} onClick={() => onToggle(drawer.id)} aria-expanded={selected} aria-label={`${en ? 'Drawer' : '第'} ${drawer.cell + 1}${en ? '' : ' 格'}`}><span>{drawer.number}</span></button>
  </div>;
}

export function AnonymousBureau({ active, sentLetter }) {
  const { language } = useI18n(), en = language === 'en';
  const [filter, setFilter] = useState('all');
  const [selection, setSelection] = useState({ id: null, phase: 'closed' });
  const [lifted, setLifted] = useState(null), [reading, setReading] = useState(null);
  const root = useRef(null), canvas = useRef(null), panel = useRef(null), animation = useRef(null);
  const state = useRef(selection), queued = useRef(null), origin = useRef(null), readingState = useRef('closed');
  state.current = selection;
  const current = drawers.find(drawer => drawer.id === selection.id);
  const busy = ['opening', 'closing'].includes(selection.phase) || Boolean(reading);
  function change(id, phase) { state.current = { id, phase }; setSelection({ id, phase }); }
  function toggle(id) {
    if (readingState.current !== 'closed' || ['opening', 'closing'].includes(state.current.phase)) return;
    setLifted(null);
    if (state.current.id) {
      queued.current = state.current.id === id ? null : id;
      change(state.current.id, 'closing');
    } else change(id, 'opening');
  }
  function settled(id, isOpen) {
    if (state.current.id !== id) return;
    if (isOpen) change(id, 'open');
    else {
      const next = queued.current; queued.current = null;
      change(next, next ? 'opening' : 'closed');
    }
  }
  function hover(id) {
    if (!['open', 'hoveringLetter'].includes(state.current.phase) || readingState.current !== 'closed') return;
    setLifted(id); change(state.current.id, id ? 'hoveringLetter' : 'open');
  }
  function read(letter, face) {
    if (!['open', 'hoveringLetter'].includes(state.current.phase) || readingState.current !== 'closed') return;
    origin.current = { face, button: face.closest('button') };
    readingState.current = 'extracting';
    change(state.current.id, 'readingLetter'); setReading(letter);
  }
  function originTransform() {
    const from = origin.current.face.getBoundingClientRect(), scene = root.current.getBoundingClientRect();
    const page = panel.current;
    return { x: from.left - scene.left - page.offsetLeft, y: from.top - scene.top - page.offsetTop, scaleX: from.width / page.offsetWidth, scaleY: from.height / page.offsetHeight };
  }
  function closeReading() {
    if (readingState.current !== 'reading') return;
    readingState.current = 'returning';
    panel.current.dataset.state = 'returning';
    const target = originTransform(), duration = reduced() ? 0 : .68;
    animation.current?.kill();
    animation.current = gsap.timeline({ onComplete: () => {
      gsap.set(origin.current.face, { opacity: 1 });
      readingState.current = 'closed'; setReading(null); setLifted(null); change(state.current.id, 'open');
      requestAnimationFrame(() => origin.current?.button.isConnected && origin.current.button.focus({ preventScroll: true }));
    } })
      .to(panel.current.querySelector('.archive-reading-content'), { opacity: 0, duration: reduced() ? 0 : .16 }, 0)
      .to(panel.current, { ...target, duration, ease: archiveEase }, 0)
      .to(canvas.current, { opacity: 1, duration }, 0);
  }
  useLayoutEffect(() => {
    if (!reading) return;
    const page = panel.current, target = originTransform(), duration = value => reduced() ? 0 : value;
    gsap.set(page, { ...target, opacity: 1, transformOrigin: '0 0' });
    gsap.set(origin.current.face, { opacity: 0 });
    gsap.set(page.querySelector('.archive-reading-content'), { opacity: 0 });
    animation.current = gsap.timeline({ onComplete: () => {
      readingState.current = 'reading'; page.dataset.state = 'reading';
      page.querySelector('.bureau-close').focus({ preventScroll: true });
    } })
      .to(page, { y: target.y - 28, duration: duration(.2), ease: 'sine.out' })
      .to(page, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: duration(.65), ease: archiveEase })
      .to(canvas.current, { opacity: .6, duration: duration(.65) }, duration(.2))
      .to(page.querySelector('.archive-reading-content'), { opacity: 1, duration: duration(.3) }, duration(.55));
    return () => animation.current?.kill();
  }, [reading?.id]);
  useEffect(() => {
    if (!active) return;
    const outside = event => {
      if (readingState.current === 'reading' && !event.target.closest('.archive-reading-sheet')) closeReading();
      else if (readingState.current === 'closed' && state.current.id && !event.target.closest('.postal-drawer, .restored-bureau-footer')) toggle(state.current.id);
    };
    const key = event => {
      if (event.key !== 'Escape') return;
      if (readingState.current === 'reading') closeReading();
      else if (readingState.current === 'closed' && state.current.id) toggle(state.current.id);
    };
    root.current.addEventListener('pointerdown', outside); window.addEventListener('keydown', key);
    return () => { root.current?.removeEventListener('pointerdown', outside); window.removeEventListener('keydown', key); };
  }, [active]);
  return <div ref={root} className="post-scene post-bureau restored-bureau archive-cabinet" data-archive-state={selection.phase}>
    <div ref={canvas} className="post-scene-canvas" data-layer="background">
      <img className="post-scene-background" src={postOfficeAssets.bureau} alt={en ? 'Watercolor archive cabinet' : '水彩档案柜'} draggable={false} />
      <div className="drawer-grid" aria-label={en ? 'Letter drawers' : '信件抽屉'}>{drawers.map(drawer => <DrawerItem key={drawer.id} drawer={drawer} selected={selection.id === drawer.id} opening={selection.id === drawer.id && selection.phase !== 'closing'} phase={selection.phase} blocked={busy} dimmed={filter !== 'all' && filter !== drawer.category} onToggle={toggle} onSettled={settled} onRead={read} onHover={hover} lifted={lifted} en={en} />)}</div>
    </div>
    <footer className="restored-bureau-footer">
      {current ? <><span>{en ? `Drawer ${current.cell + 1}` : `第 ${current.cell + 1} 格`}</span><button disabled={busy} onClick={() => toggle(current.id)}>{en ? 'Close drawer' : '合上抽屉'}</button></> : <div className="bureau-filters" role="group" aria-label={en ? 'Letter categories' : '信件分类'}>{categories.map(([id, zh, english]) => <button key={id} aria-pressed={id === filter} onClick={() => setFilter(id)}>{en ? english : zh}</button>)}<button onClick={() => { const available = drawers.filter(drawer => drawer.kind !== 'empty' && (filter === 'all' || drawer.category === filter)); if (available.length) toggle(available[Math.floor(Math.random() * available.length)].id); }}><Shuffle />{en ? 'Random' : '随机'}</button></div>}
    </footer>
    {reading && <article ref={panel} className="archive-reading-sheet" data-state="extracting" data-letter-id={reading.id} data-side={current.bounds.x < 50 ? 'right' : 'left'} aria-label={en ? 'Open letter' : '展开的信'}>
      <img className="archive-reading-texture" src="/assets/writing-desk/reading-paper.png" alt="" draggable={false} />
      <div className="archive-reading-content"><button className="journey-icon bureau-close" onClick={closeReading} aria-label={en ? 'Put the letter back' : '把信放回'} title={en ? 'Put the letter back' : '把信放回'}><X /></button><small>{en ? 'Anonymous / Sample letter' : '不署名 / 馆藏样信'}</small><h2>{reading.recipient}</h2><div className="archive-letter-text">{reading.finalText}</div><button className="journey-link" onClick={closeReading}><ArrowLeft />{en ? 'Back to the drawer' : '放回抽屉'}</button></div>
    </article>}
    {active && sentLetter?.sentAt && <SentLetterMemory letter={sentLetter} />}
  </div>;
}
