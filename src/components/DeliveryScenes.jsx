import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ART, envelopeChoices, stampChoices } from "../data/content";
import { calculateDelivery } from "../utils/delivery";
import { emitThreadEvent, THREAD_ACTIONS } from "../animation/threadEvents";
import ThreadAnimal from "./ThreadAnimal";

function envelopeFor(id) { return envelopeChoices.find((item) => item.id === id) || envelopeChoices[0]; }
function stampFor(id) { return stampChoices.find((item) => item.id === id) || stampChoices[0]; }

export function MailboxScene({ letter, onMailed, onBack }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const pointerRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef({ x: 0, y: 0 });
  const roomRef = useRef(null);
  const slotRef = useRef(null);
  const envelopeRef = useRef(null);
  const envelope = envelopeFor(letter.selectedEnvelope);
  const stamp = stampFor(letter.selectedStamp);

  const releaseAt = (x, y) => {
    const slot = slotRef.current?.getBoundingClientRect();
    const room = roomRef.current?.getBoundingClientRect();
    const directlyOverSlot = slot && x > slot.left && x < slot.right && y > slot.top && y < slot.bottom;
    const inMailboxMouth = room && slot && x > slot.left - slot.width * 0.8 && x < slot.right + slot.width * 0.8 && y > slot.top - slot.height * 1.3 && y < slot.bottom + slot.height * 1.6;
    if (directlyOverSlot || inMailboxMouth) {
      gsap.to(envelopeRef.current, {
        x: positionRef.current.x + 100,
        y: positionRef.current.y - 55,
        scale: 0.22,
        opacity: 0,
        rotate: -8,
        duration: 1.1,
        ease: "power2.in",
      });
      window.setTimeout(onMailed, 1150);
    } else {
      gsap.to(envelopeRef.current, { x: 0, y: 0, rotate: -3, duration: 0.65, ease: "back.out(1.4)" });
      positionRef.current = { x: 0, y: 0 };
      setPosition({ x: 0, y: 0 });
    }
  };

  const startDragging = (event) => {
    event.preventDefault();
    draggingRef.current = true;
    pointerRef.current = { x: event.clientX, y: event.clientY };

    const handleMove = (moveEvent) => {
      if (!draggingRef.current || !roomRef.current) return;
      pointerRef.current = { x: moveEvent.clientX, y: moveEvent.clientY };
      const rect = roomRef.current.getBoundingClientRect();
      const next = {
        x: moveEvent.clientX - rect.left - rect.width * 0.22,
        y: moveEvent.clientY - rect.top - rect.height * 0.67,
      };
      positionRef.current = next;
      setPosition(next);
    };
    const handleRelease = (upEvent) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleRelease);
      releaseAt(upEvent.clientX || pointerRef.current.x, upEvent.clientY || pointerRef.current.y);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleRelease);
  };

  return <main className="bs-mailbox-room" ref={roomRef}>
    <button className="bs-margin-back" onClick={onBack}>拆开重新选择</button>
    <p className="bs-mailbox-instruction">亲手把它投进去。</p>
    <div className="bs-mailbox-object"><img src={`${ART}/mailbox-blue.png`} alt="蓝色旧邮筒" /><div className="bs-mail-slot" ref={slotRef} /></div>
    <button ref={envelopeRef} className="bs-mail-envelope" style={{ transform: `translate(${position.x}px, ${position.y}px) rotate(-3deg)` }} onPointerDown={startDragging} aria-label="拖动信封到邮筒">
      <img src={envelope.image} alt="已经封好的信" /><img className="bs-mail-stamp" src={stamp.image} alt="" /><span>{letter.destination}</span>
    </button>
  </main>;
}

export function MailJourney({ letter, updateLetter, onArrived }) {
  const plan = useMemo(() => calculateDelivery(letter.origin, letter.destination), [letter.origin, letter.destination]);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("邮筒合上以后，街道恢复了安静。 ");

  useEffect(() => {
    const startedAt = Date.now();
    updateLetter({ deliveryStatus: "travelling", deliveryStart: startedAt, realArrivalDate: plan.arrivalDate });
    const timer = window.setInterval(() => {
      const next = Math.min(1, (Date.now() - startedAt) / plan.demoDuration);
      setProgress(next);
      if (next > 0.78) setStatus("它已经接近另一扇门。 ");
      else if (next > 0.45) setStatus("信在夜里的分拣台短暂停留。 ");
      else if (next > 0.16) setStatus("纸张正穿过两座城市之间的距离。 ");
      if (next >= 1) {
        window.clearInterval(timer);
        updateLetter({ deliveryStatus: "arrived", deliveryArrival: Date.now() });
      }
    }, 80);
    return () => window.clearInterval(timer);
  }, []);

  return <main className="bs-journey-room">
    <header><small>一封信的真实距离</small><h1>{plan.origin} <span>至</span> {plan.destination}</h1><p>{plan.kilometers.toLocaleString()} 公里 · 预计 {plan.days} 天 · {plan.arrivalDate} 抵达</p></header>
    <section className="bs-postal-route"><span className="bs-route-start">{plan.origin}</span><div className="bs-route-line"><i style={{ width: `${progress * 100}%` }} /><img src={envelopeFor(letter.selectedEnvelope).image} alt="移动中的信" style={{ left: `${Math.min(92, progress * 92)}%` }} /></div><span className="bs-route-end">{plan.destination}</span></section>
    <p className="bs-journey-status">{status}</p>
    <small className="bs-demo-time">完整作品按真实天数等待；本次 Demo 将路程压缩为 {Math.round(plan.demoDuration / 1000)} 秒。</small>
    {progress >= 1 && <button className="bs-arrival-door" onClick={onArrived}>另一端，有人收到了信</button>}
  </main>;
}

export function ArrivalScene({ letter, onHome, onArchive }) {
  const [opened, setOpened] = useState(false);
  const [revealedTraces, setRevealedTraces] = useState(false);
  const envelope = envelopeFor(letter.selectedEnvelope);
  const pullThread = () => {
    emitThreadEvent(THREAD_ACTIONS.threadPull, { fragments: letter.deletedFragments });
    setRevealedTraces(true);
  };

  return <main className={`bs-arrival-room ${opened ? "is-open" : ""}`}>
    <ThreadAnimal />
    <p className="bs-arrival-date">{letter.destination} · {new Date().toLocaleDateString("zh-CN")}</p>
    <section className="bs-recipient-table">
      <button className="bs-arrived-envelope" onClick={() => setOpened(true)} aria-label="拆开抵达的信"><img src={envelope.image} alt="抵达的信封" /><span>{opened ? "" : "轻轻拆开"}</span></button>
      {opened && <article className={`bs-arrived-letter paper-${letter.selectedPaper}`}><small>写给：{letter.recipient || "你"}</small><p>{letter.finalText}</p><footer>{letter.senderIdentityType === "anonymous" ? "没有署名" : letter.senderIdentity || "一种没有写完的署名"}</footer></article>}
      {opened && letter.traceSharingPermission && (
        <aside className={`bs-shared-traces ${revealedTraces ? "is-revealed" : ""}`}>
          <button type="button" className="bs-thread-pull" onClick={pullThread}>拉出松线</button>
          {revealedTraces && <><h2>寄信人也允许你看见：</h2>{letter.deletedFragments.map((fragment) => <del key={fragment.id}>{fragment.text}</del>)}</>}
        </aside>
      )}
    </section>
    {opened && <nav className="bs-ending-links"><button onClick={onArchive}>去读另一封信</button><button onClick={onHome}>回到故事开头</button></nav>}
  </main>;
}

export function ResolutionScene({ letter, onHome, onArchive }) {
  const envelope = envelopeFor(letter.selectedEnvelope);
  const mode = letter.destinationType;
  const copy = mode === "public"
    ? { eyebrow: "公共档案 / 新收入", title: "它被放进世间，等一个陌生人抽到。", action: "去档案里看看" }
    : mode === "private"
      ? { eyebrow: "私人抽屉 / 未编号", title: "抽屉合上了。只有这次浏览记得它在这里。", action: "回到故事开头" }
      : { eyebrow: "没有副本", title: "墨迹慢慢变浅。它没有被保存，也没有被寄往任何地方。", action: "回到故事开头" };

  return (
    <main className={`bs-resolution-room bs-resolution-room--${mode}`}>
      <header><small>{copy.eyebrow}</small><h1>{copy.title}</h1></header>
      {mode === "public" && (
        <div className="bs-resolution-archive">
          <span className="bs-resolution-box-lid" />
          <img src={envelope.image} alt="进入公共档案的信" />
          <span className="bs-resolution-label">PUBLIC LETTER ARCHIVE · {new Date().getFullYear()}</span>
        </div>
      )}
      {mode === "private" && (
        <div className="bs-resolution-drawer">
          <div><img src={envelope.image} alt="收进私人抽屉的信" /></div>
          <span>PRIVATE / 仅保存在浏览器内存</span>
        </div>
      )}
      {mode === "vanish" && (
        <div className="bs-resolution-vanish"><img src={envelope.image} alt="逐渐消失的信" /><i /><i /><i /></div>
      )}
      <button onClick={mode === "public" ? onArchive : onHome}>{copy.action}</button>
    </main>
  );
}
