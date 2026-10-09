import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Mail, Send } from 'lucide-react';
import gsap from 'gsap';
import { useI18n } from '../i18n/Language';
import { idFor } from '../trace/letterSession';
import '../stamp-send-scene.css';

const envelopes = [
  { id: 'peach', label: ['蜜桃粉', 'Peach'], color: '#e8aea6' },
  { id: 'sage', label: ['鼠尾草绿', 'Sage'], color: '#afc0ad' },
  { id: 'blue', label: ['雾蓝', 'Mist blue'], color: '#adc8d2' },
  { id: 'oat', label: ['燕麦色', 'Oat'], color: '#dac8a3' },
];
const stamps = [
  { id: 'garden', label: ['花园', 'Garden'], color: '#d9989b' },
  { id: 'pond', label: ['池塘', 'Pond'], color: '#95b8bd' },
  { id: 'sun', label: ['晨光', 'Morning'], color: '#d5ad76' },
  { id: 'leaf', label: ['叶子', 'Leaf'], color: '#9fb88c' },
];

function Envelope({ tone, stamped, recipient, compact = false, targetRef, className = '' }) {
  const selected = envelopes.find(item => item.id === tone) || envelopes[0];
  return <div ref={targetRef} className={`send-envelope ${compact ? 'is-compact' : ''} ${className}`} style={{ '--envelope': selected.color }}>
    <div className="send-envelope-flap" />
    <div className="send-envelope-face" />
    <div className="send-envelope-fold send-envelope-fold-left" />
    <div className="send-envelope-fold send-envelope-fold-right" />
    {recipient && <p className="send-envelope-recipient">{recipient}</p>}
    {stamped && <div className="send-envelope-stamp" data-stamp={stamped}><span>✦</span><small>{stamps.find(item => item.id === stamped)?.label[1] || 'Post'}</small></div>}
  </div>;
}

function LetterPaper({ letter, paperRef, packed = false }) {
  const text = letter.finalText?.trim() || '...';
  return <article ref={paperRef} className={`send-letter-paper ${packed ? 'is-packed' : ''}`} aria-label="Written letter">
    <p className="send-letter-to">{letter.recipient ? `To ${letter.recipient},` : 'To someone,'}</p>
    <p className="send-letter-copy">{text}</p>
    <span className="send-letter-fold first" /><span className="send-letter-fold second" />
  </article>;
}

function StepControl({ stage, setStage, canAdvance, onAdvance, sent, en }) {
  const labels = en ? ['Envelope', 'Stamp', 'Address', 'Send'] : ['装信', '贴票', '收件信息', '寄出'];
  return <footer className="send-flow-controls">
    <div className="send-flow-steps" aria-label={en ? 'Delivery steps' : '寄信步骤'}>{labels.map((label, index) => <span key={label} data-state={index + 1 === stage ? 'current' : index + 1 < stage || sent ? 'complete' : 'future'}><b>{index + 1 < stage || sent ? <Check size={12} strokeWidth={2.2} /> : index + 1}</b>{label}</span>)}</div>
    <div className="send-flow-actions">
      {stage > 1 && !sent && <button className="send-flow-back" onClick={() => setStage(value => value - 1)}><ArrowLeft size={17} />{en ? 'Back' : '返回'}</button>}
      {!sent && stage === 2 && <button className="send-flow-next" disabled={!canAdvance} onClick={onAdvance}>{en ? 'Next' : '下一步'}<ArrowRight size={17} /></button>}
    </div>
  </footer>;
}

export function StampSendScene({ letter, setLetter, active, next }) {
  const { language } = useI18n();
  const en = language === 'en';
  const paperRef = useRef(null), envelopeRef = useRef(null), deliveryRef = useRef(null), motion = useRef(null), dragging = useRef(null);
  const initialStage = useMemo(() => letter.sentAt ? 4 : letter.deliveryEmail && letter.deliveryRecipient ? 4 : letter.stampAppliedAt ? 3 : letter.packedAt ? 2 : 1, []);
  const [stage, setStage] = useState(initialStage);
  const [tone, setTone] = useState(letter.selectedEnvelope || 'peach');
  const [hoveredTone, setHoveredTone] = useState(null);
  const [packing, setPacking] = useState(false);
  const [stamp, setStamp] = useState(letter.stampId?.replace('send-flow-stamp-', '') || null);
  const [dragStamp, setDragStamp] = useState(null);
  const [sent, setSent] = useState(Boolean(letter.sentAt));
  const [recipient, setRecipient] = useState(letter.deliveryRecipient || letter.recipient || '');
  const [email, setEmail] = useState(letter.deliveryEmail || '');
  const emailValid = /^\S+@\S+\.\S+$/.test(email.trim());

  useEffect(() => () => motion.current?.kill(), []);
  function persist(patch) { setLetter(current => ({ ...current, ...patch })); }
  function chooseEnvelope(id) {
    if (packing || sent) return;
    setTone(id);
    // The selected envelope is also the destination for the letter. Wait for
    // React to attach its ref before starting the physical packing motion.
    requestAnimationFrame(() => insertLetter(id));
  }
  function insertLetter(selectedTone = tone) {
    if (!active || packing || sent || !paperRef.current || !envelopeRef.current) return;
    setPacking(true);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const paperBox = paperRef.current.getBoundingClientRect();
    const envelopeBox = envelopeRef.current.getBoundingClientRect();
    const x = envelopeBox.left + envelopeBox.width / 2 - (paperBox.left + paperBox.width / 2);
    const y = envelopeBox.top + envelopeBox.height / 2 - (paperBox.top + paperBox.height / 2);
    motion.current = gsap.timeline({ defaults: { ease: 'power2.inOut' }, onComplete: () => {
      persist({ selectedEnvelope: selectedTone, packedAt: Date.now(), letterFolded: true, letterInserted: true, stampAppliedAt: null, stampId: null, stampPosition: null, deliveryRecipient: '', deliveryEmail: '', sentAt: null, scheduledDeliveryAt: null });
      setRecipient(''); setEmail(''); setStamp(null); setStage(2); setPacking(false);
    } }).to(paperRef.current, { scaleY: .58, rotation: -.8, duration: reduce ? .01 : .32 }).to(paperRef.current, { scaleX: .62, y: 12, duration: reduce ? .01 : .26 }).to(paperRef.current, { x, y, scale: .3, opacity: .2, duration: reduce ? .01 : .56 }).to(envelopeRef.current, { y: -8, rotation: -.5, duration: reduce ? .01 : .18 }, '<.24').to(envelopeRef.current, { y: 0, rotation: 0, duration: reduce ? .01 : .28 });
  }
  function applyStamp(id) { if (active && !sent) { setStamp(id); persist({ stampId: `send-flow-stamp-${id}`, stampAppliedAt: Date.now(), stampPosition: { x: 78, y: 17, rotation: -2 } }); } }
  function startDrag(event, id) { if (!active || sent || event.button !== 0) return; event.currentTarget.setPointerCapture?.(event.pointerId); dragging.current = { id }; setDragStamp({ id, x: event.clientX, y: event.clientY }); }
  function moveDrag(event) { if (dragging.current) setDragStamp({ id: dragging.current.id, x: event.clientX, y: event.clientY }); }
  function finishDrag(event) { const current = dragging.current; if (!current) return; dragging.current = null; const target = envelopeRef.current?.getBoundingClientRect(); const dropped = target && event.clientX >= target.left && event.clientX <= target.right && event.clientY >= target.top && event.clientY <= target.bottom; if (dropped) applyStamp(current.id); setDragStamp(null); }
  function confirmRecipient() { if (recipient.trim() && emailValid) { persist({ deliveryRecipient: recipient.trim(), deliveryEmail: email.trim(), deliveryMode: 'email', sentAt: null, scheduledDeliveryAt: null }); setStage(4); } }
  function sendLetter() {
    if (!active || !stamp || !recipient.trim() || !emailValid || sent || !envelopeRef.current) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const source = envelopeRef.current.getBoundingClientRect(), slot = deliveryRef.current?.getBoundingClientRect();
    const x = slot ? slot.left + slot.width / 2 - (source.left + source.width / 2) : 360;
    const y = slot ? slot.top + slot.height / 2 - (source.top + source.height / 2) : -210;
    motion.current = gsap.timeline({ defaults: { ease: 'power2.inOut' }, onComplete: () => { const now = Date.now(); persist({ sentAt: now, scheduledDeliveryAt: now + 12000, events: [...letter.events, { id: idFor('send'), type: 'send', timestamp: now, newText: letter.finalText, tokenIds: letter.characterIds }] }); setSent(true); } }).to(envelopeRef.current, { y: -12, rotation: -.8, duration: reduce ? .01 : .25 }).to(envelopeRef.current, { x, y, scale: .34, rotation: 1.2, duration: reduce ? .01 : .95 }).to(envelopeRef.current, { opacity: 0, duration: reduce ? .01 : .2 });
  }
  const canAdvance = stage === 1 ? Boolean(tone) && !packing : stage === 2 ? Boolean(stamp) : false;
  const heading = en ? ['Choose an envelope', 'Choose a stamp', 'Where should it go?', 'One last look'][stage - 1] : ['选择一个信封', '贴上一枚邮票', '这封信要寄给谁？', '再看一眼'][stage - 1];

  return <section className="send-flow-scene" data-stage={stage} data-sent={sent}>
    <img className="send-flow-background" src="/assets/send-flow/desktop-background.png" alt="" draggable={false} />
    <div className="send-flow-wash" />
    <div className="send-flow-content">
      <header className="send-flow-heading"><h1>{heading}</h1></header>
      {stage === 1 && <div className="send-flow-stage send-flow-pack"><div className="send-flow-paper-zone"><LetterPaper letter={letter} paperRef={paperRef} packed={packing} /></div><div className={`send-flow-choice-zone ${hoveredTone ? 'has-hover' : ''}`}><div className="send-flow-envelope-choice-list">{envelopes.map(item => <button key={item.id} className={`${tone === item.id ? 'is-selected' : ''} ${hoveredTone === item.id ? 'is-hovered' : ''}`} onPointerEnter={() => setHoveredTone(item.id)} onPointerLeave={() => setHoveredTone(null)} onFocus={() => setHoveredTone(item.id)} onBlur={() => setHoveredTone(null)} onClick={() => chooseEnvelope(item.id)} disabled={packing} aria-pressed={tone === item.id}><Envelope tone={item.id} compact targetRef={tone === item.id ? envelopeRef : undefined} /><span>{en ? item.label[1] : item.label[0]}</span></button>)}</div><p className="send-flow-choice-hint">{en ? 'Choose an envelope to fold your letter inside.' : '选择一个信封，信纸会自己折好放进去。'}</p></div></div>}
      {stage === 2 && <div className="send-flow-stage send-flow-stamp-stage"><aside className="send-flow-stamp-tray"><p>{en ? 'Choose a stamp' : '选择一枚邮票'}</p><div>{stamps.map(item => <button key={item.id} className={stamp === item.id ? 'is-used' : ''} onClick={() => applyStamp(item.id)} onPointerDown={event => startDrag(event, item.id)} onPointerMove={moveDrag} onPointerUp={finishDrag} onPointerCancel={finishDrag} aria-label={en ? `Use ${item.label[1]} stamp` : `使用${item.label[0]}邮票`}><span style={{ '--stamp-color': item.color }}>✦<small>{en ? item.label[1] : item.label[0]}</small></span></button>)}</div></aside><div className="send-flow-envelope-zone"><p>{en ? 'Place it on the envelope' : '把它贴在信封上'}</p><Envelope tone={tone} stamped={stamp} targetRef={envelopeRef} /></div></div>}
      {stage === 3 && <div className="send-flow-stage send-flow-address-stage"><div className="send-flow-envelope-zone"><Envelope tone={tone} stamped={stamp} recipient={recipient} targetRef={envelopeRef} /></div><form className="send-flow-address-form" onSubmit={event => { event.preventDefault(); confirmRecipient(); }}><label><span>{en ? 'Recipient name' : '收件人姓名'}</span><input value={recipient} onChange={event => setRecipient(event.target.value)} placeholder={en ? 'Write a name' : '写下名字'} maxLength="80" /></label><label><span>{en ? 'Recipient email' : '收件人邮箱'}</span><input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="Recipient email" /></label><p>{en ? 'This email will receive the letter link.' : '这封信的链接会寄往这个邮箱。'}</p><button disabled={!recipient.trim() || !emailValid} type="submit">{en ? 'Confirm address' : '确认收件信息'}<ArrowRight size={17} /></button></form></div>}
      {stage === 4 && <div className="send-flow-stage send-flow-delivery-stage"><div className="send-flow-ready-envelope"><Envelope tone={tone} stamped={stamp} recipient={recipient} targetRef={envelopeRef} /></div><div ref={deliveryRef} className="send-flow-delivery-slot"><Mail size={34} /><span>{en ? 'mail slot' : '投递口'}</span></div>{!sent ? <button className="send-flow-send" onClick={sendLetter}><Send size={18} />{en ? 'Send letter' : '寄出这封信'}</button> : <div className="send-flow-success"><Check size={22} /><p>{en ? 'Your letter has left the desk.' : '这封信已经离开书桌。'}</p><button onClick={next}>{en ? 'Continue' : '继续'}<ArrowRight size={17} /></button></div>}</div>}
      {dragStamp && <div className="send-flow-drag-stamp" style={{ left: dragStamp.x, top: dragStamp.y, '--stamp-color': stamps.find(item => item.id === dragStamp.id)?.color }}>✦</div>}
      <StepControl stage={stage} setStage={setStage} canAdvance={canAdvance} onAdvance={() => setStage(value => value + 1)} sent={sent} en={en} />
    </div>
  </section>;
}
