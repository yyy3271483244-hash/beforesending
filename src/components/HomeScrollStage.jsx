import { useI18n } from "../i18n/Language";import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { AdministratorCharacter, administrators, useAdministrator } from './AdministratorSystem';
import { WelcomeLetter } from './WelcomeLetter';
import { CompanionChoice } from './CompanionChoice';
import { FoldedLetterChoices } from './FoldedLetterChoices';
import '../home-scroll-stage.css';
import '../post-office-entrance.css';
import '../entrance-interactions.css';

export const ENTRANCE_SEEN = 'before-sending-entrance-seen-v1';
export function hasSeenEntrance() {
  try {return localStorage.getItem(ENTRANCE_SEEN) === 'yes';} catch {return false;}
}

export function HomeScrollStage({ go, initialAct = 'outside' }) {const { t, locale } = useI18n();
  const [act, setAct] = useState(initialAct);
  const [nearDoor, setNearDoor] = useState(false);
  const [choice, setChoice] = useState(null),[departing, setDeparting] = useState(null);
  const [response, setResponse] = useState('');
  const root = useRef(null),scene = useRef(null),exterior = useRef(null);
  const focusTarget = useRef(null);
  const transition = useRef(null),busy = useRef(false);
  const { select, selectedAdministrator } = useAdministrator();
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  useLayoutEffect(() => {
    if (act !== 'outside') return;
    let frame;
    function update() {
      const length = Math.max(1, root.current.offsetHeight - innerHeight);
      const progress = Math.min(1, Math.max(0, (scrollY - root.current.offsetTop) / length));
      exterior.current.style.transform = `scale(${reduced() ? 1 : 1 + progress * .12})`;
      root.current.dataset.approach = progress.toFixed(3);
      setNearDoor(progress >= .94);
    }
    const scroll = () => {cancelAnimationFrame(frame);frame = requestAnimationFrame(update);};
    addEventListener('scroll', scroll, { passive: true });
    addEventListener('resize', scroll);
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    media.addEventListener('change', scroll);
    update();
    return () => {cancelAnimationFrame(frame);removeEventListener('scroll', scroll);removeEventListener('resize', scroll);media.removeEventListener('change', scroll);};
  }, [act]);

  useLayoutEffect(() => {
    if (act === 'outside' || act === 'letter') return;
    window.scrollTo({ top: 0, behavior: 'instant' });
    focusTarget.current?.focus({ preventScroll: true });
    const target = act === 'companions' ? root.current.querySelector('.entrance-companions') : scene.current;
    const animation = gsap.fromTo(target, { opacity: 0 }, { opacity: 1, duration: reduced() ? 0 : .65, ease: 'sine.out' });
    return () => animation.kill();
  }, [act]);

  useEffect(() => () => transition.current?.kill(), []);

  function approach() {
    window.scrollTo({ top: root.current.offsetTop + root.current.offsetHeight - innerHeight, behavior: reduced() ? 'instant' : 'smooth' });
  }
  function enter() {
    if (!nearDoor || busy.current) return;
    busy.current = true;
    transition.current = gsap.to(exterior.current, { opacity: 0, duration: reduced() ? 0 : .65, ease: 'sine.inOut', onComplete: () => {busy.current = false;setAct('welcome');} });
  }
  function start(kind = 'write') {
    if (!selectedAdministrator) { setAct('companions'); return; }
    try {localStorage.setItem(ENTRANCE_SEEN, 'yes');} catch {}
    go(kind === 'read' ? 'bureau' : 'write', undefined, `paper-${kind}`);
  }
  return <main className={`post-entrance act-${act}`} ref={root} data-act={act}>
    <div className="entrance-fixed-stage" ref={scene}>
      <header className="entrance-masthead">
        {act !== 'outside' && <span>Before Sending<small>{t("在寄出之前")}</small></span>}
        {act !== 'companions' && <button className="entrance-skip" onClick={() => start()}>{t("跳过入场")}</button>}
      </header>
      {act === 'outside' ? <>
        <div key="exterior" className="entrance-exterior" ref={exterior}>
          <img src="/assets/entrance/post-office-exterior.png" alt={t("藤蔓环绕的小邮局，中央木门前有一条石板路")} draggable="false" />
          <span className="entrance-sign">Before Sending<small>{t("在寄出之前")}</small></span>
          <button className="entrance-door" onClick={enter} disabled={!nearDoor} aria-label={t("推门进去")} />
        </div>
        <div className="entrance-approach" aria-live="polite">
          <button onClick={nearDoor ? enter : approach}>{nearDoor ? t("推门进去") : t("往前走走")}<span aria-hidden="true">{nearDoor ? '→' : '↓'}</span></button>
        </div>
      </> : <>
        <div key="interior" className="entrance-room" aria-hidden="true">
          <img className="entrance-room-art" src="/assets/demo-cutouts/reader-room-bg.jpg" alt="" />
          <img className="entrance-room-postbox" src="/assets/home-stage/mailbox.png" alt="" />
          <AdministratorCharacter id="cat" className="welcome-cat" activity={response === 'companions' ? 'reading' : 'idle'} />
          <AdministratorCharacter id="mouse" className="welcome-mouse" activity={response === 'keeping' ? 'collecting' : 'idle'} />
          <AdministratorCharacter id="rabbit" className="welcome-rabbit" activity={response === 'thread' ? 'thread' : 'packaging'} />
          <AdministratorCharacter id="dog" className="welcome-dog" activity="welcoming" />
        </div>
        {(act === 'welcome' || act === 'letter') && <WelcomeLetter onRead={() => setAct('letter')} onResponse={setResponse} onContinue={() => {setResponse('');setAct('companions');}} />}
        {act === 'companions' && <section className="entrance-companions">
          <h1 ref={focusTarget} tabIndex={-1}>{t("今天，想让谁陪你？")}</h1>
          <div className={`entrance-companion-lineup${choice ? ' has-choice' : ''}`}>
            {['dog', 'cat', 'rabbit', 'mouse'].map((id) => <CompanionChoice key={id} id={id} selected={choice === id} hasChoice={Boolean(choice)} disabled={Boolean(departing)} onSelect={(id) => {select(id);setChoice(id);}} />)}
          </div>
          <div className={`entrance-decisions${choice ? ' is-available' : ''}`} inert={!choice ? true : undefined} aria-hidden={!choice}>
            <h2 className="decision-heading">{t("今天想做什么？")}</h2>
            <FoldedLetterChoices container={root} onDepart={setDeparting} onGo={start} />
          </div>
        </section>}
      </>}
    </div>
  </main>;
}
