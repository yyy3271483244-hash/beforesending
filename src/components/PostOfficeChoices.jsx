import { useI18n } from "../i18n/Language";import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { AdministratorCharacter, administrators, useAdministrator } from './AdministratorSystem';
import { EnvelopeEntrances } from './EnvelopeEntrances';
import '../post-office-choices.css';

export function PostOfficeRoom({ go, initialState = 'administrator' }) {
  return <main className="post-office-room">
    <img className="post-office-room-background" src="/assets/administrators/post-office-facade.png" alt="" />
    <PostOfficeChoices go={go} initialState={initialState} />
  </main>;
}

export function PostOfficeChoices({ go, initialState = 'administrator', active = true }) {const { t, locale } = useI18n();
  const root = useRef(null),animation = useRef(null);
  const [state, setState] = useState(initialState),[hover, setHover] = useState(null);
  const { selectedAdministrator, select } = useAdministrator();
  const selected = useRef(selectedAdministrator);selected.current = selectedAdministrator;
  const stateRef = useRef(state);stateRef.current = state;
  function arrange(animate) {
    const el = root.current,chosen = el.querySelector(`[data-choice="${selected.current}"]`);
    if (!chosen) return;
    animation.current?.kill();
    gsap.set(el.querySelectorAll('.home-animal-choice'), { x: 0, y: 0, scale: 1 });
    const r = chosen.getBoundingClientRect(),bounds = el.getBoundingClientRect();
    const scale = Math.min(1, bounds.height * .26 / r.height);
    const x = bounds.width / 2 - (r.left - bounds.left + r.width / 2);
    const y = bounds.height * .45 - (r.top - bounds.top + r.height / 2);
    const others = [...el.querySelectorAll('.home-animal-choice')].filter((node) => node !== chosen);
    const quiet = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = animate && !quiet ? 1 : 0;
    animation.current = gsap.timeline({ onComplete: () => setState('actionChoice') }).
    to(others, { autoAlpha: 0, y: quiet ? 0 : 12, duration: duration * .35, ease: 'power2.out' }, 0).
    to(el.querySelectorAll('.home-animal-choice .animal-identity'), { autoAlpha: 0, duration: duration * .25 }, 0).
    to(chosen, { x, y, scale, autoAlpha: 1, duration: duration * .65, ease: 'power2.inOut' }, duration * .2).
    fromTo(el.querySelector('.action-choice-layer'), { autoAlpha: 0, y: quiet ? 0 : 10 }, { autoAlpha: 1, y: 0, duration: duration * .45, ease: 'power2.out' }, duration * .5);
  }
  useLayoutEffect(() => {
    if (initialState === 'actionChoice') arrange(false);
    const observer = new ResizeObserver(() => {if (stateRef.current === 'actionChoice') arrange(false);});
    observer.observe(root.current);
    return () => {observer.disconnect();animation.current?.kill();};
  }, []);
  function choose(id) {if (state !== 'administrator') return;select(id);selected.current = id;setState('transitioning');arrange(true);}
  function reset() {
    animation.current?.kill();setState('administrator');
    gsap.set(root.current.querySelectorAll('.home-animal-choice'), { x: 0, y: 0, scale: 1, autoAlpha: 1 });
    gsap.set(root.current.querySelectorAll('.animal-identity'), { autoAlpha: 1 });
    gsap.set(root.current.querySelector('.action-choice-layer'), { autoAlpha: 0, y: 0 });
  }
  return <div ref={root} className="post-office-choices" data-scene-state={state} inert={!active ? true : undefined}>
    <header className="home-selection-heading"><p>Before Sending</p><h2>{state === 'actionChoice' ? t("你想从哪里开始？") : t("谁陪你写这封信？")}</h2></header>
    <div className="administrator-selection-layer" inert={state !== 'administrator' ? true : undefined} aria-hidden={state === 'actionChoice'}>
      <div className="home-animal-lineup">
        {Object.entries(administrators).map(([id, animal]) => <div className="home-animal-choice" data-choice={id} key={id}>
          <button className="administrator-choice" aria-pressed={state !== 'administrator' && selectedAdministrator === id} onClick={() => choose(id)} onPointerEnter={() => setHover(id)} onPointerLeave={() => setHover(null)} onFocus={() => setHover(id)} onBlur={() => setHover(null)}>
            <AdministratorCharacter id={id} activity={state === 'administrator' && hover === id ? 'reacting' : 'idle'} />
            <span className="animal-identity">{t(animal.name)}<small>{t(animal.role)}</small></span>
          </button>
        </div>)}
      </div>
    </div>
    <div className="action-choice-layer" inert={state !== 'actionChoice' ? true : undefined} aria-hidden={state !== 'actionChoice'}>
      <EnvelopeEntrances go={go} />
      <button className="change-administrator" onClick={reset}>{t("换一位管理员")}</button>
    </div>
  </div>;
}
