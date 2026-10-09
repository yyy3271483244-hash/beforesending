import { useI18n } from "../i18n/Language";import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { archiveEntries } from "../data/archiveCollection";
export { archiveEntries } from "../data/archiveCollection";
import { AdministratorCharacter } from "./AdministratorSystem";
import "../archive-rooms.css";

const CABINET = "/assets/demo-cutouts/drawer-bg.jpg";
const WIDTH = 1456;
const HEIGHT = 816;
// These boundaries follow the original painted cabinet, including its uneven cells.
const columns = [18, 211, 413, 619, 827, 1036, 1238, 1437];
const rows = [16, 171, 329, 488, 644, 802];

export function RoomHeader({ title, go, current }) {const { t, locale } = useI18n();
  return <header className="room-header">
    <button className="room-brand" title={t("重看入场")} aria-label={t("Before Sending，重看入场")} onClick={() => go("opening")}>Before Sending</button>
    <h1>{title}</h1>
    <nav aria-label={t("信件空间")}>
      <button onClick={() => go("write")} aria-current={current === "write" ? "page" : undefined}>{t("书桌")}</button>
      <button onClick={() => go("bureau")} aria-current={current === "bureau" ? "page" : undefined}>{t("档案室")}</button>
    </nav>
  </header>;
}

export const envelopeArt = {
  blue: { src: "/assets/archive-envelopes/blue.png", width: 600, height: 440, crop: "0 0 600 440", label: "雾蓝信封" },
  ash: { src: "/assets/archive-envelopes/ivory.png", width: 600, height: 440, crop: "0 0 600 440", label: "米白信封" },
  wine: { src: "/assets/archive-envelopes/pink.png", width: 600, height: 440, crop: "0 0 600 440", label: "浅粉信封" }
};
export function EnvelopeImage({ className = "", style, kind = "blue" }) {
  const art = envelopeArt[kind] || envelopeArt.blue;
  return <svg className={className} style={style} viewBox={art.crop} aria-hidden="true">
    <image href={art.src} width={art.width} height={art.height} />
  </svg>;
}

function PaintedDrawer({ index, entries, open, previewId, takingId, onToggle, onPreview, onTake, allowTouchScroll = false }) {const { t, locale } = useI18n();
  const entry = entries[0];
  const root = useRef(null);
  const face = useRef(null);
  const drag = useRef(null);
  const consumedClick = useRef(false);
  const x = columns[index % 7];
  const y = rows[Math.floor(index / 7)];
  const width = columns[index % 7 + 1] - x;
  const height = rows[Math.floor(index / 7) + 1] - y;
  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useLayoutEffect(() => {
    const animation = gsap.to(root.current, {
      "--open": open ? 1 : 0,
      duration: reduced() ? 0 : open ? 0.8 : 0.56,
      ease: open ? "power3.out" : "power2.inOut",
      overwrite: true
    });
    return () => animation.kill();
  }, [open]);

  function begin(event) {
    if (allowTouchScroll && event.pointerType === "touch") return;
    if (event.button !== 0) return;
    drag.current = { y: event.clientY, initial: open ? 1 : 0, progress: open ? 1 : 0, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function move(event) {
    if (!drag.current) return;
    const delta = event.clientY - drag.current.y;
    if (Math.abs(delta) < 5 && !drag.current.moved) return;
    drag.current.moved = true;
    const distance = root.current.getBoundingClientRect().height * 0.55;
    drag.current.progress = Math.max(0, Math.min(1, drag.current.initial + delta / distance));
    gsap.killTweensOf(root.current);
    gsap.set(root.current, { "--open": reduced() ? drag.current.initial : drag.current.progress });
    root.current.style.zIndex = "20";
  }

  function end(cancelled = false) {
    if (!drag.current) return;
    const { moved, progress, initial } = drag.current;
    drag.current = null;
    root.current.style.zIndex = "";
    if (!moved) return;
    consumedClick.current = true;
    const shouldOpen = cancelled ? Boolean(initial) : progress > 0.35;
    if (shouldOpen !== open) onToggle(shouldOpen);else
    gsap.to(root.current, { "--open": open ? 1 : 0, duration: reduced() ? 0 : 0.4 });
  }

  return <div ref={root} className={`painted-drawer${open ? " is-open" : ""}${previewId ? " has-preview" : ""}`}
  style={{ left: `${x / WIDTH * 100}%`, top: `${y / HEIGHT * 100}%`, width: `${width / WIDTH * 100}%`, height: `${height / HEIGHT * 100}%` }}>
    <div className="drawer-cavity" aria-hidden="true" />
    <div className="drawer-tray" aria-hidden="true" />
    {entries.map((letter, slot) => <button key={letter.id} className={`file-envelope${previewId === letter.id ? " is-previewed" : ""}${takingId === letter.id ? " is-taken" : ""}`} style={{ "--slot": slot }} tabIndex={open ? 0 : -1} aria-hidden={!open}
    data-letter-id={letter.id} data-color={letter.colorVariant} aria-label={t("取出：{0}", letter.recipient)} aria-describedby={previewId === letter.id ? "archive-letter-preview" : undefined}
    onPointerEnter={(event) => {if (event.pointerType !== "touch") onPreview(letter, event.currentTarget);}} onPointerLeave={() => onPreview(null)}
    onFocus={(event) => onPreview(letter, event.currentTarget)} onBlur={() => onPreview(null)}
    onClick={(event) => onTake(letter, event.currentTarget.querySelector(".drawer-mail-object"))}>
      <span className="drawer-mail-object"><EnvelopeImage kind={letter.envelopeKind} /></span>
    </button>)}
    {open && !entry && <span className="empty-drawer-note">{t("空")}</span>}
    <button ref={face} className="drawer-front" aria-expanded={open}
    aria-label={t("第 {0} 格{1}", index + 1, entry ? `，${entry.recipient}` : t("，空抽屉"))}
    onPointerDown={begin} onPointerMove={move}
    onPointerUp={() => end()} onPointerCancel={() => end(true)}
    onClick={() => {if (consumedClick.current) {consumedClick.current = false;return;}onToggle(!open);}}>
      <svg viewBox={`${x} ${y} ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
        <image href={CABINET} width={WIDTH} height={HEIGHT} />
      </svg>
      {entry && <span className="drawer-index">{String(Math.floor(archiveEntries.indexOf(entry) / 3) + 1).padStart(2, "0")}</span>}
    </button>
  </div>;
}

function ArchiveLetterFlight({ selection, go }) {
  const root = useRef(null);
  const { entry, bounds } = selection;
  useLayoutEffect(() => {
    const quiet = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const width = Math.min(430, innerWidth - 64);
    const scale = width / bounds.width;
    const context = gsap.context(() => {
      gsap.timeline({ onComplete: () => go("reading", entry.id, "archive") }).
      to(root.current, { x: innerWidth / 2 - width / 2 - bounds.left, y: innerHeight * .55 - bounds.height * scale / 2 - bounds.top, scale, rotation: 0, duration: quiet ? 0 : .9, ease: "power3.out" }).
      to(".archive-flight-flap", { rotationX: -178, duration: quiet ? 0 : .65, ease: "power2.inOut" }).
      set(".archive-flight-flap", { zIndex: 1 }).
      to(".archive-flight-paper", { yPercent: -65, duration: quiet ? 0 : .7, ease: "power3.out" }, quiet ? ">" : "-=.08").
      to(".archive-flight-paper", { height: "175%", yPercent: -45, duration: quiet ? .01 : .6, ease: "power2.inOut" });
    }, root);
    return () => context.revert();
  }, [entry.id]);
  return createPortal(<div ref={root} className="archive-flight" data-letter-id={entry.id} style={{ left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height }} aria-hidden="true">
    <div className="archive-flight-back" />
    <div className="archive-flight-paper" style={{ viewTransitionName: "carried-paper" }} />
    <EnvelopeImage kind={entry.envelopeKind} className="archive-flight-body" />
    <div className="archive-flight-flap"><EnvelopeImage kind={entry.envelopeKind} /></div>
  </div>, document.body);
}

export function CabinetRoom({ go, selectedId, embedded = false, onTakeLetter, takingId, locked = false, onCancelTake }) {const { t, locale } = useI18n();
  const selectedEntry = archiveEntries.find((entry) => entry.id === selectedId);
  const [open, setOpen] = useState(selectedEntry?.drawer ?? null);
  const [preview, setPreview] = useState(null);
  const [selection, setSelection] = useState(null);
  const viewport = useRef(null);
  const world = useRef(null);
  const taking = useRef(false);
  if (onTakeLetter) taking.current = locked;
  const cancelTake = useRef(onCancelTake);cancelTake.current = onCancelTake;
  useEffect(() => {if (selectedEntry) setOpen(selectedEntry.drawer);}, [selectedId]);

  useLayoutEffect(() => {
    viewport.current.scrollLeft = (viewport.current.scrollWidth - viewport.current.clientWidth) / 2;
  }, []);

  useEffect(() => {
    const close = (event) => {
      if (event.key !== "Escape") return;
      if (taking.current) {if (cancelTake.current) cancelTake.current();else {taking.current = false;setSelection(null);}} else
      {setPreview(null);setOpen(null);}
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  function take(entry, element) {
    if (taking.current) return;
    if (onTakeLetter) {setPreview(null);onTakeLetter(entry, element);return;}
    taking.current = true;
    setPreview(null);
    const { left, top, width, height } = element.getBoundingClientRect();
    setSelection({ entry, bounds: { left, top, width, height } });
  }

  function showPreview(entry, element) {
    if (taking.current) return;
    if (!entry) {setPreview(null);return;}
    const rect = element.getBoundingClientRect();
    const width = Math.min(250, innerWidth - 32);
    setPreview({ entry, x: Math.max(16, Math.min(innerWidth - width - 16, rect.left + rect.width / 2 - width / 2)), y: rect.top > 190 ? rect.top - 172 : Math.min(innerHeight - 180, rect.bottom + 12) });
  }

  const Surface = embedded ? 'div' : 'main';
  return <Surface className={`archive-page${embedded ? ' is-flow-cabinet' : ''}${selection || locked ? " is-taking-letter" : ""}`}>
    <RoomHeader title={t("匿名信件处")} go={go} current="bureau" />
    <div className="cabinet-viewport" ref={viewport}>
      <section className={`cabinet-world${open !== null ? " has-open-drawer" : ""}`} ref={world} aria-label={t("信件档案柜")}>
        <img className="cabinet-painting" src={CABINET} alt={t("三十五个水彩纸抽屉，粉红、浅蓝与纸白交错排列")} draggable="false" />
        {Array.from({ length: 35 }, (_, index) => <PaintedDrawer key={index} index={index} allowTouchScroll={embedded}
        entries={archiveEntries.filter((entry) => entry.drawer === index)} open={open === index}
        previewId={preview?.entry.id} takingId={takingId || selection?.entry.id} onPreview={showPreview}
        onToggle={(value) => {if (!taking.current) {setPreview(null);setOpen(value ? index : null);}}} onTake={take} />)}
      </section>
    </div>
    {preview && createPortal(<aside id="archive-letter-preview" className="archive-preview" style={{ left: preview.x, top: preview.y }} data-letter-id={preview.entry.id}>
      <h2>{preview.entry.title}</h2><p>{preview.entry.previewText}</p>
    </aside>, document.body)}
    {selection && <ArchiveLetterFlight selection={selection} go={go} />}
    <footer className="cabinet-footer" aria-live="polite">
      <span className="archive-caption">{open !== null ? t("第 {0} 格", String(open + 1).padStart(2, "0")) : t('匿名档案')}</span>
      <div className="archive-companion"><AdministratorCharacter activity={open !== null ? 'collecting' : 'archive'} /><span>{open !== null && !archiveEntries.some((entry) => entry.drawer === open) ? t("这格还空着。") : ""}</span></div>
      {open !== null ? <button disabled={Boolean(selection)} onClick={() => {setPreview(null);setOpen(null);}}>{t("合上抽屉")}</button> : <small>{t("馆藏样信 ·")}{String(archiveEntries.length).padStart(2, "0")}</small>}
    </footer>
  </Surface>;
}

export function UnsealRoom({ letter, go, sourceId }) {const { t, locale } = useI18n();
  const [opened, setOpened] = useState(false);
  const root = useRef(null);
  const timeline = useRef(null);
  useEffect(() => () => timeline.current?.kill(), []);

  function openEnvelope() {
    if (opened) return;
    setOpened(true);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    timeline.current = gsap.timeline().
    to(root.current.querySelector(".envelope-flap"), { rotateX: 180, duration: reduced ? 0 : 0.65, ease: "power2.inOut" }).
    to(root.current.querySelector(".letter-slip"), { yPercent: -60, rotate: -3, duration: reduced ? 0 : 0.8, ease: "power3.out" }, reduced ? ">" : "-=0.15");
  }

  return <main className="table-room unseal-room" ref={root}>
    <img className="table-backdrop" src="/assets/demo-cutouts/reader-room-bg.jpg" alt="" />
    <RoomHeader title={t("拆信台")} go={go} />
    <div className="unseal-surface">
      <div className={`unseal-object${opened ? " is-open" : ""}`}>
        <div className="envelope-interior" />
        <article className="letter-slip" style={{ viewTransitionName: "carried-paper" }} />
        <EnvelopeImage kind={letter.envelopeKind} className="envelope-body" style={{ viewTransitionName: "carried-envelope" }} />
        <button className="envelope-flap" disabled={opened} onClick={openEnvelope} aria-label={t("拆开信封")}>
          <EnvelopeImage kind={letter.envelopeKind} />
        </button>
      </div>
      <div className="unseal-label">
        <button className="paper-link" onClick={() => opened ? go("reading", sourceId) : openEnvelope()}>{opened ? t("展开信纸") : t("拆开封口")}</button>
      </div>
      <AdministratorCharacter className="unseal-keeper" activity="reading" />
    </div>
    <footer className="table-footer"><button onClick={() => go(sourceId ? "bureau" : "waiting", sourceId)}>{t("放回原处")}</button><span>{sourceId ? t("馆藏样信") : t("一封给你的信")}</span></footer>
  </main>;
}
