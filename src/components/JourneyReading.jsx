import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ArrowLeft, Shuffle } from 'lucide-react';
import { useI18n } from '../i18n/Language';
import { CabinetRoom, archiveEntries } from './ArchiveRooms';
import { AdministratorCharacter } from './AdministratorSystem';
import { LetterTraces } from './LivingLetter';

export function JourneyReading({ active }) {
  const { language: locale, t } = useI18n(), en = locale === 'en';
  const [entry, setEntry] = useState(null);
  const paper = useRef(null), body = useRef(null), reveals = useRef(null);
  useLayoutEffect(() => {
    if (!active || !entry || !paper.current) return;
    const tween = gsap.fromTo(paper.current, { y: 90, clipPath: 'inset(80% 0% 0%)' }, { y: 0, clipPath: 'inset(0% 0% 0%)', duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1.1, ease: 'power2.out' });
    return () => tween.kill();
  }, [active, entry?.id]);
  return <div className={`journey-reading${entry ? ' has-letter' : ''}`} data-story-local>
    <div className="journey-reading-title"><p className="chapter-kicker">10 / {en ? 'After the journey' : '余韵'}</p><h2 data-chapter-heading tabIndex={-1}>{en ? 'Someone left these words here.' : '有人，把这些话留在这里。'}</h2></div>
    {active && !entry && <div className="journey-cabinet"><CabinetRoom embedded go={() => {}} onTakeLetter={setEntry} /></div>}
    {!entry && <button className="journey-link random-letter" onClick={() => setEntry(archiveEntries[Math.floor(Math.random() * archiveEntries.length)])}><Shuffle />{en ? 'Draw a letter' : '抽取一封信'}</button>}
    {entry && <>
      <article ref={paper} className="journey-reading-paper">
        <p className="reading-recipient">{entry.recipient}</p>
        <div className="reading-text-area"><div ref={body} className="living-letter-text">{entry.finalText}</div><div ref={reveals} className="reading-revealed-strips" />{entry.allowTraces && <LetterTraces letter={entry} surface={body} interactive revealHost={reveals} />}</div>
        <small>{t('馆藏样信 · 不署名')}</small>
      </article>
      <button className="journey-link return-letter" onClick={() => setEntry(null)}><ArrowLeft />{t('放回抽屉')}</button>
      {active && <AdministratorCharacter className="journey-reading-companion" activity="reading" />}
    </>}
  </div>;
}
