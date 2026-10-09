import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ArrowRight, BookOpen, Feather, Mail } from 'lucide-react';
import { useI18n } from '../i18n/Language';
import { languageText } from '../data/journey.mjs';
import { postOfficeAssets } from '../data/postOffice';
import { HomeArtwork } from './HomeArtwork';
import '../post-office.css';
import '../archive-rooms.css';
import '../archive-drawers.css';

export function PostalButton({ children, className = '', ...props }) {
  return <button className={`postal-button ${className}`} {...props}>{children}</button>;
}

export function PostOfficeExterior({ active, enter }) {
  return <HomeArtwork active={active} enter={enter} />;
}

export function PostOfficeInterior({ active, bureau, write }) {
  const { language } = useI18n(), en = language === 'en';
  const [line, setLine] = useState(0), [looking, setLooking] = useState(false);
  const dialogue = useRef(null);
  const lines = [['你来啦。', 'Hello there.'], ['今天，想来做些什么？', 'What brings you in today?'], ['可以看看这里，读一封信，也可以写下自己的话。', 'You can look around, read a letter, or write one of your own.']];
  useLayoutEffect(() => {
    if (!active || !dialogue.current) return;
    const tween = gsap.fromTo(dialogue.current, { opacity: .4, y: 6 }, { opacity: 1, y: 0, duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : .35 });
    return () => tween.kill();
  }, [active, line, looking]);
  return <div className="post-scene post-interior">
    <div className="post-scene-canvas">
      <img className="post-scene-background" src={postOfficeAssets.interior} alt={en ? 'A quiet cat resting on a mint-green wooden post office counter' : '猫守着薄荷绿木柜台，身后是信件与花草'} draggable={false} />
      <button className="counter-cat-hotspot" aria-label={en ? 'Talk to the cat' : '和柜台边的猫说句话'} onClick={() => { setLooking(false); setLine(0); }} />
    </div>
      {!looking && <button ref={dialogue} className="cat-dialogue" onClick={() => setLine(value => Math.min(2, value + 1))} aria-label={en ? 'Continue the conversation' : '继续听猫说话'}>
        <span data-chapter-heading tabIndex={-1}>{languageText(language, lines[line])}</span>{line < 2 && <ArrowRight aria-hidden="true" />}
      </button>}
      {line === 2 && !looking && <div className="counter-choices">
        <PostalButton className="is-rose" onClick={bureau}><Mail />{en ? 'Look for Letters' : '找一封信'}<ArrowRight /></PostalButton>
        <PostalButton onClick={write}><Feather />{en ? 'Write a Letter' : '写一封信'}<ArrowRight /></PostalButton>
        <button className="counter-looking" onClick={() => setLooking(true)}>{en ? 'Just Looking Around' : '先在这里看看'}</button>
      </div>}
      {looking && <div className="counter-choices is-exploring"><PostalButton onClick={bureau}><BookOpen />{en ? 'The letter drawers' : '去信件抽屉看看'}</PostalButton><PostalButton onClick={write}><Feather />{en ? 'A place to write' : '去书桌旁坐坐'}</PostalButton></div>}
  </div>;
}

export { AnonymousBureau, DrawerItem } from './ArchiveCabinet';
