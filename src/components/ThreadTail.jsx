import { useI18n } from "../i18n/Language";import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { createPortal } from "react-dom";
import "../thread-tail.css";

const REST = { progress: 0, dx: 0, dy: 0, revealed: false };
const LIMIT = 150;

export function ThreadTail({ fragment, point, interactive, onActivity, revealHost }) {const { t, locale } = useI18n();
  const hidden = Boolean(fragment.cut || fragment.isPermanentHidden);
  const [pull, setPull] = useState(REST);
  const state = useRef(REST);
  const gesture = useRef(null);
  const settling = useRef(null);
  const control = useRef(null);
  const keyPress = useRef(false);
  function update(next) {state.current = next;setPull(next);}
  function settle(next) {
    settling.current?.kill();
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {update(next);return;}
    const value = { ...state.current };
    settling.current = gsap.to(value, { ...next, duration: .42, ease: "power2.out", onUpdate: () => update({ ...value, revealed: next.revealed }) });
  }
  useEffect(() => {
    if (hidden) {settling.current?.kill();gesture.current = null;update(REST);}
  }, [hidden]);
  useLayoutEffect(() => {
    settling.current?.kill();
    gesture.current = null;
    update(REST);
  }, [fragment.content, fragment.resetKey]);
  useEffect(() => () => settling.current?.kill(), []);

  function begin(event, keyboard = false) {
    if (!interactive || gesture.current || !keyboard && event.button !== 0) return;
    settling.current?.kill();
    gesture.current = { x: event.clientX || 0, y: event.clientY || 0, distance: 0, wasOpen: state.current.revealed, keyboard };
    if (!keyboard) { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); }
    onActivity?.("following");
    if (keyboard && !state.current.revealed) {
      const value = { ...REST };
      settling.current = gsap.to(value, { progress: hidden ? .04 : 1, dx: hidden ? 5 : 110, dy: hidden ? 2 : 65, duration: hidden ? .25 : 1.15, ease: "none", onUpdate: () => update({ ...value }) });
    }
  }
  function move(event) {
    const drag = gesture.current;
    if (!drag || drag.keyboard) return;
    const dx = event.clientX - drag.x,dy = event.clientY - drag.y;
    const distance = Math.hypot(dx, dy);
    drag.distance = distance;
    const fraction = Math.min(1, (hidden ? 6 : LIMIT) / Math.max(1, distance));
    update({ progress: Math.min(hidden ? .04 : 1, distance / LIMIT), dx: dx * fraction, dy: dy * fraction, revealed: drag.wasOpen });
  }
  function end(cancelled = false) {
    const drag = gesture.current;
    if (!drag) return;
    settling.current?.kill();
    gesture.current = null;
    const clickedOpen = drag.wasOpen && !cancelled && (drag.keyboard || drag.distance < 5);
    const staysOpen = !hidden && !clickedOpen && (cancelled ? drag.wasOpen : state.current.progress >= .75 || drag.wasOpen);
    if (staysOpen) {
      const length = Math.hypot(state.current.dx, state.current.dy) || 1;
      settle({ progress: 1, dx: state.current.dx / length * 90, dy: state.current.dy / length * 55, revealed: true });
    } else settle(REST);
    onActivity?.("reading");
  }

  const x = Math.max(0, Math.min(point.width - 44, point.x));
  const top = point.y + 21;
  const reveal = hidden ? 0 : Math.max(0, Math.min(1, (pull.progress - .4) / .6));
  const width = Math.max(120, Math.min(275, (point.width || 300) - 10));
  const stripX = Math.max(0, Math.min(x, point.width - width)) - x;
  const endX = 29 + pull.dx,endY = 20 + pull.dy;
  const threadId = fragment.threadId || `thread-${fragment.id}`;
  const dock = revealHost?.current;
  const strip = interactive && !hidden && fragment.content && pull.progress > 0 ? <div className={`thread-reveal-strip${dock ? " is-docked" : ""}`} data-fragment-id={fragment.id} style={{ left: dock ? undefined : stripX, top: dock ? undefined : 28, width: dock ? undefined : width, opacity: reveal * .8, clipPath: `inset(${(1 - reveal) * 100}% 0 0 0)`, transform: `translate(${(1 - reveal) * -7}px,${(1 - reveal) * -13}px)` }}>{fragment.content}</div> : null;
  return <div className={`thread-tail-anchor${gesture.current ? " is-pulling" : ""}${pull.revealed ? " is-revealed" : ""}${hidden ? " is-sealed" : ""}`} style={{ left: x, top }} data-thread-id={threadId} data-fragment-id={fragment.id} data-pull-progress={pull.progress.toFixed(3)}>
    <button ref={control} type="button" className="anchored-trace red-thread-control" aria-label={hidden ? t("封闭的线结") : t("拉出这一处线头")}
    aria-expanded={interactive && !hidden ? pull.revealed : undefined} tabIndex={interactive ? 0 : -1} style={{ pointerEvents: interactive ? "auto" : "none" }}
    onPointerDown={(event) => begin(event)} onPointerMove={move} onPointerUp={() => end()} onPointerCancel={() => end(true)}
    onLostPointerCapture={() => {if (gesture.current) end(true);}}
    onKeyDown={(event) => {if ([" ", "Enter"].includes(event.key)) {event.preventDefault();if (!event.repeat) keyPress.current = true;}}}
    onKeyUp={(event) => {if ([" ", "Enter"].includes(event.key)) {event.preventDefault();if (keyPress.current && interactive && !hidden) settle(state.current.revealed ? REST : { progress: 1, dx: 90, dy: 55, revealed: true });keyPress.current = false;}}}
    onBlur={() => end(true)}>
      <svg viewBox="0 0 44 44" aria-hidden="true">
        <path className="tail-filament" d={`M3 13 C${13 + pull.dx * .25} ${11 + pull.dy * .15} ${endX - 9} ${endY + 4} ${endX} ${endY}`} />
      </svg>
    </button>
    {dock ? createPortal(strip, dock) : strip}
  </div>;
}
