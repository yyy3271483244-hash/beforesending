import { useI18n } from "../i18n/Language";import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import "../envelope-entrances.css";

const art = {
  read: {
    body: "/assets/entrance-envelopes/read-body.png",
    flap: "/assets/entrance-envelopes/read-flap.png",
    thread: "/assets/entrance-envelopes/read-thread.png"
  },
  write: {
    body: "/assets/entrance-envelopes/write-body.png",
    flap: "/assets/entrance-envelopes/write-flap.png",
    thread: "/assets/entrance-envelopes/write-thread.png",
    paper: "/assets/entrance-envelopes/write-paper.png",
    pen: "/assets/entrance-envelopes/write-pen.png"
  }
};

function EnvelopeEntry({ kind, go, busy, begin }) {
  const { t } = useI18n();
  const root = useRef(null);
  const motion = useRef(null);
  const flight = useRef(null);
  const lifting = useRef(false);
  const label = kind === "read" ? t('读一封信') : t('写一封信');

  useLayoutEffect(() => {
    const media = gsap.matchMedia();
    media.add({ quiet: "(prefers-reduced-motion: reduce)", animated: "(prefers-reduced-motion: no-preference)" }, ({ conditions }) => {
      const context = gsap.context(() => {
        motion.current = gsap.timeline({ paused: true, defaults: { duration: conditions.quiet ? 0 : .55, ease: "power2.out" } }).
        to(".entry-object", { y: conditions.quiet ? 0 : -5 }, 0).
        to(".entry-shadow", { opacity: .12, scaleX: .92 }, 0).
        to(".entry-label", { opacity: 1 }, 0);
        if (!conditions.quiet) {
          motion.current.to(".entry-flap", { rotationX: kind === "write" ? -6 : -3, y: kind === "write" ? -2 : -1 }, 0).
          to(".entry-thread", { rotation: kind === "read" ? -4 : -1.2, y: -1 }, 0);
          if (kind === "write") motion.current.to(".entry-paper", { y: -13 }, 0).to(".entry-pen", { rotation: -3 }, 0);
        }
      }, root);
      return () => context.revert();
    });
    return () => {flight.current?.kill();media.revert();};
  }, [kind]);

  function hover(active) {
    if (lifting.current || busy) return;
    if (active) motion.current?.play();else motion.current?.reverse();
  }

  function pick() {
    if (!begin(kind)) return;
    lifting.current = true;
    motion.current?.pause();
    const object = root.current.querySelector(".entry-object");
    const paper = root.current.querySelector(".entry-paper");
    const bounds = object.getBoundingClientRect();
    const quiet = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    flight.current = gsap.timeline({ defaults: { ease: "power3.out" }, onComplete: () => go(kind === "write" ? "write" : "bureau", undefined, kind) }).
    to(object, { x: quiet ? 0 : innerWidth / 2 - bounds.left - bounds.width / 2, y: quiet ? 0 : innerHeight / 2 - bounds.top - bounds.height / 2, rotation: 0, scale: quiet ? 1 : 1.12, duration: quiet ? .01 : .75 }, 0).
    to(root.current.querySelector(".entry-label"), { opacity: 0, duration: quiet ? .01 : .3 }, 0).
    to(root.current.querySelector(".entry-thread"), { rotation: quiet ? 0 : -7, duration: quiet ? .01 : .65 }, 0);
    if (paper) flight.current.to(paper, { y: quiet ? 0 : -Math.min(95, bounds.width * .23), duration: quiet ? .01 : .65 }, quiet ? 0 : .18);
  }

  return <button type="button" ref={root} className={`envelope-entry envelope-entry-${kind}${busy === kind ? " is-lifting" : ""}`} aria-label={label} disabled={Boolean(busy)}
  onPointerEnter={() => hover(true)} onPointerLeave={() => hover(false)} onFocus={() => hover(true)} onBlur={() => hover(false)} onClick={pick}>
    <span className="entry-shadow" aria-hidden="true" />
    <span className="entry-object" aria-hidden="true">
      <span className="entry-interior" />
      <img className="entry-flap" src={art[kind].flap} alt="" draggable="false" />
      {kind === "write" && <span className="entry-paper"><img src={art.write.paper} alt="" draggable="false" /></span>}
      <img className="entry-body" src={art[kind].body} alt="" draggable="false" />
      {kind === "write" && <img className="entry-pen" src={art.write.pen} alt="" draggable="false" />}
      <img className="entry-thread" src={art[kind].thread} alt="" draggable="false" />
    </span>
    <span className="entry-label">{label}</span>
  </button>;
}

export function EnvelopeEntrances({ go, className = "" }) {const { t, locale } = useI18n();
  const [busy, setBusy] = useState(null);
  const locked = useRef(false);
  function begin(kind) {
    if (locked.current) return false;
    locked.current = true;
    setBusy(kind);
    return true;
  }
  return <nav className={`envelope-entrances ${className}`} aria-label={t("读信与写信入口")}>
    <EnvelopeEntry kind="read" go={go} busy={busy} begin={begin} />
    <EnvelopeEntry kind="write" go={go} busy={busy} begin={begin} />
  </nav>;
}
