import { useI18n } from "../i18n/Language";import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { AdministratorCharacter } from "./AdministratorSystem";
import { EnvelopeImage, RoomHeader, envelopeArt } from "./ArchiveRooms";
import { idFor } from "../trace/letterSession";

export const stamps = [
{ id: "night", src: "/assets/art/stamp-night.png", label: "夜间路线" },
{ id: "window", src: "/assets/art/stamp-window.png", label: "窗边" },
{ id: "flowers", src: "/assets/art/stamp-flowers.png", label: "花枝" },
{ id: "distance", src: "/assets/art/stamp-distance.png", label: "两端" }];


function ObjectRail({ label, children }) {
  const gesture = useRef(null),moved = useRef(false);
  return <div className="object-rail" role="group" aria-label={label}
  onPointerDown={(event) => {moved.current = false;if (event.pointerType === "mouse") gesture.current = { x: event.clientX, left: event.currentTarget.scrollLeft };}}
  onPointerMove={(event) => {
    if (!gesture.current) return;
    const dx = event.clientX - gesture.current.x;
    if (Math.abs(dx) > 5) {
      moved.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.scrollLeft = gesture.current.left - dx;
    }
  }}
  onPointerUp={() => {gesture.current = null;}} onPointerCancel={() => {gesture.current = null;}}
  onClickCapture={(event) => {if (moved.current) {event.preventDefault();event.stopPropagation();moved.current = false;}}}
  onKeyDown={(event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    const buttons = [...event.currentTarget.querySelectorAll("button")];
    const index = buttons.indexOf(document.activeElement);
    const next = buttons[Math.max(0, Math.min(buttons.length - 1, index + (event.key === "ArrowRight" ? 1 : -1)))];
    event.preventDefault();next?.focus({ preventScroll: true });next?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }}>{children}</div>;
}

export function DeliveryObjects({ letter, setLetter, go, phase, onSeal, onStamped }) {const { t, locale } = useI18n();
  const [sending, setSending] = useState(false),[near, setNear] = useState(false);
  const envelope = useRef(null),mailbox = useRef(null),drag = useRef(null),timeline = useRef(null),nearRef = useRef(false);
  const latest = useRef(letter);latest.current = letter;
  const [stampChosen, setStampChosen] = useState(false), [applying, setApplying] = useState(false);
  const postage = useRef(null), stampOptions = useRef(null), applied = useRef(false);
  const prepare = phase === "prepare",drop = phase === "drop", stamping = phase === 'stamping';
  const kind = letter.envelopeKind || "ash";
  const stamp = stamps.find((item) => item.id === letter.stampId) || stamps[0];
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  useEffect(() => () => timeline.current?.kill(), []);
  useEffect(() => {
    if (!drop && drag.current) {
      drag.current = null;nearRef.current = false;setNear(false);
      gsap.to(envelope.current, { x: 0, y: 0, rotation: 0, duration: .3 });
    }
  }, [drop]);
  function send() {
    if (!drop || sending || !applied.current || !latest.current.finalText.trim()) return;
    setSending(true);setNear(true);drag.current = null;
    const e = envelope.current.getBoundingClientRect(),m = mailbox.current.getBoundingClientRect();
    const scale = envelope.current.parentElement.getBoundingClientRect().width / envelope.current.parentElement.offsetWidth;
    timeline.current?.kill();
    timeline.current = gsap.timeline({ onComplete: () => {
        const now = Date.now(),current = latest.current;
        setLetter({ ...current, scheduledDeliveryAt: now + (current.deliveryDelay || 0), sentAt: now,
          events: [...current.events, { id: idFor("send"), type: "send", timestamp: now, newText: current.finalText, tokenIds: current.characterIds }] });
        go("waiting");
      } }).
    to(envelope.current, { x: `+=${(m.left + m.width * .53 - e.left - e.width / 2) / scale}`, y: `+=${(m.top + m.height * .37 - e.top - e.height / 2) / scale}`, rotation: 3, scale: .26, duration: reduced() ? .05 : .85, ease: "power2.inOut" }).
    to(envelope.current, { scaleY: .025, opacity: 0, duration: reduced() ? .05 : .4 });
  }
  function start(event) {
    if (!drop || sending || event.button !== 0) return;
    timeline.current?.kill();event.currentTarget.setPointerCapture(event.pointerId);
    const scale = event.currentTarget.parentElement.getBoundingClientRect().width / event.currentTarget.parentElement.offsetWidth;
    drag.current = { x: event.clientX, y: event.clientY, scale };
  }
  function move(event) {
    if (!drag.current || sending) return;
    const x = (event.clientX - drag.current.x) / drag.current.scale,y = (event.clientY - drag.current.y) / drag.current.scale;
    gsap.set(envelope.current, { x, y, rotation: Math.max(-7, Math.min(7, x / 60)) });
    const m = mailbox.current.getBoundingClientRect();
    nearRef.current = event.clientX > m.left - 25 && event.clientX < m.right + 25 && event.clientY > m.top && event.clientY < m.bottom;
    setNear(nearRef.current);
  }
  function end(cancelled = false) {
    if (!drag.current) return;
    drag.current = null;
    if (nearRef.current && !cancelled) send();else
    {nearRef.current = false;setNear(false);timeline.current = gsap.to(envelope.current, { x: 0, y: 0, rotation: 0, duration: reduced() ? .01 : .5, ease: "power2.out" });}
  }
  function sealLetter() {
    if (!prepare || !letter.finalText.trim()) return;
    applied.current = false;
    setStampChosen(false);
    setLetter((current) => ({ ...current, sealedAt: Date.now(), stampAppliedAt: null }));
    onSeal();
  }
  function applyStamp() {
    if (!stamping || !stampChosen || applied.current || applying) return;
    applied.current = true;
    setApplying(true);
    const source = stampOptions.current.querySelector('[aria-pressed="true"] img');
    const from = source.getBoundingClientRect(), to = postage.current.getBoundingClientRect();
    const ratio = envelope.current.getBoundingClientRect().width / envelope.current.offsetWidth;
    gsap.set(postage.current, { x: reduced() ? 0 : (from.left - to.left) / ratio, y: reduced() ? 0 : (from.top - to.top) / ratio, autoAlpha: 1 });
    timeline.current = gsap.to(postage.current, { x: 0, y: 0, duration: reduced() ? .01 : .75, ease: 'sine.inOut', onComplete: () => {
      setLetter((current) => ({ ...current, stampAppliedAt: Date.now() }));
      setApplying(false);
      onStamped();
    } });
  }
  return <>
    <img className="drop-scene" src="/assets/administrators/post-office-facade.png" alt="" draggable="false" />
    {(prepare || phase === 'packing' || stamping) && <AdministratorCharacter className="packaging-administrator" activity="packaging" />}
    <div className="flow-envelope-placement flow-envelope-back" aria-hidden="true">
      <div className="flow-envelope-lining" />
      <EnvelopeImage className="flow-envelope-back-flap" kind={kind} />
    </div>
    <div className="flow-envelope-placement flow-envelope-position" data-envelope-kind={kind}>
      <div ref={envelope} className={`flow-envelope-object${drop ? " is-draggable" : ""}`} role={drop ? "button" : undefined} tabIndex={drop ? 0 : -1}
      aria-label={drop ? t("把这封信投进邮箱") : t("准备中的信封")} aria-disabled={sending || !letter.finalText.trim()} data-sending={sending}
      onPointerDown={start} onPointerMove={move} onPointerUp={() => end()} onPointerCancel={() => end(true)}
      onKeyDown={(event) => {if (drop && ["Enter", " "].includes(event.key)) {event.preventDefault();send();}}}>
        <EnvelopeImage className="flow-envelope-body" kind={kind} />
        <EnvelopeImage className="flow-envelope-flap" kind={kind} />
        <img ref={postage} className="flow-postage" src={stamp.src} alt={t(stamp.label)} draggable="false" />
        {stamping && <button className="stamp-placement-target" disabled={!stampChosen || applying || applied.current} onClick={applyStamp} aria-label={t('贴上邮票')}><span>{t('贴上邮票')}</span></button>}
        <span className="flow-address">{letter.deliveryRecipient || letter.recipient}</span>
      </div>
    </div>
    <section className="send-preparation" aria-label={t("寄信准备")} aria-hidden={!prepare} inert={!prepare ? true : undefined}>
      <div className="preparation-recipient">
        <div className="recipient-modes" role="group" aria-label={t("收件信息类型")}>
          {[["name", "只写名字"], ["email", "邮箱"], ["address", "邮寄地址"]].map(([mode, label]) => <button key={mode} aria-pressed={(letter.deliveryMode || "name") === mode} onClick={() => setLetter((current) => ({ ...current, deliveryMode: mode }))}>{t(label)}</button>)}
        </div>
        <label><span>{t('给')}:</span><input aria-label={t("寄送收件信息")} type={letter.deliveryMode === "email" ? "email" : "text"} autoComplete="off" value={letter.deliveryRecipient ?? letter.recipient} placeholder={letter.deliveryMode === "email" ? "name@example.com" : letter.deliveryMode === "address" ? t("地址") : t("某个人")} onChange={(event) => setLetter((current) => ({ ...current, deliveryRecipient: event.target.value }))} /></label>
      </div>
      <div className="preparation-objects">
        <div><p>{t("信封")}</p><ObjectRail label={t("左右浏览信封")}>{Object.entries(envelopeArt).map(([value, art]) => <button key={value} aria-label={t(art.label)} aria-pressed={kind === value} onClick={() => setLetter((current) => ({ ...current, envelopeKind: value }))}><EnvelopeImage kind={value} /></button>)}</ObjectRail></div>
        <button className="seal-letter-action paper-link" onClick={sealLetter} disabled={!letter.finalText.trim()}>{t('封信')}<span aria-hidden="true"> →</span></button>
      </div>
      <div className="preparation-details">
        <label><input type="checkbox" checked={letter.allowTraces} onChange={(event) => setLetter((current) => ({ ...current, allowTraces: event.target.checked }))} />{t("让线头一同寄出")}</label>
        <div role="group" aria-label={t("到达时间")}>{[[0, t("此刻")], [3600000, t("一小时后")], [86400000, t("明天")]].map(([delay, label]) => <button key={delay} aria-pressed={(letter.deliveryDelay || 0) === delay} onClick={() => setLetter((current) => ({ ...current, deliveryDelay: delay }))}>{label}</button>)}</div>
        <small>{t("本地样信 · 不会发送邮件或实体信")}</small>
      </div>
    </section>
    <section className="stamp-preparation" hidden={!stamping} aria-label={t('选择邮票')} inert={!stamping || applying ? true : undefined}>
      <div ref={stampOptions}><ObjectRail label={t('左右浏览邮票')}>{stamps.map((item) => <button key={item.id} aria-label={t(item.label)} aria-pressed={stampChosen && stamp.id === item.id} disabled={applying} onClick={() => { setStampChosen(true); setLetter((current) => ({ ...current, stampId: item.id })); }}><img src={item.src} alt="" draggable="false" /></button>)}</ObjectRail></div>
    </section>
    <div className={`flow-drop-off${near ? " mailbox-ready" : ""}`} aria-label={t("亲手投递")} aria-hidden={!drop} inert={!drop ? true : undefined}>
      <button ref={mailbox} className="flow-mailbox" aria-label={t("投进邮箱")} disabled={!drop || sending || !letter.finalText.trim()} onClick={send}>
        <img src="/assets/home-stage/mailbox.png" alt="" draggable="false" />
      </button>
      <AdministratorCharacter className="drop-administrator" activity={sending ? "carrying" : "waiting"} />
      <p className="drop-note" role="status">{sending ? t("正在寄出") : !letter.finalText.trim() ? t("信纸还是空的。") : t("把这封信交给邮路。")}</p>
    </div>
  </>;
}

export function PostalWaiting({ letter, setLetter, go }) {const { t, locale } = useI18n();
  const [now, setNow] = useState(Date.now());
  const arrived = now >= (letter.scheduledDeliveryAt || 0);
  useEffect(() => {const timer = setInterval(() => setNow(Date.now()), 1000);return () => clearInterval(timer);}, []);
  return <main className="postal-waiting scene-frame">
    <img className="office-depth" src="/assets/demo-cutouts/send-bg.jpg" alt="" />
    <RoomHeader title={t("已寄出")} go={go} />
    <div className="postal-route">
      <svg viewBox="0 0 1000 340" aria-hidden="true"><path pathLength="100" d="M65 238 C188 37 316 350 461 181 S677 36 907 109" /></svg>
      <div className={`route-envelope${arrived ? " has-arrived" : ""}`} role="img" aria-label={t("已寄出")}><EnvelopeImage kind={letter.envelopeKind} style={{ viewTransitionName: "carried-envelope" }} /></div>
      <AdministratorCharacter className="route-administrator" activity="waiting" />
    </div>
    <p className="postal-thought">{t("这封信已经交给邮路。")}</p>
    <footer className="postal-actions"><button className="paper-link" onClick={() => go("bureau")}>{t("去档案室")}</button><small>{t("本地投递演示 · 不会发送真实邮件")}</small></footer>
  </main>;
}
