import { useLayoutEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, X } from 'lucide-react';
import { useI18n } from '../i18n/Language';
import { useLetterReplay } from '../animation/useLetterReplay';
import { LetterTraces } from './LivingLetter';
import { DeletionStitch, EmbroideryText } from './EmbroideryText';

export function SentLetterMemory({ letter }) {
  const { language } = useI18n(), en = language === 'en';
  const [open, setOpen] = useState(false);
  const trigger = useRef(null), closeButton = useRef(null), surface = useRef(null);
  const replay = useLetterReplay(letter, open && Boolean(letter.sentAt));
  const textStyle = replay.frame?.textStyle || letter.textStyle || { color: '#8f5968', family: 'fine', size: 'medium' };
  const deletion = replay.frame?.type === 'deleteSequence' ? { ...replay.frame, mode: 'backside' }
    : replay.frame?.type === 'delete' && replay.frame.deletionVisual === 'unpick' ? { ...replay.frame, mode: 'unpick', duration: 190 } : null;
  useLayoutEffect(() => { if (open) closeButton.current?.focus({ preventScroll: true }); }, [open]);
  function close() { setOpen(false); requestAnimationFrame(() => trigger.current?.focus({ preventScroll: true })); }
  if (!letter.sentAt) return null;
  return <div className="sent-letter-memory" data-story-local>
    <button ref={trigger} className="journey-link" onClick={() => setOpen(true)}>{en ? 'Revisit the sent letter' : '回看寄出的信'}</button>
    {open && <section className="sent-memory-paper" aria-label={en ? 'Sent letter history' : '寄出记录'} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); close(); } }}>
      <header><h2>{en ? 'Before it was sent' : '在这封信寄出之前'}</h2><button ref={closeButton} className="journey-icon" onClick={close} aria-label={en ? 'Close sent letter history' : '收起寄出记录'} title={en ? 'Close' : '收起'}><X /></button></header>
      <div className="sent-memory-scroll">
        <p>{letter.recipient}</p>
        <div className="letter-editing-area"><div ref={surface} className={`living-letter-text receiver-replay-text${replay.content ? ' is-embroidered' : ''}`} style={{ '--active-thread': textStyle.color }}>
          {replay.content}
          <EmbroideryText className="receiver-replay-embroidery" text={replay.content} tokenIds={replay.frame?.tokenIds} style={textStyle}
            fresh={replay.frame?.added ? { start: replay.frame.position || 0, end: (replay.frame.position || 0) + replay.frame.added.length, key: replay.frame.id, duration: 165 } : null} />
          {deletion && <DeletionStitch effect={deletion} position={replay.frame?.linePosition ? { x: replay.frame.linePosition.x, y: replay.frame.linePosition.y + 16 } : null} color={deletion.textStyle?.color || textStyle.color} style={deletion.textStyle || textStyle} />}
        </div><LetterTraces letter={replay.visibleLetter} surface={surface} interactive single /></div>
      </div>
      {replay.events.length > 0 && <div className="sent-memory-controls">
        <button className="journey-icon" onClick={() => replay.index >= replay.events.length - 1 ? replay.restart() : replay.setPlaying(value => !value)} aria-label={replay.playing ? (en ? 'Pause replay' : '暂停回放') : (en ? 'Play replay' : '播放回放')} title={replay.playing ? (en ? 'Pause' : '暂停') : (en ? 'Play' : '播放')}>{replay.playing ? <Pause /> : <Play />}</button>
        <input type="range" aria-label={en ? 'Writing history' : '书写过程'} min={0} max={replay.events.length} value={replay.index + 1} onChange={event => { replay.setPlaying(false); replay.setIndex(Number(event.target.value) - 1); }} />
        <button className="journey-icon" onClick={replay.restart} aria-label={en ? 'Replay from the beginning' : '从头回放'} title={en ? 'Replay from the beginning' : '从头回放'}><RotateCcw /></button>
      </div>}
    </section>}
  </div>;
}
