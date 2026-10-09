import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useI18n } from '../i18n/Language';
import '../posting-scene.css';

const mailbox = '/assets/posting/mailbox-closeup.png';
const sealedEnvelope = '/assets/posting/sealed-envelope.png';

export function JourneyWaiting({ active, letter, next }) {
  const { language } = useI18n(), en = language === 'en';
  const scene = useRef(null), envelope = useRef(null), slot = useRef(null), mailboxArt = useRef(null), prompt = useRef(null), lock = useRef(false), motion = useRef(null);
  const [phase, setPhase] = useState('ready');
  const sent = Boolean(letter.sentAt);

  useEffect(() => {
    if (!active) return;
    setPhase('ready');
    lock.current = false;
    motion.current?.kill();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    gsap.set(envelope.current, { clearProps: 'transform,opacity,visibility,zIndex' });
    gsap.set(scene.current?.querySelector('.posting-mailbox-front'), { opacity: 0 });
    if (!reduced) gsap.fromTo([mailboxArt.current, envelope.current], { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .75, stagger: .12, ease: 'sine.out' });
    return () => motion.current?.kill();
  }, [active, letter.sentAt]);

  function postLetter() {
    if (!active || !sent || lock.current || phase !== 'ready') return;
    lock.current = true;
    setPhase('posting');
    const mail = envelope.current, opening = slot.current, front = scene.current.querySelector('.posting-mailbox-front');
    const from = mail.getBoundingClientRect(), to = opening.getBoundingClientRect();
    const scale = Math.min(.82, (to.width * .9) / from.width);
    const x = to.left + to.width / 2 - (from.left + from.width / 2);
    const contactY = to.top + to.height * .18 - from.top;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      gsap.set(prompt.current, { opacity: 0 });
      gsap.set(mail, { opacity: 0 });
      setPhase('sent');
      return;
    }
    motion.current = gsap.timeline({ defaults: { ease: 'sine.inOut' }, onComplete: () => setPhase('sent') })
      .to(prompt.current, { opacity: 0, duration: .24 }, 0)
      .to(mail, { y: -10, rotate: -1.2, duration: .34 }, 0)
      .to(mail, { x, y: contactY, scale, rotate: .6, duration: .78, ease: 'power2.inOut' }, .3)
      .set(mail, { zIndex: 2 })
      .set(front, { opacity: 1 })
      .to(mail, { y: contactY + from.height * scale * 1.05, rotate: -.35, duration: .72, ease: 'power1.in' })
      .to(mailboxArt.current, { keyframes: [{ rotate: -.45, x: -2 }, { rotate: .35, x: 1 }, { rotate: 0, x: 0 }], transformOrigin: '50% 72%', duration: .58, ease: 'sine.out' }, '-=.12');
  }

  return <div ref={scene} className="posting-scene" data-phase={phase}>
    <div ref={mailboxArt} className="posting-artboard" aria-hidden="true">
      <img className="posting-mailbox posting-mailbox-base" src={mailbox} alt="" draggable={false} />
      <span ref={slot} className="posting-slot" />
    </div>
    <button ref={envelope} className="posting-envelope" disabled={!active || !sent || phase !== 'ready'} onClick={postLetter} aria-label={en ? 'Touch the envelope to post this letter' : '轻触信封，寄出这封信'}>
      <img src={sealedEnvelope} alt={en ? 'A sealed peach envelope' : '一封封好的浅蜜桃粉信封'} draggable={false} />
    </button>
    <div className="posting-artboard posting-front-artboard" aria-hidden="true">
      <img className="posting-mailbox posting-mailbox-front" src={mailbox} alt="" draggable={false} />
    </div>
    <p ref={prompt} className="posting-prompt">{en ? 'Touch the envelope to send this letter' : '轻触信封，寄出这封信'}</p>
    <div className="posting-success" role="status" aria-live="polite">
      <p>{en ? 'Your letter has been sent' : '信已寄出'}</p>
      <button onClick={next}>{en ? 'Return to the post office' : '返回邮局'}</button>
      <small>{en ? 'Local demonstration only. No real message was delivered.' : '这是本地演示，不会发送真实邮件。'}</small>
    </div>
  </div>;
}
