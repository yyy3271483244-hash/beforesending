import { Pause, Play, RotateCcw } from 'lucide-react';
import { formatReplayTime, replayEventLabel } from '../trace/writingReplay.mjs';
import '../writing-replay.css';

export function WritingReplayControls({ replay, en }) {
  const { timeline, time } = replay;
  return <section className="writing-replay-controls" aria-label={en ? 'Writing replay' : '书写回放'}>
    <button type="button" onClick={replay.restart} disabled={replay.preparing} title={en ? 'Replay' : '重播'} aria-label={en ? 'Replay' : '重播'}><RotateCcw /></button>
    <button type="button" onClick={replay.toggle} disabled={!timeline.duration} title={replay.playing ? (en ? 'Pause' : '暂停') : (en ? 'Play' : '播放')} aria-label={replay.playing ? (en ? 'Pause replay' : '暂停回放') : (en ? 'Play replay' : '播放回放')}>{replay.playing ? <Pause /> : <Play />}</button>
    <select aria-label={en ? 'Playback speed' : '回放速度'} value={replay.speed} onChange={event => replay.setSpeed(Number(event.target.value))}>{[.5, 1, 1.5, 2, 4].map(speed => <option key={speed} value={speed}>{speed}×</option>)}</select>
    <div className="writing-replay-thread">
      <input type="range" aria-label={en ? 'Writing timeline' : '书写时间线'} min="0" max={timeline.duration || 1} step="1" value={time}
        onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); replay.beginSeek(); }}
        onPointerUp={replay.endSeek} onPointerCancel={replay.endSeek} onLostPointerCapture={replay.endSeek}
        onChange={event => replay.seek(Number(event.target.value))} disabled={replay.preparing || !timeline.duration} />
      <div className="writing-replay-events">{timeline.frames.filter(event => ['delete', 'replace', 'pause', 'undo'].includes(event.type)).map(event => <span key={event.id || event.order} role="button" tabIndex={replay.preparing ? -1 : 0} data-event-type={event.type} style={{ left: `${timeline.duration ? event.time / timeline.duration * 100 : 0}%` }} title={replayEventLabel(event, en)} aria-label={replayEventLabel(event, en)} onClick={() => replay.seek(event.time)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); replay.seek(event.time); } }}><i aria-hidden="true" /></span>)}</div>
    </div>
    <output aria-live="off">{formatReplayTime(time)} / {formatReplayTime(timeline.duration)}</output>
    {!timeline.frames.length && <small>{en ? 'No recorded writing history for this draft.' : '这份草稿没有已记录的书写过程。'}</small>}
  </section>;
}
