import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { destinationChoices, envelopeChoices, identityChoices, paperChoices, stampChoices, ART } from "../data/content";

export default function PackagingScene({ letter, updateLetter, onComplete, onBack }) {
  const [phase, setPhase] = useState(0);
  const [postmarkPos, setPostmarkPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);
  const [stamped, setStamped] = useState(false);
  const stageRef = useRef(null);
  const envelopeRef = useRef(null);
  const selectedEnvelope = envelopeChoices.find((item) => item.id === letter.selectedEnvelope) || envelopeChoices[0];
  const selectedStamp = stampChoices.find((item) => item.id === letter.selectedStamp) || stampChoices[0];
  const selectedPaper = paperChoices.find((item) => item.id === letter.selectedPaper) || paperChoices[0];

  useLayoutEffect(() => {
    const context = gsap.context(() => {
      gsap.fromTo(".bs-package-center > *", { opacity: 0, y: 42 }, { opacity: 1, y: 0, stagger: 0.09, duration: 0.8, ease: "power2.out" });
      if (phase === 1) {
        gsap.fromTo(".bs-fold-sheet", { rotateX: 0, scaleY: 1 }, { rotateX: 58, scaleY: 0.72, duration: 1.2, ease: "power2.inOut" });
      }
    }, stageRef);
    return () => context.revert();
  }, [phase]);

  const movePostmark = (event) => {
    if (!draggingRef.current || !stageRef.current) return;
    const bounds = stageRef.current.getBoundingClientRect();
    setPostmarkPos({ x: event.clientX - bounds.left - 48, y: event.clientY - bounds.top - 48 });
  };

  const releasePostmark = (event) => {
    draggingRef.current = false;
    setDragging(false);
    const envelopeBounds = envelopeRef.current?.getBoundingClientRect();
    if (envelopeBounds && event.clientX >= envelopeBounds.left && event.clientX <= envelopeBounds.right && event.clientY >= envelopeBounds.top && event.clientY <= envelopeBounds.bottom) {
      setStamped(true);
      setPostmarkPos({ x: 0, y: 0 });
    } else {
      gsap.to(".bs-postmark-tool", { x: 0, y: 0, duration: 0.55, ease: "back.out(1.3)" });
      setPostmarkPos({ x: 0, y: 0 });
    }
  };

  return (
    <main className="bs-package-room" ref={stageRef} onPointerMove={movePostmark} onPointerUp={releasePostmark}>
      <button className="bs-margin-back" onClick={onBack}>回到回放</button>
      <div className="bs-package-progress" aria-label={`装封步骤 ${phase + 1}/4`}><span style={{ width: `${(phase + 1) * 25}%` }} /></div>
      <aside className="bs-package-reference-corner" aria-hidden="true">
        <img src={`${ART}/character-leaving.png`} alt="" />
        <img src="/assets/ui-reference/postmarks-sheet.jpg" alt="" />
        <span>POST ROOM<br />paper · envelope · stamp</span>
      </aside>

      {phase === 0 && (
        <section className="bs-package-center">
          <header><small>01 / 给文字选择一种重量</small><h1>挑一张信纸</h1></header>
          <div className="bs-paper-samples">
            {paperChoices.map((paper) => (
              <button key={paper.id} className={`bs-paper-sample paper-${paper.id} ${letter.selectedPaper === paper.id ? "is-selected" : ""}`} onClick={() => updateLetter({ selectedPaper: paper.id })}>
                <img src={paper.image} alt="" /><span>{paper.label}</span><small>{paper.note}</small>
              </button>
            ))}
          </div>
          <button className="bs-ritual-next" onClick={() => setPhase(1)}>沿折痕继续</button>
        </section>
      )}

      {phase === 1 && (
        <section className="bs-package-center">
          <header><small>02 / 把纸折进一种颜色</small><h1>选择信封</h1></header>
          <div className="bs-folding-stage"><div className={`bs-fold-sheet paper-${letter.selectedPaper}`} style={{ backgroundImage: `url(${selectedPaper.image})` }}><p>{letter.finalText.slice(0, 70)}</p></div></div>
          <div className="bs-envelope-samples">
            {envelopeChoices.map((envelope) => (
              <button key={envelope.id} className={letter.selectedEnvelope === envelope.id ? "is-selected" : ""} onClick={() => updateLetter({ selectedEnvelope: envelope.id })} title={envelope.label}>
                <img src={envelope.image} alt={envelope.label} />
              </button>
            ))}
          </div>
          <button className="bs-ritual-next" onClick={() => setPhase(2)}>把信放进去</button>
        </section>
      )}

      {phase === 2 && (
        <section className="bs-package-center bs-postage-workbench">
          <header><small>03 / 一枚邮票，一次盖印</small><h1>让信封带上时间</h1></header>
          <div className="bs-postage-envelope" ref={envelopeRef}>
            <img src={selectedEnvelope.image} alt={selectedEnvelope.label} />
            <img className="bs-chosen-stamp" src={selectedStamp.image} alt={selectedStamp.label} />
            {stamped && <span className="bs-postmark-imprint">BEFORE SENDING<br />{new Date().toLocaleDateString("zh-CN")}<br />{Math.max(1, Math.round(((letter.writingEndedAt || Date.now()) - (letter.writingStartedAt || Date.now())) / 60000))} MIN · {letter.deletedFragments.length} REV</span>}
          </div>
          <div className="bs-stamp-strip">
            {stampChoices.map((stamp) => (
              <button key={stamp.id} className={letter.selectedStamp === stamp.id ? "is-selected" : ""} onClick={() => updateLetter({ selectedStamp: stamp.id })} title={stamp.label}>
                <img src={stamp.image} alt={stamp.label} />
              </button>
            ))}
          </div>
          <div className="bs-postmark-instruction">拖动木柄邮戳，盖在信封上</div>
          <button
            className="bs-postmark-tool"
            style={{ transform: `translate(${postmarkPos.x}px, ${postmarkPos.y}px)` }}
            onPointerDown={(event) => { event.currentTarget.setPointerCapture?.(event.pointerId); draggingRef.current = true; setDragging(true); }}
            aria-label="拖动邮戳"
          >
            <img src={`${ART}/postmark-tool.png`} alt="木柄邮戳" />
          </button>
          <button className="bs-ritual-next" disabled={!stamped} onClick={() => setPhase(3)}>邮戳已经落下</button>
        </section>
      )}

      {phase === 3 && (
        <section className="bs-package-center bs-address-table">
          <header><small>04 / 决定它以谁的名字去哪里</small><h1>写下信封背面的去向</h1></header>
          <div className="bs-address-sheet">
            <fieldset><legend>署名方式</legend>{identityChoices.map((choice) => <label key={choice.id}><input type="radio" name="identity" checked={letter.senderIdentityType === choice.id} onChange={() => updateLetter({ senderIdentityType: choice.id })} /><span>{choice.label}</span></label>)}</fieldset>
            {letter.senderIdentityType !== "anonymous" && <input className="bs-address-input" value={letter.senderIdentity} onChange={(event) => updateLetter({ senderIdentity: event.target.value })} placeholder="写下名字、首字母或关系" />}
            <fieldset><legend>这封信的去向</legend>{destinationChoices.map((choice) => <label key={choice.id}><input type="radio" name="destinationType" checked={letter.destinationType === choice.id} onChange={() => updateLetter({ destinationType: choice.id, publicArchivePermission: choice.id === "public" })} /><span>{choice.label}<small>{choice.note}</small></span></label>)}</fieldset>
            <div className="bs-route-address"><label>从<input value={letter.origin} onChange={(event) => updateLetter({ origin: event.target.value })} /></label><label>寄往<input value={letter.destination} onChange={(event) => updateLetter({ destination: event.target.value })} /></label></div>
            {letter.destinationType === "recipient" && <input className="bs-address-input" type="email" value={letter.recipientEmail} onChange={(event) => updateLetter({ recipientEmail: event.target.value })} placeholder="收件人邮箱（演示中不会发送）" />}
          </div>
          <button className="bs-ritual-next" onClick={onComplete}>封好这封信</button>
        </section>
      )}
    </main>
  );
}
