import { forwardRef, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useI18n } from '../i18n/Language';
import { envelopeArt, EnvelopeImage } from './ArchiveRooms';
import { stamps } from './DeliveryWorktable';
import { AdministratorCharacter } from './AdministratorSystem';
import { useObjectGesture } from '../animation/useObjectGesture';
import { idFor } from '../trace/letterSession';
import { hasDeliveryAddress } from '../data/journey.mjs';

const quiet = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function DeliveryAddress({ letter, setLetter, disabled }) {
  const { language, t } = useI18n(), en = language === 'en';
  return <div className="journey-address" data-layer="interaction">
    <div className="journey-recipient-modes" role="group" aria-label={t('收件信息类型')}>
      {[['name', '名字', 'Name'], ['email', '邮箱', 'Email'], ['address', '地址', 'Address']].map(([id, zh, english]) => <button key={id} disabled={disabled} aria-pressed={(letter.deliveryMode || 'name') === id} onClick={() => setLetter(current => ({ ...current, deliveryMode: id }))}>{en ? english : zh}</button>)}
    </div>
    <label>{en ? 'To' : '寄给'}<input required disabled={disabled} aria-label={t('寄送收件信息')} type={letter.deliveryMode === 'email' ? 'email' : 'text'} value={letter.deliveryRecipient ?? letter.recipient} placeholder={letter.deliveryMode === 'email' ? 'name@example.com' : en ? 'A name is enough' : '写一个名字就好'} onChange={event => setLetter(current => ({ ...current, deliveryRecipient: event.target.value }))} /></label>
    {!hasDeliveryAddress(letter) && <small className="address-note">{en ? 'Add a recipient before posting.' : '投递前，请留下有效的收件信息。'}</small>}
  </div>;
}

export const JourneyEnvelope = forwardRef(function JourneyEnvelope({ letter, open = false, stampVisible = false, className = '', children }, ref) {
  const stamp = stamps.find(s => s.id === letter.stampId) || stamps[0];
  return <div ref={ref} className={`journey-envelope${open ? ' is-open' : ''} ${className}`}>
    <div className="journey-envelope-lining" />
    <EnvelopeImage kind={letter.envelopeKind} className="journey-envelope-front" />
    <EnvelopeImage kind={letter.envelopeKind} className="journey-envelope-lid" />
    <span className="journey-envelope-address">{letter.deliveryRecipient || letter.recipient}</span>
    {stampVisible && <img className="journey-postage" src={letter.sceneStampNumber ? `/assets/stamp-scene/stamp-${letter.sceneStampNumber}.png` : stamp.src} alt="" draggable={false} />}
    {children}
  </div>;
});

export function JourneyStamp({ letter, setLetter, active, next, onBusy }) {
  const { language: locale, t } = useI18n(), en = locale === 'en';
  const envelope = useRef(null), loose = useRef(null), target = useRef(null), timeline = useRef(null), lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const chosen = stamps.find(s => s.id === letter.stampId) || stamps[0];
  const complete = Boolean(letter.stampAppliedAt && letter.sealedAt);
  const kinds = Object.keys(envelopeArt), kind = letter.envelopeKind || 'blue';
  useEffect(() => {
    if (!active) { timeline.current?.kill(); lock.current = false; setBusy(false); onBusy(false); }
    gsap.set(loose.current, { x: 0, y: 0, autoAlpha: complete ? 0 : 1 });
    gsap.set(envelope.current, { y: 0 });
    gsap.set(envelope.current.querySelector('.journey-envelope-lid'), { rotateX: complete ? 0 : -174 });
  }, [active, complete, chosen.id]);
  useEffect(() => () => timeline.current?.kill(), []);
  function apply() {
    if (busy || lock.current || complete || !active) return;
    lock.current = true; setBusy(true); onBusy(true);
    const from = loose.current.getBoundingClientRect(), to = target.current.getBoundingClientRect();
    const x = Number(gsap.getProperty(loose.current, 'x')) + to.left - from.left;
    const y = Number(gsap.getProperty(loose.current, 'y')) + to.top - from.top;
    const lid = envelope.current.querySelector('.journey-envelope-lid');
    timeline.current = gsap.timeline({ defaults: { ease: 'sine.inOut' }, onComplete: () => {
      setLetter(current => ({ ...current, stampId: chosen.id, sealedAt: Date.now(), stampAppliedAt: Date.now() }));
      lock.current = false; setBusy(false); onBusy(false);
    } }).to(lid, { rotateX: 0, duration: quiet() ? .01 : .45 })
      .to(loose.current, { x, y, duration: quiet() ? .01 : .75 })
      .to(envelope.current, { y: 3, duration: quiet() ? .01 : .16 })
      .to(envelope.current, { y: 0, duration: quiet() ? .01 : .22 });
  }
  const drag = useObjectGesture(loose, target, active && !busy && !complete, apply);
  return <div className="journey-ritual journey-grid">
    <div className="ritual-copy" data-story-local>
      <h2 data-chapter-heading tabIndex={-1}>{en ? 'A stamp, a seal' : '贴邮票 / 封口'}</h2>
      <DeliveryAddress letter={letter} setLetter={setLetter} disabled={busy} />
      <div className="envelope-carousel" role="group" aria-label={t('左右浏览信封')}>
        <button className="journey-icon" aria-label={en ? 'Previous envelope' : '上一款信封'} title={en ? 'Previous envelope' : '上一款信封'} disabled={busy || complete} onClick={() => setLetter(current => ({ ...current, envelopeKind: kinds[(kinds.indexOf(kind) + kinds.length - 1) % kinds.length] }))}><ArrowLeft /></button>
        <span>{t(envelopeArt[kind]?.label || envelopeArt.blue.label)}</span>
        <button className="journey-icon" aria-label={en ? 'Next envelope' : '下一款信封'} title={en ? 'Next envelope' : '下一款信封'} disabled={busy || complete} onClick={() => setLetter(current => ({ ...current, envelopeKind: kinds[(kinds.indexOf(kind) + 1) % kinds.length] }))}><ArrowRight /></button>
      </div>
      <div className="journey-stamp-rail" role="group" aria-label={t('选择邮票')}>
        {stamps.map(stamp => <button key={stamp.id} aria-label={t(stamp.label)} aria-pressed={chosen.id === stamp.id} disabled={busy || complete} onClick={() => setLetter(current => ({ ...current, stampId: stamp.id }))}><img src={stamp.src} alt="" draggable={false} /></button>)}
      </div>
      <button className="journey-link" disabled={busy || (complete && !hasDeliveryAddress(letter))} onClick={complete ? next : apply}>{complete ? (en ? 'To the mailbox' : '去投递') : t('贴上邮票')}<ArrowRight /></button>
    </div>
    <div className="ritual-stage stamp-stage" data-story-local>
      <JourneyEnvelope ref={envelope} letter={letter} open={!complete} stampVisible={complete}>
        <button ref={target} className="journey-stamp-target" onClick={apply} disabled={busy || complete} aria-label={en ? 'Place the stamp here' : '把邮票贴在这里'}><span>{complete ? <Check /> : '+'}</span></button>
      </JourneyEnvelope>
      <button ref={loose} className="journey-loose-stamp" aria-label={en ? 'Drag or place this stamp' : '拖动或贴上这张邮票'} data-drag-item disabled={busy || complete} {...drag}><img src={chosen.src} alt="" draggable={false} /></button>
      {active && <AdministratorCharacter activity={busy ? 'packaging' : 'waiting'} className="ritual-companion" />}
    </div>
  </div>;
}

export function JourneyPost({ letter, setLetter, active, next, onBusy }) {
  const { language: locale } = useI18n(), en = locale === 'en';
  const object = useRef(null), mailbox = useRef(null), timeline = useRef(null), lock = useRef(false);
  const [busy, setBusy] = useState(false), sent = Boolean(letter.sentAt);
  useEffect(() => {
    if (!active) { timeline.current?.kill(); lock.current = false; setBusy(false); onBusy(false); }
    gsap.set(object.current, { x: 0, y: 0, scale: 1, scaleY: 1, autoAlpha: sent ? 0 : 1 });
  }, [active, sent]);
  useEffect(() => () => timeline.current?.kill(), []);
  function send() {
    if (!active || lock.current || sent || !letter.packedAt || !letter.sealedAt || !letter.stampAppliedAt || !hasDeliveryAddress(letter)) return;
    lock.current = true; setBusy(true); onBusy(true);
    const from = object.current.getBoundingClientRect(), to = mailbox.current.getBoundingClientRect();
    const x = Number(gsap.getProperty(object.current, 'x')) + to.left + to.width * .5 - from.left - from.width / 2;
    const y = Number(gsap.getProperty(object.current, 'y')) + to.top + to.height * .27 - from.top - from.height / 2;
    timeline.current = gsap.timeline({ defaults: { ease: 'sine.inOut' }, onComplete: () => {
      const now = Date.now();
      setLetter(current => ({ ...current, sentAt: now, scheduledDeliveryAt: now + 12000, events: [...current.events, { id: idFor('send'), type: 'send', timestamp: now, newText: current.finalText, tokenIds: current.characterIds }] }));
      lock.current = false; setBusy(false); onBusy(false);
    } }).to(object.current, { x, y, scale: .35, duration: quiet() ? .01 : .9 })
      .to(object.current, { scaleY: .02, autoAlpha: 0, duration: quiet() ? .01 : .45 });
  }
  const drag = useObjectGesture(object, mailbox, active && !busy && !sent, send);
  return <div className="journey-ritual journey-grid">
    <div className="ritual-copy">
      <h2 data-chapter-heading tabIndex={-1}>{en ? 'Departure' : '投递'}</h2>
      <button className="journey-link" disabled={busy} onClick={sent ? next : send}>{sent ? (en ? 'Wait with this letter' : '去邮路等一会儿') : (en ? 'Place in the mailbox' : '投进邮箱')}<ArrowRight /></button>
      <p className="ritual-caption">{en ? 'Local delivery demo. No real email is sent.' : '本地投递演示，不会发送真实邮件。'}</p>
    </div>
    <div className="ritual-stage post-stage" data-story-local>
      <button ref={object} className="journey-mail-to-send" disabled={busy || sent} aria-label={en ? 'Drag or deliver this envelope' : '拖动或投递这封信'} data-drag-item {...drag}><JourneyEnvelope letter={letter} stampVisible /></button>
      <button ref={mailbox} className="journey-mailbox" disabled={busy || sent} onClick={send} aria-label={en ? 'Place in the mailbox' : '投进邮箱'}><img src="/assets/home-stage/mailbox.png" alt="" draggable={false} /></button>
      {sent && <div className="journey-postmark"><span>{en ? 'ENTRUSTED' : '已交给邮路'}</span><time>{new Date(letter.sentAt).toLocaleDateString(locale === 'en' ? 'en-GB' : 'zh-CN')}</time></div>}
      {active && <AdministratorCharacter activity={busy ? 'sending' : 'waiting'} className="ritual-companion" />}
    </div>
  </div>;
}
