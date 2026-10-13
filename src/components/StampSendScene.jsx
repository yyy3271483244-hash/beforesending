import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft } from 'lucide-react';
import gsap from 'gsap';
import { useI18n } from '../i18n/Language';
import { idFor } from '../trace/letterSession';
import { usePostageDrag } from '../animation/usePostageDrag';
import { stampPlacement } from '../animation/postageGeometry.mjs';
import fullAnimationLayout from '../data/fullAnimationLayout.json';
import { fullFrameStyle } from '../animation/fullFrameStyle.mjs';
import { envelopeAssets as envelopes, envelopeById, normalizeEnvelopeId as envelopeTone, envelopeClosingPlaybackRate } from '../data/envelopeAssets.mjs';
import { closingEnvelopeBounds, envelopeTravelTransform, envelopeTransitionTiming } from '../animation/envelopeTransition.mjs';
import { pencilTravelToLine, addressWritingFrames } from '../animation/addressPencil.mjs';
import { PostagePaperBack } from './PostagePaperBack';
import { StampButton } from './StampButton';
import { FinalPostingScene } from './FinalPostingScene';
import '../stamp-send-scene.css';

const asset = path => `${import.meta.env.BASE_URL}${path}`;
const flipAssets = {
  sage: { video: 'sage.webm', back: 'sage-last.png', geometry: fullAnimationLayout.flips.sage },
  lavender: { video: 'lavender.webm', back: 'lavender-last.png', geometry: fullAnimationLayout.flips.lavender },
  ivory: { video: 'ivory.webm', back: 'ivory-last.png', geometry: fullAnimationLayout.flips.ivory },
  rose: { video: 'rose.webm', back: 'rose-last.png', geometry: fullAnimationLayout.flips.rose },
};
const envelopeDisplay = [
  { rotation: -5, scale: 1.02 },
  { rotation: 4, scale: .96 },
  { rotation: -3, scale: 1.04 },
  { rotation: 5, scale: 1 },
  { rotation: -4, scale: .94 },
];
const stamps = [
  { id: 'garden', label: ['窗边的小猫', 'Window Cat'], color: '#d8c8ac', image: asset('assets/stamps/processed/stamp-01.png'), position: [22, 30, -12], scale: 1.04 },
  { id: 'pond', label: ['春日花枝', 'Spring Flower'], color: '#a8b08b', image: asset('assets/stamps/processed/stamp-02.png'), position: [39, 28, 8], scale: .82 },
  { id: 'sun', label: ['莓果与伙伴', 'Berry Friends'], color: '#d9aaa5', image: asset('assets/stamps/processed/stamp-03.png'), position: [61, 30, -7], scale: .94 },
  { id: 'leaf', label: ['午后小憩', 'Afternoon Rest'], color: '#cda9a1', image: asset('assets/stamps/processed/stamp-04.png'), position: [79, 33, 11], scale: .86 },
  { id: 'stamp-05', label: ['花鸟图谱', 'Bird & Blossom'], color: '#c5b992', image: asset('assets/stamps/processed/stamp-05.png'), position: [25, 51, 7], scale: .89 },
  { id: 'stamp-06', label: ['三色堇', 'Pansies'], color: '#c8a19d', image: asset('assets/stamps/processed/stamp-06.png'), position: [46, 48, -10], scale: .88 },
  { id: 'stamp-07', label: ['花园里的兔子', 'Garden Rabbit'], color: '#bcae9a', image: asset('assets/stamps/processed/stamp-07.png'), position: [64, 52, 6], scale: 1.03 },
  { id: 'stamp-08', label: ['窗里的猫', 'Cat at the Window'], color: '#a89d8d', image: asset('assets/stamps/processed/stamp-08.png'), position: [79, 57, -8], scale: .81 },
  { id: 'stamp-09', label: ['果枝与蝴蝶', 'Fruit & Butterfly'], color: '#c4b48e', image: asset('assets/stamps/processed/stamp-09.png'), position: [21, 73, -6], scale: .87 },
  { id: 'stamp-10', label: ['枝头的鸟', 'Bird on a Branch'], color: '#c9aaa2', image: asset('assets/stamps/processed/stamp-10.png'), position: [40, 73, 11], scale: .91 },
  { id: 'stamp-11', label: ['白玉兰', 'White Magnolia'], color: '#c8b9a8', image: asset('assets/stamps/processed/stamp-11.png'), position: [60, 73, -9], scale: .83 },
  { id: 'stamp-12', label: ['树下的小鼠', 'Mouse Beneath a Tree'], color: '#b89d94', image: asset('assets/stamps/processed/stamp-12.png'), position: [76, 76, 5], scale: .81 },
];

function Envelope({ tone, stamped, recipient, compact = false, targetRef, className = '', interactiveBack = false, flipped = false, flipMode, flipPlaying = false, flipVideoRef, onFlipEnd, onFlipError, onFlipPlaying, children }) {
  const selected = envelopeById(tone);
  if (!selected) return null;
  const flip = selected.flipKey ? flipAssets[selected.flipKey] : null;
  const flipRoot = 'assets/animation-full/v1/flips/';
  const geometry = selected.closedGeometry;
  const flipGeometry = flip ? { ...flip.geometry, referenceHeight: flip.geometry.referenceWidth * geometry.referenceHeight / geometry.referenceWidth } : geometry;
  const backGeometry = selected.backGeometry ? { ...selected.backGeometry, referenceHeight: selected.backGeometry.referenceWidth * geometry.referenceHeight / geometry.referenceWidth } : flipGeometry;
  const style = { '--art-ratio': `${geometry.referenceWidth} / ${geometry.referenceHeight}`, aspectRatio: `${geometry.referenceWidth} / ${geometry.referenceHeight}` };
  return <div ref={targetRef} data-envelope-id={selected.id} className={`send-envelope ${compact ? 'is-compact' : ''}${interactiveBack ? ' is-postage' : ''} ${className}`} style={style}>
    {interactiveBack
      ? <div className={`send-envelope-flip-composite${flipped ? ' is-back' : ''}${flipPlaying ? ' is-playing' : ''}${flipMode === 'css' ? ' is-css-flipping' : ''}`}>
        <img className="send-envelope-flip-still is-front" style={fullFrameStyle(geometry)} src={asset(selected.image)} alt="" draggable="false" />
        {selected.backImage
          ? <PostagePaperBack src={asset(selected.backImage)} style={fullFrameStyle(backGeometry)} />
          : <img className="send-envelope-flip-still is-back" style={fullFrameStyle(backGeometry)} src={asset(flip ? `${flipRoot}${flip.back}` : selected.image)} alt="" draggable="false" />}
        {flipVideoRef && flip && <video ref={flipVideoRef} className="send-envelope-flip-video" style={fullFrameStyle(flipGeometry)} src={asset(`${flipRoot}${flip.video}`)} muted playsInline preload="auto" onEnded={onFlipEnd} onError={onFlipError} onPlaying={onFlipPlaying} />}
        {stamped && flipped && <StampMark item={stamps.find(item => item.id === stamped)} />}
      </div>
      : <EnvelopeArtwork selected={selected} sealed />}
    {interactiveBack && flipped && children}
    {recipient && <p className="send-envelope-recipient">{recipient}</p>}
  </div>;
}

function StampMark({ item }) {
  if (!item) return null;
  return <div className="send-envelope-stamp" data-stamp={item.id} style={{ '--stamp-color': item.color, '--attached-left': `${stampPlacement.left * 100}%`, '--attached-top': `${stampPlacement.top * 100}%`, '--attached-width': `${stampPlacement.width * 100}%`, '--attached-rotation': `${stampPlacement.rotation}deg` }}>
    {item.image ? <img src={item.image} alt="" draggable="false" /> : <><span>✦</span><small>{item.label[1]}</small></>}
  </div>;
}

function PostingEnvelope({ letter }) {
  return <Envelope tone={letter.selectedEnvelope} compact className="is-posting" />;
}

function EnvelopeArtwork({ selected, sealed = false }) {
  return <div className="send-envelope-media-frame" style={fullFrameStyle(sealed ? selected.closedGeometry : selected.openGeometry)} aria-hidden="true">
    <img src={asset(sealed ? selected.image : selected.openImage)} alt="" draggable="false" />
  </div>;
}

function LetterPaper({ letter, packed = false, showContent = true }) {
  const text = letter.finalText?.trim() || '...';
  return <article className={`send-letter-paper ${packed ? 'is-packed' : ''}`} aria-label="Written letter">
    <img className="send-letter-art" src={asset('assets/envelope/letter-card.png')} alt="" draggable="false" />
    {!packed && showContent && <div className="send-letter-content">
      <p className="send-letter-to">{letter.recipient ? `To ${letter.recipient},` : 'To someone,'}</p>
      <p className="send-letter-copy">{text}</p>
    </div>}
  </article>;
}

function EnvelopeSelection({ active, hovered, selected, onHover, onChoose }) {
  return <div className={`send-flow-selection${hovered ? ' has-hover' : ''}`}>
    <div className="send-flow-envelope-choice-list">
      {envelopes.map((item, index) => {
        const display = envelopeDisplay[index];
        return <button key={item.id} type="button"
        data-envelope-id={item.id} className={`send-flow-envelope-choice${hovered === item.id ? ' is-hovered' : ''}${selected === item.id ? ' is-picked' : ''}`}
        style={{ '--env-tilt': `${display.rotation}deg`, '--env-scale': display.scale, '--choice-order': index }}
        onMouseEnter={() => onHover(item.id)} onMouseLeave={() => onHover(null)} onFocus={() => onHover(item.id)} onBlur={() => onHover(null)}
        onClick={() => onChoose(item.id)} disabled={!active} aria-label={`Envelope ${index + 1}`}>
        <EnvelopeArtwork selected={item} />
      </button>;
      })}
    </div>
  </div>;
}

function EnvelopeAddress({ letter, en, phase, disabled, lineRefs, promptRefs, nameRef, onChange, onSubmit }) {
  return <form className="send-envelope-address" data-address-phase={phase} onSubmit={onSubmit}>
    <label className="send-envelope-address-name">
      <input ref={nameRef} type="text" maxLength={128} autoComplete="name" disabled={disabled}
        aria-label={en ? 'Recipient Name' : '收件人名字'} placeholder={en ? 'Recipient' : '收件人'}
        value={letter.deliveryRecipient ?? ''} onChange={event => onChange('deliveryRecipient', event.target.value)} />
      <span ref={node => { promptRefs.current[0] = node; }} className="send-envelope-address-prompt" aria-hidden="true">{en ? 'Recipient' : '收件人'}</span>
      <span ref={node => { lineRefs.current[0] = node; }} className="send-envelope-address-line" aria-hidden="true" />
    </label>
    <label className="send-envelope-address-email">
      <input type="email" maxLength={254} autoComplete="email" autoCapitalize="none" spellCheck={false} disabled={disabled}
        aria-label={en ? 'Recipient Email' : '收件人邮箱'} placeholder={en ? 'Email Address' : '邮箱地址'}
        value={letter.deliveryEmail ?? ''} onChange={event => onChange('deliveryEmail', event.target.value)} />
      <span ref={node => { promptRefs.current[1] = node; }} className="send-envelope-address-prompt" aria-hidden="true">{en ? 'Email Address' : '邮箱地址'}</span>
      <span ref={node => { lineRefs.current[1] = node; }} className="send-envelope-address-line" aria-hidden="true" />
    </label>
  </form>;
}

function StepControl({ stage, setStage, onPreviousPage, en, writing, addressReady, canContinue, onContinue }) {
  return <footer className="send-flow-controls">
    <div className="send-flow-actions">
      {stage < 3 && <button className="send-flow-back" disabled={writing} onClick={() => stage > 1 ? setStage(value => value - 1) : onPreviousPage()}><ArrowLeft size={17} />{en ? 'Previous' : '上一页'}</button>}
      {stage === 2 && addressReady && <StampButton className="postage-continue" disabled={writing || !canContinue} onClick={() => onContinue()} label={en ? 'To the mailbox' : '去寄信'} />}
    </div>
  </footer>;
}

export function StampSendScene({ letter, setLetter, active, next, onPreviousPage }) {
  const { language } = useI18n();
  const en = language === 'en';
  const envelopeRef = useRef(null), pencilRef = useRef(null), motion = useRef(null), flipVideoRef = useRef(null), closeVideoRef = useRef(null);
  const addressLineRefs = useRef([]), addressPromptRefs = useRef([]), addressNameRef = useRef(null), writingLock = useRef(false);
  const sceneRef = useRef(null), closingMediaRef = useRef(null), trayRef = useRef(null), entryMotion = useRef(null), handoffRef = useRef(null);
  const packingRef = useRef(false), closeCompletedRef = useRef(false);
  const closingSelectionRef = useRef(null);
  const initialStage = useMemo(() => letter.sentAt || (letter.readyToPostAt && letter.packedAt && letter.stampAppliedAt) ? 3 : letter.stampAppliedAt || letter.packedAt ? 2 : 1, []);
  const [stage, setStage] = useState(initialStage);
  const [tone, setTone] = useState(() => envelopeTone(letter.selectedEnvelope));
  const [pickedTone, setPickedTone] = useState(() => initialStage === 1 ? null : envelopeTone(letter.selectedEnvelope));
  const [envelopeFlipped, setEnvelopeFlipped] = useState(Boolean(letter.stampAppliedAt));
  const [hoveredTone, setHoveredTone] = useState(null);
  const [envelopeTransition, setEnvelopeTransition] = useState('idle');
  const packing = envelopeTransition !== 'idle';
  const [closingSelection, setClosingSelection] = useState(null);
  const [stamp, setStamp] = useState(letter.stampId?.replace('send-flow-stamp-', '') || null);
  const [focusedStamp, setFocusedStamp] = useState(null);
  const [sent, setSent] = useState(Boolean(letter.sentAt));
  const [writing, setWriting] = useState(false);
  const [addressPhase, setAddressPhase] = useState(letter.addressPreparedAt ? 'editing' : 'idle');
  const postage = usePostageDrag({ enabled: active && stage === 2 && !packing && !sent && !stamp, flipped: envelopeFlipped, envelopeRef, flipVideoRef,
    onFlipped: () => setEnvelopeFlipped(true), onAttach: applyStamp });
  const { dragStamp } = postage;

  useEffect(() => () => { motion.current?.kill(); entryMotion.current?.kill(); }, []);
  useEffect(() => {
    if (!active || envelopeTransition !== 'closing' || !closingSelection || !closeVideoRef.current) return;
    const video = closeVideoRef.current;
    video.currentTime = 0;
    video.defaultPlaybackRate = envelopeClosingPlaybackRate;
    video.playbackRate = envelopeClosingPlaybackRate;
    video.play().catch(() => finishEnvelopeClosing(closingSelection));
    return () => video.pause();
  }, [active, envelopeTransition, closingSelection]);
  useLayoutEffect(() => {
    if (stage !== 2 || !closingSelection || !handoffRef.current) return;
    const media = closingMediaRef.current, envelope = envelopeRef.current, tray = trayRef.current;
    if (!media || !envelope || !tray) { finishPostageEntry(closingSelection); return; }
    const { box, footprint } = handoffRef.current;
    const travel = envelopeTravelTransform(footprint, envelope.getBoundingClientRect());
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    gsap.set(media, { transformOrigin: `${footprint.left + footprint.width / 2 - box.left}px ${footprint.top + footprint.height / 2 - box.top}px` });
    gsap.set(tray, { x: 0 });
    const trayBox = tray.getBoundingClientRect();
    gsap.set(tray, { x: window.innerWidth - trayBox.left + trayBox.width / 2 + 48 });
    gsap.set(pencilRef.current, { opacity: 0 });
    entryMotion.current = gsap.timeline({ paused: !active, onComplete: () => finishPostageEntry(closingSelection) })
      .to(media, { ...travel, duration: reduce ? .01 : envelopeTransitionTiming.move, ease: 'power2.inOut' }, reduce ? 0 : envelopeTransitionTiming.sceneFade)
      .call(() => setEnvelopeTransition('tray-entering'))
      .to(tray, { x: 0, duration: reduce ? .01 : envelopeTransitionTiming.tray, ease: 'power3.out' }, `+=${reduce ? 0 : envelopeTransitionTiming.settle}`)
      .to(pencilRef.current, { opacity: 1, duration: reduce ? .01 : .35, ease: 'sine.out' }, '<+.15');
    return () => {
      entryMotion.current?.kill();
      entryMotion.current = null;
      gsap.set([tray, pencilRef.current], { clearProps: 'transform,opacity' });
    };
  }, [stage, closingSelection]);
  useEffect(() => {
    if (active) { entryMotion.current?.resume(); motion.current?.resume(); }
    else { entryMotion.current?.pause(); motion.current?.pause(); }
  }, [active]);
  useEffect(() => {
    if (active && stage === 2 && addressPhase === 'editing') addressNameRef.current?.focus({ preventScroll: true });
  }, [active, stage, addressPhase]);
  useEffect(() => {
    if (active && stage === 2 && stamp && envelopeFlipped && !packing && !sent && addressPhase === 'idle') startPencilWriting();
  }, [active, stage, stamp, envelopeFlipped, packing, sent, addressPhase]);
  function persist(patch) { setLetter(current => ({ ...current, ...patch })); }
  function chooseEnvelope(id) {
    const envelope = envelopeById(id);
    if (!active || !envelope || packingRef.current || sent) return;
    const selection = { envelope };
    closingSelectionRef.current = selection;
    setClosingSelection(selection);
    packingRef.current = true;
    closeCompletedRef.current = false;
    setTone(id);
    setPickedTone(id);
    persist({ selectedEnvelope: id, packedAt: null, letterFolded: false, letterInserted: false, stampAppliedAt: null, stampId: null, stampPosition: null, deliveryRecipient: '', deliveryEmail: '', addressPreparedAt: null, readyToPostAt: null, sentAt: null, scheduledDeliveryAt: null });
    setAddressPhase('idle');
    setHoveredTone(null);
    setFocusedStamp(null);
    setEnvelopeTransition('closing');
  }
  function finishEnvelopeClosing(selection) {
    if (!active || !selection || closingSelectionRef.current !== selection || closeCompletedRef.current || !packingRef.current) return;
    closeCompletedRef.current = true;
    const media = closingMediaRef.current;
    if (media) {
      const box = media.getBoundingClientRect(), scene = sceneRef.current.getBoundingClientRect();
      handoffRef.current = { box, footprint: closingEnvelopeBounds(box, selection.envelope.closedGeometry) };
      // Freeze the current canvas position before mounting the postage layout.
      gsap.set(media, { position: 'absolute', left: box.left - scene.left, top: box.top - scene.top, width: box.width, height: box.height, autoRound: false });
    }
    persist({ selectedEnvelope: selection.envelope.id, packedAt: Date.now(), letterFolded: true, letterInserted: true, stampAppliedAt: null, stampId: null, stampPosition: null, deliveryRecipient: '', deliveryEmail: '', addressPreparedAt: null, readyToPostAt: null, sentAt: null, scheduledDeliveryAt: null });
    setStamp(null); setEnvelopeFlipped(false); setWriting(false); setSent(false);
    setEnvelopeTransition('moving');
    setStage(2);
  }
  function finishPostageEntry(selection) {
    if (!selection || closingSelectionRef.current !== selection) return;
    setEnvelopeTransition('idle'); packingRef.current = false;
    handoffRef.current = null;
    closingSelectionRef.current = null; setClosingSelection(null);
  }
  function applyStamp(id) { if (active && stage === 2 && !packingRef.current && !sent) { setStamp(id); persist({ stampId: `send-flow-stamp-${id}`, stampAppliedAt: Date.now(), stampPosition: { x: stampPlacement.left * 100, y: stampPlacement.top * 100, width: stampPlacement.width * 100, rotation: stampPlacement.rotation } }); } }
  function startPencilWriting() {
    if (!active || packingRef.current || !stamp || !envelopeFlipped || sent || writingLock.current || !pencilRef.current) return;
    if (addressPhase === 'editing') { addressNameRef.current?.focus({ preventScroll: true }); return; }
    const [nameLine, emailLine] = addressLineRefs.current;
    const [namePrompt, emailPrompt] = addressPromptRefs.current;
    const artwork = pencilRef.current.querySelector('img');
    if (!nameLine || !emailLine || !namePrompt || !emailPrompt || !artwork) return;
    writingLock.current = true;
    setWriting(true);
    setAddressPhase('approaching');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pencilBox = artwork.getBoundingClientRect();
    const textTarget = prompt => { const box = prompt.getBoundingClientRect(); return { left: box.left, top: box.top + box.height * .8 }; };
    const nameStart = pencilTravelToLine(pencilBox, textTarget(namePrompt));
    const emailStart = pencilTravelToLine(pencilBox, textTarget(emailPrompt));
    const duration = seconds => reduce ? .01 : seconds;
    motion.current?.kill();
    gsap.set([nameLine, emailLine], { scaleX: 0 });
    gsap.set([namePrompt, emailPrompt], { clipPath: 'inset(0% 100% 0% 0%)' });
    motion.current = gsap.timeline({ defaults: { ease: 'power2.inOut' }, onComplete: () => {
      writingLock.current = false;
      setWriting(false); setAddressPhase('editing');
      persist({ addressPreparedAt: Date.now() });
      gsap.set(pencilRef.current, { clearProps: 'transform' });
    } })
      .to(pencilRef.current, { ...nameStart, duration: duration(.75) })
      .call(() => setAddressPhase('name-line'))
      .to(nameLine, { scaleX: 1, duration: duration(.18), ease: 'sine.out' })
      .to(namePrompt, { clipPath: 'inset(0% 0% 0% 0%)', duration: duration(1.15), ease: 'none' })
      .to(pencilRef.current, { keyframes: addressWritingFrames(nameStart, namePrompt.offsetWidth, Array.from(namePrompt.textContent).length, duration(1.15)) }, '<')
      .to(pencilRef.current, { ...emailStart, duration: duration(.28) })
      .call(() => setAddressPhase('email-line'))
      .to(emailLine, { scaleX: 1, duration: duration(.18), ease: 'sine.out' })
      .to(emailPrompt, { clipPath: 'inset(0% 0% 0% 0%)', duration: duration(1.15), ease: 'none' })
      .to(pencilRef.current, { keyframes: addressWritingFrames(emailStart, emailPrompt.offsetWidth, Array.from(emailPrompt.textContent).length, duration(1.15)) }, '<')
      .call(() => setAddressPhase('returning'))
      .to(pencilRef.current, { x: 0, y: 0, duration: duration(.48) });
  }
  function updateAddress(field, value) {
    persist({ [field]: value, readyToPostAt: null });
  }
  function finishAddress(event) {
    event?.preventDefault();
    if (!active || packingRef.current || writingLock.current || addressPhase !== 'editing' || !stamp || !envelopeFlipped) return;
    persist({ deliveryRecipient: (letter.deliveryRecipient ?? '').trim(), deliveryEmail: (letter.deliveryEmail ?? '').trim(), readyToPostAt: Date.now() });
    setStage(3);
  }
  function finishPosting() {
    setLetter(current => {
      if (current.sentAt) return current;
      const now = Date.now();
      return { ...current, sentAt: now, scheduledDeliveryAt: now + 12000, events: [...(current.events || []), { id: idFor('send'), type: 'send', timestamp: now, newText: current.finalText, tokenIds: current.characterIds }] };
    });
    setSent(true);
  }
  const heading = stage === 3 && sent
    ? (en ? 'On its way' : '这封信已经出发')
    : stage === 2 && stamp
      ? (en ? 'Write recipient details' : '写上收件人信息')
      : (en ? ['Choose an envelope', 'Choose a stamp', 'Let the letter go'][stage - 1] : ['选择一个信封', '贴上一枚邮票', '寄出这封信'][stage - 1]);

  return <section ref={sceneRef} className="send-flow-scene" style={{ '--postage-scene-fade': `${envelopeTransitionTiming.sceneFade}s` }} data-stage={stage} data-envelope-transition={envelopeTransition} data-address-phase={addressPhase} data-postage-phase={stamp ? 'attached' : postage.phase} data-sent={sent}>
    {stage < 3 && <><img className="send-flow-background" src={asset('assets/send-flow/desktop-background.png')} alt="" draggable={false} /><div className="send-flow-wash" /></>}
    <div className="send-flow-content">
      {stage < 3 && <header className="send-flow-heading"><h1>{heading}</h1></header>}
      {stage === 1 && <div className={`send-flow-stage send-flow-pack${packing ? ' is-closing' : ''}`}>
        <div className="send-flow-paper-zone"><LetterPaper letter={letter} showContent={false} /></div>
        <EnvelopeSelection active={active && !packing} hovered={hoveredTone} selected={pickedTone} onHover={setHoveredTone} onChoose={chooseEnvelope} />
      </div>}
      {stage === 2 && <div className={`send-flow-stage send-flow-stamp-stage${stamp ? ' is-stamped' : ''}`}>
        <div className="send-flow-envelope-zone">
          <Envelope tone={tone} stamped={stamp} targetRef={envelopeRef} interactiveBack flipped={envelopeFlipped} flipMode={postage.phase === 'flipping' ? postage.flipMode : null} flipPlaying={postage.flipPlaying} flipVideoRef={flipVideoRef} onFlipEnd={postage.finishFlip} onFlipError={postage.fallbackFlip} onFlipPlaying={postage.videoPlaying}>
            <EnvelopeAddress letter={letter} en={en} phase={addressPhase} disabled={!active || writing || addressPhase !== 'editing'} lineRefs={addressLineRefs} promptRefs={addressPromptRefs} nameRef={addressNameRef} onChange={updateAddress} onSubmit={finishAddress} />
          </Envelope>
        </div>
        <div ref={trayRef} className="send-flow-stamp-tools">
        <button ref={pencilRef} className={`send-flow-pencil${writing ? ' is-writing' : ''}`} type="button" onClick={startPencilWriting} disabled={!active || packing || !stamp || !envelopeFlipped || writing || sent} aria-label={en ? 'Fill in recipient details' : '填写收件信息'} title={en ? 'Fill in recipient details' : '填写收件信息'}>
          <img src={asset('assets/stamps/pencil-blue.png')} alt="" draggable="false" />
        </button>
        <aside className={`send-flow-stamp-tray${focusedStamp || dragStamp || stamp ? ' has-focus' : ''}`}>
          <div className="send-flow-stamp-field"><img className="send-flow-stamp-tray-art" src={asset('assets/stamps/processed/stamp-tray.png')} alt="" draggable="false" />{stamps.map((item, index) => <button key={item.id}
            type="button" data-stamp-id={item.id} className={`${stamp === item.id ? 'is-used' : ''}${focusedStamp === item.id ? ' is-focused' : ''}${dragStamp?.id === item.id ? ' is-dragging' : ''}`}
            style={{ '--stamp-color': item.color, '--stamp-x': `${item.position[0]}%`, '--stamp-y': `${item.position[1]}%`, '--stamp-rotation': `${item.position[2]}deg`, '--stamp-order': index, '--stamp-scale': item.scale }}
            onPointerDown={event => { setFocusedStamp(item.id); postage.startDrag(event, item); }} onPointerMove={postage.moveDrag} onPointerUp={postage.finishDrag} onPointerCancel={postage.cancelDrag} onLostPointerCapture={postage.cancelDrag}
            aria-disabled={!active || packing || Boolean(stamp) || sent} aria-label={en ? `Drag ${item.label[1]} stamp` : `拖动${item.label[0]}邮票`}>
            <span className="send-flow-stamp-art"><img src={item.image} alt="" draggable="false" /></span>
          </button>)}</div>
        </aside>
        </div>
      </div>}
      {stage === 3 && <FinalPostingScene active={active} sent={sent} envelopeId={letter.selectedEnvelope} onPosted={finishPosting} next={next}>
        <PostingEnvelope letter={letter} />
      </FinalPostingScene>}
      {dragStamp && createPortal(<div ref={postage.ghostRef} className="send-flow-drag-stamp" aria-hidden="true" style={{ left: dragStamp.x, top: dragStamp.y, width: dragStamp.width, height: dragStamp.height }}><img src={dragStamp.image} alt="" draggable="false" /></div>, document.body)}
      <StepControl stage={stage} setStage={setStage} onPreviousPage={onPreviousPage} en={en} writing={writing || packing} addressReady={addressPhase === 'editing'} canContinue={active} onContinue={finishAddress} />
    </div>
    {closingSelection && ['closing', 'moving'].includes(envelopeTransition) && <div className="send-flow-closing-transition" data-envelope-id={closingSelection.envelope.id} role="status" aria-label={en ? 'Preparing envelope' : '正在放好信封'}>
      <div ref={closingMediaRef} className="send-flow-closing-media" data-envelope-id={closingSelection.envelope.id}>
        <video key={closingSelection.envelope.id} ref={closeVideoRef} data-envelope-id={closingSelection.envelope.id} src={asset(closingSelection.envelope.closeVideo)} muted playsInline preload="auto" onEnded={() => finishEnvelopeClosing(closingSelection)} onError={() => finishEnvelopeClosing(closingSelection)} />
        <img src={asset(closingSelection.envelope.image)} alt="" draggable="false" />
      </div>
    </div>}
  </section>;
}
