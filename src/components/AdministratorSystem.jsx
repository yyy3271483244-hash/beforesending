import { useI18n } from "../i18n/Language";import { useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { EnvelopeEntrances } from "./EnvelopeEntrances";
import "../living-letter.css";
import { getAnimalAsset, getWritingAnimalAsset, keeperSelectionAssets } from "../data/animalAssets";
import { AdministratorContext as Context } from "../data/AdministratorContext";
import { AnimalMedia } from "./AnimalMedia";
import { SelectionAnimalMedia } from "./SelectionAnimalMedia";
import "../animals-v2.css";

gsap.registerPlugin(ScrollTrigger);
export const administrators = {
  mouse: { name: "老鼠", role: "缝信员", pace: 0.65 },
  cat: { name: "猫", role: "看信员", pace: 1.05 },
  rabbit: { name: "兔子", role: "守信员", pace: 0.85 },
  dog: { name: "小狗", role: "送信员", pace: 0.5 }
};

export function AdministratorProvider({ children }) {
  const [selectedAdministrator, setAdministrator] = useState(() => {
    try {const id = localStorage.getItem("before-sending-administrator");return administrators[id] ? id : null;} catch {return null;}
  });
  function select(id) {if (!administrators[id]) return;setAdministrator(id);try {localStorage.setItem("before-sending-administrator", id);} catch {}}
  return <Context.Provider value={{ selectedAdministrator, select }}>{children}</Context.Provider>;
}
export function useAdministrator() {return useContext(Context);}

export function AdministratorCharacter({ id, activity = "idle", className = "", style, actionToken, onActionEnd, selectionPlayback, writingCutout = false }) {
  const { t } = useI18n();
  const { selectedAdministrator } = useAdministrator();
  const animal = id || selectedAdministrator;
  const definition = administrators[animal];
  const asset = writingCutout ? getWritingAnimalAsset(animal, activity) : getAnimalAsset(animal, activity);
  const idleAsset = writingCutout ? getWritingAnimalAsset(animal, 'idle') : getAnimalAsset(animal, 'idle');
  if (!asset || !definition) return null;
  return <div className={`administrator animal-v2 administrator-${animal} activity-${activity} ${className}`} style={style} data-administrator={animal} data-activity={activity} data-pose={asset.pose}>
    {selectionPlayback
      ? <SelectionAnimalMedia asset={keeperSelectionAssets[animal]} active={selectionPlayback.active} request={selectionPlayback.request} name={t(definition.name)} />
      : <AnimalMedia asset={asset} idle={idleAsset} name={t(definition.name)} actionToken={actionToken} onActionEnd={onActionEnd} />}
  </div>;
}

export function AdministratorSelector({ writing, go, embedded = false }) {const { t, locale } = useI18n();
  const { selectedAdministrator, select } = useAdministrator();
  const [chosen, setChosen] = useState(false);
  const [hover, setHover] = useState(null);
  return <section className={`administrator-room${embedded ? " is-embedded" : ""}`} id="administrators" aria-label={t("选择动物管理员")}>
    <div className="administrator-room-inner scene-frame">
      <img className="office-depth post-office-backdrop" src="/assets/administrators/post-office-facade.png" alt="" />
      <header className="selector-heading"><p>{t('信件管理员')}</p><h2>{t("谁陪你写这封信？")}</h2></header>
      <div className={`administrator-lineup${chosen ? " has-choice" : ""}`}>
        {Object.entries(administrators).map(([id, animal], index) => <button key={id} className={`administrator-choice${chosen && selectedAdministrator === id ? " is-chosen" : ""}`}
        onMouseEnter={() => setHover(id)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(id)} onBlur={() => setHover(null)}
        onClick={() => {select(id);setChosen(true);}} aria-pressed={chosen && selectedAdministrator === id} style={{ "--order": index }}>
          <AdministratorCharacter id={id} activity={hover === id || chosen && selectedAdministrator === id ? "reacting" : "idle"} />
          <span>{t(animal.name)}<small>{t(animal.role)}</small></span>
        </button>)}
      </div>
    </div>
    <EnvelopeEntrances go={go} />
    {chosen && writing}
  </section>;
}

export function LivingOpening({ writing, go }) {const { t, locale } = useI18n();
  const root = useRef(null);
  const target = useRef(null);
  useLayoutEffect(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const context = gsap.context(() => {
        gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: 0.8 } }).
        to(".entrance-art", { yPercent: 12, scale: 1.035, ease: "none" }, 0).
        to(".entrance-title", { y: -65, opacity: 0.2, ease: "none" }, 0).
        to(".entrance-thread", { strokeDashoffset: 0, ease: "none" }, 0);
        gsap.from(".administrator-choice", { y: 55, rotate: (i) => i % 2 ? 2 : -2, stagger: 0.1, duration: 1, scrollTrigger: { trigger: target.current, start: "top 75%", toggleActions: "play none none none" } });
      }, root.current.parentElement);
      return () => context.revert();
    });
    return () => media.revert();
  }, []);
  return <main className="living-opening">
    <section className="entrance scene-frame" ref={root}>
      <header className="entrance-title"><h1>Before Sending</h1><p>{t("在寄出之前")}</p></header>
      <div className="entrance-art">
        <div className="administrator-lineup">
          {Object.keys(administrators).map((id) => <AdministratorCharacter key={id} id={id} activity="welcoming" />)}
        </div>
      </div>
      <button className="enter-office" onClick={() => target.current.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })}>{t("走进信件处")}<span aria-hidden="true">↓</span></button>
    </section>
    <div ref={target}><AdministratorSelector writing={writing} go={go} embedded /></div>
  </main>;
}

export function OfficeRoom({ go }) {const { t, locale } = useI18n();
  return <main className="office-room scene-frame">
    <img className="office-depth post-office-backdrop" src="/assets/administrators/post-office-facade.png" alt="" />
    <header className="office-heading"><button onClick={() => go("administrators")}>{t("换一位管理员")}</button><h1>Before Sending</h1></header>
    <EnvelopeEntrances go={go} />
    <AdministratorCharacter className="office-administrator" />
  </main>;
}

export function LetterAdministrator({ caret, activity, ghost }) {
  const [pose, setPose] = useState("idle");
  const [carried, setCarried] = useState(null);
  const animal = useRef(null);
  const strip = useRef(null);
  const movement = useRef(null);
  const collection = useRef(null);
  const moveDelay = useRef(null);
  const resumeDelay = useRef(null);
  const returnDelay = useRef(null);
  const anchor = useRef(null);
  const destination = useRef(null);
  const state = useRef("idle");
  const weavingSince = useRef(0);
  const latest = useRef({ caret, activity });
  latest.current = { caret, activity };
  const reduce = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function enter(next) {state.current = next;setPose(next);}

  useLayoutEffect(() => {
    const node = animal.current;
    const next = { x: Math.max(0, caret.width - node.offsetWidth - 4), y: Math.max(0, caret.y - 22) };
    destination.current = next;
    if (!anchor.current) {anchor.current = next;gsap.set(node, next);return;}
    function travel() {
      if (movement.current) return;
      const target = destination.current;
      if (Math.hypot(target.x - anchor.current.x, target.y - anchor.current.y) < 24) return;
      node.dataset.moves = String(Number(node.dataset.moves || 0) + 1);
      movement.current = gsap.to(node, { ...target, duration: reduce() ? .01 : .95, ease: "power2.out", onComplete: () => {
          anchor.current = target;
          movement.current = null;
          travel();
        } });
    }
    // Line anchors are stable while typing. An in-flight journey is never restarted by a keypress.
    clearTimeout(moveDelay.current);
    moveDelay.current = setTimeout(travel, 550);
    return () => clearTimeout(moveDelay.current);
  }, [caret.line, caret.paragraphId, caret.width, caret.y]);

  useEffect(() => {
    clearTimeout(resumeDelay.current);
    clearTimeout(returnDelay.current);
    if (collection.current) return;
    if (activity === "weaving") {
      if (state.current !== "weaving") {weavingSince.current = performance.now();enter("weaving");}
    } else if (state.current === "weaving") {
      resumeDelay.current = setTimeout(() => {
        enter("returning");
        returnDelay.current = setTimeout(() => enter(latest.current.activity), reduce() ? 0 : 250);
      }, reduce() ? 0 : Math.max(0, 900 - (performance.now() - weavingSince.current)));
    } else enter(activity);
    return () => {clearTimeout(resumeDelay.current);clearTimeout(returnDelay.current);};
  }, [activity]);

  useEffect(() => {
    if (!ghost) {
      collection.current?.kill();collection.current = null;
      gsap.set(strip.current, { opacity: 0 });setCarried(null);
      return;
    }
    if (ghost.content.trim().length < 4 || ghost.timestamp && Date.now() - ghost.timestamp > 2000) return;
    const timer = setTimeout(() => setCarried(ghost), 650);
    return () => clearTimeout(timer);
  }, [ghost?.id]);

  useLayoutEffect(() => {
    if (!carried) return;
    collection.current?.kill();
    enter("collecting");
    const target = destination.current || { x: 0, y: 0 };
    collection.current = gsap.timeline({ onComplete: () => {
        collection.current = null;setCarried(null);enter(latest.current.activity);
      } }).
    set(strip.current, { x: Math.min(carried.linePosition?.x || 0, target.x), y: Math.max(0, carried.linePosition?.y || 0), opacity: .75, scale: 1, rotation: -1 }).
    to(strip.current, { x: Math.max(0, target.x - 65), y: target.y + 35, duration: reduce() ? .01 : .9, ease: "power2.inOut" }).
    to(strip.current, { y: target.y + 43, scale: .8, opacity: 0, duration: reduce() ? .01 : .4, ease: "power2.out" });
  }, [carried]);

  useEffect(() => () => {
    clearTimeout(moveDelay.current);clearTimeout(resumeDelay.current);clearTimeout(returnDelay.current);
    movement.current?.kill();collection.current?.kill();
  }, []);
  return <div className="administrator-layer" aria-hidden="true">
    <div className="carried-fragment" ref={strip}>{carried?.content}</div>
    <div className="caret-administrator" ref={animal} data-state={pose}><AdministratorCharacter activity={pose} /></div>
  </div>;
}
