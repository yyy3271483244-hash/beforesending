import { useEffect, useRef, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { useI18n } from '../i18n/Language';
import { useHomeMotion } from '../animation/useHomeMotion';
import { useMailboxEntry } from '../animation/useMailboxEntry';
import '../mailbox-entry.css';

const homeVideo = `${import.meta.env.BASE_URL}assets/home-stage/before-sending-home-hd-v2.mp4`;
const homeTitles = ['before', 'sending'].map(name => `${import.meta.env.BASE_URL}assets/branding/${name}-embroidered.webp`);

export function HomeArtwork({ enter, active = true }) {
  const { language } = useI18n();
  const en = language === 'en';
  const root = useRef(null);
  const video = useRef(null);
  const [videoReady, setVideoReady] = useState(false);
  const [titlesReady, setTitlesReady] = useState(false);
  const entryReady = videoReady && titlesReady;
  const entrance = useMailboxEntry(root, enter);
  useHomeMotion(root, entryReady && active);

  useEffect(() => {
    let disposed = false;
    const images = homeTitles.map(src => new Promise(resolve => {
      const image = new Image();
      image.onload = () => image.decode().then(resolve, resolve);
      image.onerror = resolve;
      image.src = src;
    }));
    Promise.all(images).then(() => { if (!disposed) setTitlesReady(true); });
    return () => { disposed = true; };
  }, []);

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    if (!active || !entryReady) { element.pause(); return; }
    element.play().catch(() => {});
  }, [active, entryReady]);

  return <div ref={root} className="restored-home" data-home-video-ready={videoReady} data-home-entry-ready={entryReady}>
    <figure className="restored-home-illustration" aria-label={en ? 'Four keepers and the red postbox' : '四位管理员与中央红色邮筒'} onClick={event => {
      if (!event.target.closest('button')) entrance();
    }}>
      <div className="home-art-scroll">
        <div className="home-art-material">
          <span className="home-video-placeholder" aria-hidden="true" />
          <video ref={video} className="home-art-video" src={homeVideo} muted playsInline loop preload="auto"
            onLoadedData={() => setVideoReady(true)} onPlaying={() => setVideoReady(true)} aria-hidden="true" />
          <button className="home-mail-slot" onClick={entrance} aria-label={en ? 'Enter the letter office through the postbox' : '从投信口走进信件处'} />
        </div>
      </div>
      <div className="home-brand-scroll" aria-hidden="true">
        <div className="home-brand">
          <span className="home-title-before">{entryReady && <img src={homeTitles[0]} alt="" draggable={false} />}</span>
          <span className="home-title-sending">{entryReady && <img src={homeTitles[1]} alt="" draggable={false} />}</span>
        </div>
      </div>
      <h1 className="home-brand-sr-only">Before Sending</h1>
    </figure>
    <button className="restored-home-enter" onClick={entrance} aria-label={en ? 'Enter the letter office' : '走进信件处'}><ArrowDown aria-hidden="true" /></button>
  </div>;
}
