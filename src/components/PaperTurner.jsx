import { useI18n } from "../i18n/Language";import { useEffect, useRef } from "react";
import gsap from "gsap";
import "../paper-turner.css";

function polygons(progress, side) {
  const cut = 2 * (1 - progress);
  const front = cut >= 1 ? [[0, 0], [1, 0], [1, cut - 1], [cut - 1, 1], [0, 1]] : [[0, 0], [cut, 0], [0, cut]];
  const back = cut >= 1 ? [[1, cut - 1], [1, 1], [cut - 1, 1]] : [[cut, 0], [1, 0], [1, 1], [0, 1], [0, cut]];
  const convert = (points) => points.map(([x, y]) => `${(side === 'left' ? 1 - x : x) * 100}% ${y * 100}%`).join(',');
  const edge = cut >= 1 ? [[1, cut - 1], [cut - 1, 1]] : [[cut, 0], [0, cut]];
  return { front: convert(front), back: convert(back), edge: edge.map(([x, y]) => [(side === 'left' ? 1 - x : x) * 1000, y * 1000]) };
}

export function PaperTurner({ back, onBackChange, onBegin, enabled = true, children }) {const { t, locale } = useI18n();
  const root = useRef(null),fold = useRef(null),drag = useRef(null),tween = useRef(null);
  const value = useRef({ progress: back ? 1 : 0 });
  const side = useRef('right');
  const latest = useRef({ onBackChange, onBegin });latest.current = { onBackChange, onBegin };
  function paint() {
    const p = value.current.progress,shape = polygons(p, side.current);
    root.current.dataset.flipProgress = p.toFixed(3);
    root.current.dataset.flipSide = side.current;
    root.current.querySelector('.letter-front').style.clipPath = `polygon(${shape.front})`;
    root.current.querySelector('.letter-back').style.clipPath = `polygon(${shape.back})`;
    root.current.style.setProperty('--paper-lift', Math.sin(Math.PI * p));
    const [[x1, y1], [x2, y2]] = shape.edge;
    fold.current.setAttribute('d', `M${x1} ${y1} Q${(x1 + x2) / 2 - 12 * Math.sin(Math.PI * p)} ${(y1 + y2) / 2 - 8 * Math.sin(Math.PI * p)} ${x2} ${y2}`);
  }
  function settle(target, notify = false) {
    tween.current?.kill();
    tween.current = gsap.to(value.current, { progress: target, duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? .01 : .62, ease: 'power2.out', onUpdate: paint, onComplete: () => {if (notify) latest.current.onBackChange(Boolean(target));} });
  }
  useEffect(() => {settle(back ? 1 : 0);}, [back]);
  useEffect(() => {paint();return () => tween.current?.kill();}, []);
  function begin(event, corner) {
    if (!enabled || event.button !== 0) return;
    tween.current?.kill();side.current = corner;
    drag.current = { x: event.clientX, y: event.clientY, from: back ? 1 : 0, local: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
    root.current.dataset.dragging = 'true';latest.current.onBegin?.();
  }
  function move(event) {
    if (!drag.current) return;
    const gesture = drag.current;
    const inward = (event.clientX - gesture.x) * (side.current === 'left' ? 1 : -1);
    const upward = gesture.y - event.clientY;
    const distance = Math.max(0, inward + upward * .75);
    const required = Math.min(300, root.current.clientWidth * .65);
    gesture.local = Math.max(0, Math.min(1, distance / required));
    value.current.progress = gesture.from === 1 ? 1 - gesture.local : gesture.local;
    paint();
  }
  function end(cancelled = false) {
    if (!drag.current) return;
    const gesture = drag.current;drag.current = null;delete root.current.dataset.dragging;
    const target = !cancelled && gesture.local >= .6 ? 1 - gesture.from : gesture.from;
    settle(target, true);
  }
  return <div className="paper-turner tactile-paper" ref={root} data-flip-progress={back ? 1 : 0}>
    {children}
    <svg className="paper-fold-ridge" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true"><path ref={fold} /></svg>
    {['left', 'right'].map((corner) => <button key={corner} className={`paper-corner corner-${corner}`} tabIndex={enabled ? 0 : -1} disabled={!enabled} aria-label={t("{0}（{1}下角）", back ? t("翻回正面") : t("翻到背面"), corner === 'left' ? t("左") : t("右"))}
    onPointerDown={(event) => begin(event, corner)} onPointerMove={move} onPointerUp={() => end()} onPointerCancel={() => end(true)} onLostPointerCapture={() => end(true)}
    onKeyDown={(event) => {if (['Enter', ' '].includes(event.key)) {event.preventDefault();if (!event.repeat) {side.current = corner;latest.current.onBegin?.();settle(back ? 0 : 1, true);}}}} />)}
  </div>;
}
