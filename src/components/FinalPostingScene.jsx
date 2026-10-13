import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useI18n } from '../i18n/Language';
import '../posting-scene.css';

const mailbox = `${import.meta.env.BASE_URL}assets/posting/mailbox-final.png`;

export function FinalPostingScene({ active, sent = false, envelopeId, children, onPosted, next }) {
  const { language } = useI18n(), en = language === 'en';
  const scene = useRef(null), artboard = useRef(null), envelope = useRef(null), hand = useRef(null);
  const slot = useRef(null), prompt = useRef(null), motion = useRef(null), idle = useRef(null), entry = useRef(null);
  const lock = useRef(false);
  const [phase, setPhase] = useState(sent ? 'sent' : 'ready');

  useEffect(() => {
    motion.current?.kill();
    idle.current?.kill();
    entry.current?.kill();
    lock.current = false;
    setPhase(sent ? 'sent' : 'ready');
    gsap.set(scene.current.querySelectorAll('.posting-mailbox'), { clearProps: 'transform' });
    if (!active || sent || !envelope.current) return;
    gsap.set(envelope.current, { clearProps: 'transform,left,top,opacity,zIndex' });
    gsap.set(hand.current, { clearProps: 'transform,opacity' });
    gsap.set(prompt.current, { opacity: 1 });
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced) {
      entry.current = gsap.fromTo(envelope.current, { opacity: 0 }, { opacity: 1, duration: .45, ease: 'sine.out' });
      idle.current = gsap.to(hand.current, { y: -3, rotation: .5, duration: 3.2, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    }
    return () => {
      motion.current?.kill();
      idle.current?.kill();
      entry.current?.kill();
    };
  }, [active, sent, envelopeId]);

  function postLetter() {
    if (!active || sent || !children || lock.current || phase !== 'ready') return;
    lock.current = true;
    setPhase('approaching');
    idle.current?.kill();
    entry.current?.kill();
    const mail = envelope.current, board = artboard.current, opening = slot.current;
    const from = mail.getBoundingClientRect(), frame = board.getBoundingClientRect(), mouth = opening.getBoundingClientRect();
    const scale = Math.min(.88, mouth.width * .88 / from.width);
    const tilt = 42;
    const projectedHeight = mail.offsetHeight * scale * Math.cos(tilt * Math.PI / 180);
    const mouthY = mouth.top + mouth.height * .68;
    const x = (mouth.left + mouth.width / 2 - frame.left) / frame.width * 100;
    const contactY = (mouthY + projectedHeight / 2 - frame.top) / frame.height * 100;
    const insideY = (mouthY - projectedHeight / 2 - frame.height * .025 - frame.top) / frame.height * 100;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = seconds => reduced ? .01 : seconds;

    motion.current = gsap.timeline({ defaults: { ease: 'sine.inOut' }, onComplete: () => {
      setPhase('sent');
      onPosted?.();
    } })
      .set(mail, { opacity: 1, transformPerspective: 1600, xPercent: -50, yPercent: -50, x: 0, y: 0 })
      .to(hand.current, { y: 0, rotation: 0, duration: duration(.2) }, 0)
      .to(prompt.current, { opacity: 0, duration: duration(.25) }, 0)
      .to(mail, { y: -12, rotation: -1.5, duration: duration(.32) }, 0)
      .to(mail, { left: `${x}%`, top: `${contactY}%`, y: 0, scale, rotation: 0, rotationX: tilt, duration: duration(.95), ease: 'power2.inOut' })
      // Push upward through the slot; the upper rim hides the entering edge.
      .call(() => setPhase('inserting'))
      .set(mail, { zIndex: 2 })
      .to(mail, { top: `${insideY}%`, duration: duration(.9), ease: 'power1.inOut' })
      .call(() => setPhase('settling'))
      .to(scene.current.querySelectorAll('.posting-mailbox'), { keyframes: [
        { x: -1.2, rotation: -.08 }, { x: .7, rotation: .05 }, { x: 0, rotation: 0 },
      ], transformOrigin: '50% 70%', duration: duration(.48), ease: 'sine.out' });
  }

  return <div ref={scene} className="posting-scene" data-phase={phase} data-envelope-id={envelopeId}>
    <div ref={artboard} className="posting-artboard">
      <img className="posting-mailbox posting-mailbox-base" src={mailbox} alt="" draggable={false} />
      <span ref={slot} className="posting-slot" aria-hidden="true" />
      {children && <button ref={envelope} type="button" className="posting-envelope" disabled={!active || sent || phase !== 'ready'}
        onClick={postLetter} aria-label={en ? 'Place your envelope in the mailbox' : '把这封信投入邮箱'}>
        <span ref={hand} className="posting-envelope-hand">{children}</span>
      </button>}
      <img className="posting-mailbox posting-mailbox-front" src={mailbox} alt="" draggable={false} />
    </div>
    {children && <p ref={prompt} className="posting-prompt">{en ? 'Touch your envelope to send it' : '轻触信封，把它交给邮路'}</p>}
    <div className="posting-success" role="status" aria-live="polite" aria-hidden={phase !== 'sent'}>
      <p>{en ? 'Letter sent' : '信已寄出'}</p>
      <button type="button" onClick={next} disabled={!active || phase !== 'sent'}>{en ? 'Return to the post office' : '返回邮局'}</button>
    </div>
  </div>;
}
