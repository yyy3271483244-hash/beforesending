import { useI18n } from "../i18n/Language";import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';

function PaperChoice({ kind, depart, busy }) {const { t, locale } = useI18n();
  const root = useRef(null),paper = useRef(null),hover = useRef(null);
  const title = kind === 'read' ? t("读一封信") : t("写一封信");
  useLayoutEffect(() => {
    const media = gsap.matchMedia();
    media.add({ quiet: '(prefers-reduced-motion: reduce)', regular: '(prefers-reduced-motion: no-preference)' }, ({ conditions }) => {
      hover.current = gsap.timeline({ paused: true, defaults: { duration: conditions.quiet ? 0 : .55, ease: 'power2.out' } }).
      fromTo(paper.current, { clipPath: 'inset(55% 0 0)' }, { clipPath: 'inset(0% 0 0)' }, 0).
      fromTo(root.current.querySelector('.decision-fold'), { rotateX: conditions.quiet ? 0 : -176 }, { rotateX: 0 }, 0).
      fromTo(root.current.querySelector('.decision-paper-details'), { opacity: 0 }, { opacity: 1 }, .12);
      return () => hover.current?.kill();
    });
    return () => media.revert();
  }, []);
  function enter() {if (!busy) hover.current?.play();}
  function leave() {if (!busy) hover.current?.reverse();}
  return <button ref={root} className={`folded-letter-choice choice-${kind}`} aria-label={title} disabled={Boolean(busy)}
  onPointerEnter={enter} onPointerLeave={leave} onFocus={enter} onBlur={leave}
  onClick={() => {hover.current?.pause();depart(kind, paper.current, root.current);}}>
    <span ref={paper} className="decision-paper" aria-hidden="true">
      <span className="decision-fold" />
      <span className="decision-paper-details">
        {kind === 'read' ? <><em>{t("亲爱的……")}</em><i /><i /><i /></> : <><i /><i /><span className="decision-thread" /></>}
      </span>
      <span className="decision-paper-label">{title}<span>→</span></span>
    </span>
  </button>;
}

export function FoldedLetterChoices({ onGo, onDepart, container }) {const { t, locale } = useI18n();
  const [busy, setBusy] = useState(null);
  const flight = useRef(null),locked = useRef(false);
  useLayoutEffect(() => () => flight.current?.kill(), []);
  function depart(kind, paper, button) {
    if (locked.current) return;
    locked.current = true;
    setBusy(kind);
    onDepart(kind);
    const quiet = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const box = paper.getBoundingClientRect();
    const page = container.current;
    const companion = page.querySelector('.entrance-companion[aria-pressed="true"]');
    const others = page.querySelectorAll('.entrance-companion:not([aria-pressed="true"]), .entrance-companions h1, .decision-heading, .entrance-alone');
    const otherPaper = page.querySelector(`.choice-${kind === 'read' ? 'write' : 'read'}`);
    const cover = Math.max(innerWidth / 1376, innerHeight / 880);
    const width = kind === 'write' ? Math.min(610 * cover, (innerWidth - (innerWidth <= 700 ? 28 : 48)) * .86) : Math.min(560, innerWidth - 40);
    const height = kind === 'write' ? Math.min(226 * cover, (innerHeight - 160) * .48) : Math.min(590, innerHeight - 145);
    const left = kind === 'write' ? innerWidth * .525 - width / 2 : (innerWidth - width) / 2;
    const top = kind === 'write' ? innerHeight * .54 - height / 2 : Math.max(82, (innerHeight - height) / 2);
    paper.classList.add('is-departing');
    gsap.set(paper, { position: 'fixed', left: box.left, top: box.top, width: box.width, height: box.height, zIndex: 40 });
    flight.current = gsap.timeline({ defaults: { ease: 'power2.inOut' }, onComplete: () => onGo(kind) }).
    to(paper, { clipPath: 'inset(0% 0 0)', duration: quiet ? .01 : .36 }, 0).
    to(button.querySelector('.decision-fold'), { rotateX: 0, duration: quiet ? .01 : .36 }, 0).
    to(button.querySelector('.decision-paper-details'), { opacity: 1, duration: quiet ? .01 : .3 }, 0).
    to(paper, { left, top, width, height, duration: quiet ? .01 : .85 }, quiet ? 0 : .22).
    to([otherPaper, ...others], { opacity: .08, duration: quiet ? .01 : .5 }, 0).
    to(page.querySelector('.entrance-room'), { opacity: .4, duration: quiet ? .01 : .7 }, 0).
    to(button.querySelectorAll('.decision-paper-label,.decision-paper-details'), { opacity: 0, duration: quiet ? .01 : .35 }, quiet ? 0 : .5);
    if (companion) {
      const r = companion.getBoundingClientRect();
      flight.current.to(companion, { x: quiet ? 0 : Math.max(r.width / 2, left - 50) - (r.left + r.width / 2), y: quiet ? 0 : top + height * .68 - (r.top + r.height / 2), opacity: .7, duration: quiet ? .01 : .85 }, 0);
    }
  }
  return <nav className="folded-letter-choices" aria-label={t("今天想做什么")}>
    <PaperChoice kind="read" depart={depart} busy={busy} />
    <PaperChoice kind="write" depart={depart} busy={busy} />
  </nav>;
}
