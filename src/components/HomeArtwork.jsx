import { useEffect, useRef, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { useI18n } from '../i18n/Language';
import { useHomeMotion } from '../animation/useHomeMotion';
import { useMailboxEntry } from '../animation/useMailboxEntry';
import '../mailbox-entry.css';

const homeVideo = '/assets/home-stage/before-sending-home-hd-v2.mp4';

export function HomeArtwork({ enter, active = true }) {
  const { language } = useI18n();
  const en = language === 'en';
  const root = useRef(null);
  const video = useRef(null);
  const [videoReady, setVideoReady] = useState(false);
  const entrance = useMailboxEntry(root, enter);
  useHomeMotion(root);

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    if (!active) { element.pause(); return; }
    element.play().catch(() => {});
  }, [active]);

  return <div ref={root} className="restored-home" data-home-video-ready={videoReady}>
    <figure className="restored-home-illustration" aria-label={en ? 'Four keepers and the red postbox' : '四位管理员与中央红色邮筒'} onClick={event => {
      if (!event.target.closest('button')) entrance();
    }}>
      <div className="home-art-scroll">
        <div className="home-art-material">
          <span className="home-video-placeholder" aria-hidden="true" />
          <video ref={video} className="home-art-video" src={homeVideo} autoPlay muted playsInline loop preload="auto"
            onLoadedData={() => setVideoReady(true)} onPlaying={() => setVideoReady(true)} aria-hidden="true" />
          <button className="home-mail-slot" onClick={entrance} aria-label={en ? 'Enter the letter office through the postbox' : '从投信口走进信件处'} />
        </div>
      </div>
      <div className="home-brand-scroll" aria-hidden="true">
        <div className="home-brand">
          <span className="home-title-before"><img src="/assets/branding/before-embroidered.webp" alt="" draggable={false} /></span>
          <span className="home-title-sending"><img src="/assets/branding/sending-embroidered.webp" alt="" draggable={false} /></span>
        </div>
      </div>
      <h1 className="home-brand-sr-only">Before Sending</h1>
    </figure>
    <button className="restored-home-enter" onClick={entrance} aria-label={en ? 'Enter the letter office' : '走进信件处'}><ArrowDown aria-hidden="true" /></button>
  </div>;
}
