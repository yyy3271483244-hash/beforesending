import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { StampButton } from './StampButton';
import gsap from 'gsap';
import { useI18n } from '../i18n/Language';
import { languageText } from '../data/journey.mjs';
import { measureCaret, useLetterSession } from '../trace/letterSession';
import { useGrowingPaper } from '../animation/useGrowingPaper';
import { useDeskPaper } from '../animation/useDeskPaper';
import { AdministratorCharacter } from './AdministratorSystem';
import { LetterTraces } from './LivingLetter';
import { useWritingReplay } from '../animation/useWritingReplay';
import { WritingReplayControls } from './WritingReplayControls';
import '../desk-paper-motion.css';
import { WritingCompanion } from './WritingCompanion';
import { Undo2 } from 'lucide-react';
import '../embroidery-writing.css';
import { EmbroideryText, DeletionStitch } from './EmbroideryText';
import { WritingNeedleVideo } from './WritingNeedleVideo';

const threadColors = ['#8f5968', '#536b59', '#53677e', '#966f4f', '#75647c', '#b08a45', '#ddd1b9', '#5f625d'];
const stitchSizes = ['small', 'medium', 'large'];

export function JourneyWriting({ letter, setLetter, workflow, dispatchWorkflow, active, next, onBusy }) {
  const { language: locale, t } = useI18n();
  const copy = (zh, en) => languageText(locale, [zh, en]);
  const editor = useRef(null), scroll = useRef(null), paper = useRef(null), stage = useRef(null), trigger = useRef(null);
  const replaySurface = useRef(null);
  const desk = useDeskPaper(stage, paper, trigger, active, onBusy);
  const reviewing = workflow === 'replay' || workflow === 'confirmed';
  const raised = active && desk.phase === 'write';
  const writing = raised && workflow === 'writing';
  const replay = useWritingReplay(letter, raised && reviewing);
  const session = useLetterSession(letter, setLetter, editor);
  const shown = letter;
  const [paste, setPaste] = useState(false);
  const [stitching, setStitching] = useState(false);
  const [stitchFresh, setStitchFresh] = useState(null);
  const [needlePoint, setNeedlePoint] = useState(null);
  const [sendReturning, setSendReturning] = useState(false);
  const [replayFresh, setReplayFresh] = useState(null);
  const [replayNeedlePoint, setReplayNeedlePoint] = useState(null);
  const [composing, setComposing] = useState(false);
  const timer = useRef(null);
  const stitchTimer = useRef(null);
  const lastStitchAt = useRef(0);
  const stitchRange = useRef(null);
  const replayEventId = useRef(null);
  const sending = useRef(null);
  const needleVideo = useRef(null);
  const wasWriting = useRef(false);
  const closing = useRef(false);
  const newlineTriggeredAt = useRef(0);
  useGrowingPaper(editor, scroll, reviewing ? replay.text : shown.finalText, writing, reviewing ? replay.index : null, 'document', reviewing ? replaySurface : null);
  useEffect(() => {
    if (!active) return;
    if (desk.phase === 'desk') {
      dispatchWorkflow({ type: 'REST' });
      setLetter(current => current.letterConfirmed
        ? { ...current, letterConfirmed: false, replayCompletedAt: null, replayConfirmedAt: null, packedAt: null, sealedAt: null, stampAppliedAt: null, sentAt: null }
        : current);
    }
    if (desk.phase === 'lifting') dispatchWorkflow({ type: 'LIFT' });
    if (desk.phase === 'write') dispatchWorkflow({ type: 'READY' });
  }, [active, desk.phase]);
  useEffect(() => {
    if (!writing) { session.suspend(); editor.current?.blur(); }
    else {
      gsap.set(stage.current.querySelector('.journey-writing-actions'), { autoAlpha: 1, y: 0 });
      setLetter(current => current.writingFinishedAt || current.letterConfirmed
        ? { ...current, writingFinishedAt: null, letterConfirmed: false, replayCompletedAt: null, replayConfirmedAt: null, packedAt: null, sealedAt: null, stampAppliedAt: null, sentAt: null }
        : current);
      editor.current?.focus({ preventScroll: true });
    }
  }, [writing]);
  useEffect(() => {
    if (writing && !wasWriting.current) needleVideo.current?.play('start');
    wasWriting.current = writing;
  }, [writing]);
  useEffect(() => () => { clearTimeout(timer.current); clearTimeout(stitchTimer.current); sending.current?.kill(); }, []);
  const textStyle = letter.textStyle || { color: '#8f5968', family: 'fine', size: 'medium' };
  const replayTextStyle = replay.event?.textStyle || textStyle;
  function updateTextStyle(patch) {
    setLetter(current => ({ ...current, textStyle: { ...textStyle, ...patch } }));
  }
  function applyWritingEffect(result) {
    if (!result) return;
    if (result.added?.includes('\n') && performance.now() - newlineTriggeredAt.current > 180) needleVideo.current?.play('newline');
    const deletionThresholdCrossed = result.visualEffect?.type === 'deleteSequence' && !result.visualEffect.continuing;
    if (deletionThresholdCrossed) needleVideo.current?.play('deletion');
    if (result.added) {
      const now = performance.now();
      const interval = now - lastStitchAt.current;
      const duration = interval && interval < 90 ? 180 : interval && interval < 180 ? 220 : 280;
      lastStitchAt.current = now;
      setStitchFresh(previous => {
        const merged = previous && now - (stitchRange.current?.lastAt || 0) < 260;
        const next = { start: merged ? previous.start : result.position, end: result.position + result.added.length,
          key: merged ? previous.key : result.id, duration };
        stitchRange.current = { ...next, lastAt: now };
        return next;
      });
      setStitching(true);
      clearTimeout(stitchTimer.current);
      stitchTimer.current = setTimeout(() => setStitching(false), duration + 180);
    }
    if (result.deleted && !result.added) {
      // Live text disappears on each edit; only the five-character sequence
      // triggers needle/companion motion and the recorded thread trace.
      setStitchFresh(null);
      stitchRange.current = null;
      setStitching(false);
      clearTimeout(stitchTimer.current);
    }
  }
  function embroider(event) {
    const result = session.change(event, event.nativeEvent?.inputType);
    applyWritingEffect(result);
  }
  function finishComposition(event) {
    setComposing(false);
    applyWritingEffect(session.compositionEnd(event));
  }
  function paperCaretPoint(index = editor.current?.selectionStart || 0, text = shown.finalText) {
    const input = editor.current, sheet = input?.closest('.journey-paper-content');
    if (!input || !sheet) return null;
    const point = measureCaret(input, text, index);
    const inputRect = input.getBoundingClientRect(), sheetRect = sheet.getBoundingClientRect();
    const lineHeight = parseFloat(getComputedStyle(input).lineHeight) || 34;
    return { x: inputRect.left - sheetRect.left + point.x, y: inputRect.top - sheetRect.top + point.y + lineHeight * .62,
      width: sheet.clientWidth, height: Math.max(sheet.clientHeight, sheet.scrollHeight) };
  }
  function effectPosition(effect) {
    const area = editor.current?.parentElement;
    if (!area || !effect?.linePosition) return null;
    const areaRect = area.getBoundingClientRect();
    const editorRect = editor.current.getBoundingClientRect();
    const style = getComputedStyle(editor.current);
    return {
      x: editorRect.left - areaRect.left + effect.linePosition.x,
      y: editorRect.top - areaRect.top + effect.linePosition.y,
    };
  }
  useLayoutEffect(() => {
    if (reviewing && !sendReturning || !raised) { setNeedlePoint(null); return; }
    let point = sendReturning ? paperCaretPoint(shown.finalText.length) : paperCaretPoint();
    if (stitchFresh) {
    const characters = editor.current?.parentElement?.querySelectorAll('.embroidered-text-layer:not(.is-replay-embroidery) [data-char-start]');
    const target = [...(characters || [])].filter(node => Number(node.dataset.charStart) >= stitchFresh.start && Number(node.dataset.charStart) < stitchFresh.end).at(-1);
      if (target) {
        const sheet = editor.current.closest('.journey-paper-content').getBoundingClientRect();
        const rect = target.getBoundingClientRect();
        point = { ...point, x: rect.right - sheet.left, y: rect.top - sheet.top + rect.height * .58 };
      }
    }
    setNeedlePoint(point);
  }, [stitchFresh, shown.finalText, reviewing, raised, sendReturning, session.caret.x, session.caret.y, session.activity]);
  useEffect(() => {
    const event = replay.event;
    if (!event || replayEventId.current === event.id) return;
    replayEventId.current = event.id;
    setReplayFresh(event.added ? { start: event.position || 0, end: (event.position || 0) + event.added.length, key: event.id, duration: Math.max(90, 260 / replay.speed) } : null);
  }, [replay.event?.id, replay.speed]);
  useLayoutEffect(() => {
    if (!reviewing || replay.preparing || !replay.text || !editor.current) { setReplayNeedlePoint(null); return; }
    let point = replay.event?.linePosition ? paperCaretPoint(replay.event.caretIndex ?? replay.event.position ?? replay.text.length, replay.text) : null;
    if (replayFresh) {
      const nodes = editor.current.parentElement?.querySelectorAll('.writing-replay-surface .embroidered-character');
      const target = [...(nodes || [])].filter(node => Number(node.dataset.charStart) >= replayFresh.start && Number(node.dataset.charStart) < replayFresh.end).at(-1);
      if (target) {
        const sheet = editor.current.closest('.journey-paper-content').getBoundingClientRect();
        const rect = target.getBoundingClientRect();
        point = { ...point, x: rect.right - sheet.left, y: rect.top - sheet.top + rect.height * .58,
          width: editor.current.closest('.journey-paper-content').clientWidth,
          height: Math.max(editor.current.closest('.journey-paper-content').clientHeight, editor.current.closest('.journey-paper-content').scrollHeight) };
      }
    }
    setReplayNeedlePoint(point);
  }, [reviewing, replay.preparing, replay.text, replay.event?.id, replayFresh]);
  useEffect(() => {
    if (workflow !== 'confirmed') return;
    onBusy(true);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    gsap.set(paper.current, { transformOrigin: '50% 50%' });
    sending.current = gsap.timeline({ defaults: { ease: 'power2.inOut' }, onComplete: () => {
      gsap.set(paper.current, { clearProps: 'transform' });
      next();
    } })
      .to(stage.current.querySelectorAll('.paper-replay-controls, .journey-writing-actions'), { autoAlpha: 0, y: -10, duration: reduced ? 0 : .18 }, 0)
      .to(paper.current, { y: 14, rotationX: 5, scale: .99, duration: reduced ? .01 : .24, ease: 'power2.in' }, 0);
    return () => sending.current?.kill();
  }, [workflow]);
  function finish() {
    if (!writing || !letter.finalText.trim() || closing.current) return;
    closing.current = true;
    session.suspend();
    setSendReturning(true);
    const started = needleVideo.current?.play('finish', () => { closing.current = false; setSendReturning(false); });
    if (!started) { closing.current = false; setSendReturning(false); }
    setLetter(current => ({ ...current, writingFinishedAt: Date.now(), letterConfirmed: false, replayCompletedAt: null, replayConfirmedAt: null }));
    dispatchWorkflow({ type: 'FINISH', hasText: true });
    requestAnimationFrame(() => {
      const scene = paper.current?.closest('.journey-section');
      if (scene) scene.scrollTo({ top: scene.scrollTop + paper.current.getBoundingClientRect().top - scene.getBoundingClientRect().top - 110, behavior: 'smooth' });
    });
  }
  function confirm() {
    if (workflow !== 'replay' || replay.preparing || !letter.finalText.trim() || closing.current) return;
    closing.current = true;
    setSendReturning(true);
    onBusy(true);
    if (replay.playing) replay.toggle();
    const started = needleVideo.current?.play('send-return', () => {
      closing.current = false;
      setSendReturning(false);
    });
    if (!started) { closing.current = false; setSendReturning(false); }
    setLetter(current => ({ ...current, replayCompletedAt: replay.completed ? Date.now() : null }));
    dispatchWorkflow({ type: 'CONFIRM', replayReady: true });
  }
  function syncNeedleToCaret() {
    const point = session.track();
    setStitchFresh(null);
    stitchRange.current = null;
    setNeedlePoint(paperCaretPoint(point.index));
  }
  function handleEditorKeyDown(event) {
    if (event.key === 'Enter' && !event.isComposing && !composing) {
      newlineTriggeredAt.current = performance.now();
      needleVideo.current?.play('newline');
    }
    if (!(event.ctrlKey || event.metaKey)) return;
    const key = event.key.toLowerCase();
    if (key === 'z' && event.shiftKey || key === 'y') { event.preventDefault(); session.redo(); }
    else if (key === 'z') { event.preventDefault(); session.undo(); }
  }
  function returnFromBackground(event) {
    if (!writing || event.target.closest('.journey-paper, button, a, input, textarea, aside, [role="button"], [data-story-local]')) return;
    putBack();
  }
  function putBack() {
    if (!writing || closing.current) return;
    closing.current = true;
    session.suspend();
    needleVideo.current?.play('finish', () => {
      closing.current = false;
      desk.close();
    });
  }
  return <div ref={stage} className="journey-writing-stage" onClick={returnFromBackground} data-desk-state={desk.phase} data-writing-mode={reviewing ? 'replay' : writing ? 'edit' : 'desk'}>
    <div className="journey-desk-art">
      <img src={`${import.meta.env.BASE_URL}assets/writing-desk/desk-empty.png`} alt={copy('淡色铅笔画书桌，线轴和纸笔静静留在两侧。', 'A pale pencil-drawn desk with thread and paper at its edges.')} draggable={false} />
    </div>
    <div className="journey-desk-shade" aria-hidden="true" />
    <div className="journey-writing journey-grid">
    <div ref={paper} className="journey-sheet-scroll journey-paper">
      <div className="long-paper-material" aria-hidden="true"><div className="paper-top" /><div className="paper-body" /><div className="paper-bottom" /></div>
      <button ref={trigger} className="journey-desk-paper-trigger" onClick={desk.open} onPointerEnter={() => desk.hover(true)} onPointerLeave={() => desk.hover(false)} onFocus={() => desk.hover(true)} onBlur={() => desk.hover(false)} disabled={desk.phase !== 'desk' || !active} aria-label={copy('拿起信纸，开始写信', 'Pick up the paper and write')} />
      <div ref={scroll} className="journey-paper-content" data-writing-detail data-story-local inert={!raised ? true : undefined} aria-hidden={!raised}>
      <WritingNeedleVideo ref={needleVideo} point={needlePoint} visible={raised && (!reviewing || sendReturning)} />
      <div className="embroidery-toolbar" aria-label={copy('刺绣文字工具', 'Embroidery text tools')}>
        <div className="embroidery-colors" role="group" aria-label={copy('线色', 'Thread color')}>{threadColors.map(color => <button key={color} type="button" className={textStyle.color === color ? 'is-selected' : ''} style={{ '--thread-color': color }} aria-label={color} aria-pressed={textStyle.color === color} onClick={() => updateTextStyle({ color })} />)}</div>
        <div className="embroidery-sizes" role="group" aria-label={copy('字号', 'Text size')}>{stitchSizes.map((size, index) => <button key={size} type="button" className={textStyle.size === size ? 'is-selected' : ''} aria-label={copy(['小','中','大'][index], ['Small','Medium','Large'][index])} aria-pressed={textStyle.size === size} onClick={() => updateTextStyle({ size })}><span style={{ fontSize: 11 + index * 3 }}>A</span></button>)}</div>
        <button type="button" className="embroidery-undo" onClick={session.undo} disabled={!session.canUndo} aria-label={copy('撤销', 'Undo')} title={copy('撤销', 'Undo')}><Undo2 aria-hidden="true" /></button>
      </div>
      <article className="journey-writing-paper">
        <label className="journey-to" style={{ '--active-thread': (reviewing ? replayTextStyle : textStyle).color }}><span className="letter-salutation">{copy('致', 'To')}</span><input disabled={!writing} aria-label={t('收信人')} value={letter.recipient} onChange={e => setLetter(current => ({ ...current, recipient: e.target.value }))} /></label>
        <div className="letter-editing-area">
          {!reviewing && !composing && <EmbroideryText text={shown.finalText} tokenIds={shown.characterIds} style={textStyle} fresh={stitchFresh} />}
          <textarea ref={editor} aria-label={t('信件正文')} data-stitch-family={textStyle.family} data-stitch-size={textStyle.size} style={{ '--active-thread': textStyle.color }} className={`${reviewing ? (replay.preparing ? 'writing-replay-fade' : 'writing-replay-editor-hidden') : shown.finalText ? 'is-embroidered' : ''}${stitching ? ' is-stitching' : ''}${composing ? ' is-composing' : ''}`} aria-hidden={reviewing} value={shown.finalText} disabled={!writing} rows={1} spellCheck={false}
            onChange={embroider} onFocus={session.focus} onBlur={session.suspend} onSelect={syncNeedleToCaret} onClick={syncNeedleToCaret}
            onCompositionStart={() => { setComposing(true); session.compositionStart(); }} onCompositionEnd={finishComposition}
            onKeyDown={handleEditorKeyDown}
            onPaste={event => { event.preventDefault(); setPaste(true); clearTimeout(timer.current); timer.current = setTimeout(() => setPaste(false), 2200); }}
            onDrop={event => event.preventDefault()} />
          {reviewing && !replay.preparing && <div className="writing-replay-surface" role="region" aria-label={copy('回放正文', 'Replay text')} data-replay-time={Math.round(replay.time)}>
            <EmbroideryText surfaceRef={replaySurface} className="is-replay-embroidery" text={replay.text} tokenIds={replay.event?.tokenIds} style={replayTextStyle} fresh={replayFresh} />
            {replay.deletion && <DeletionStitch effect={replay.deletion} position={effectPosition(replay.deletion)} color={replay.deletion.textStyle?.color || replayTextStyle.color} style={replay.deletion.textStyle || replayTextStyle} showNeedlework={false} />}
          </div>}
          {!reviewing && <LetterTraces letter={shown} surface={editor} interactive={writing} single individual pauseMarks={session.activity !== 'pausePending' && session.activity !== 'weaving'} />}
        </div>
        {paste && <p className="journey-paste-note" role="status">{t('这张纸，留给你亲手写。')}</p>}
      </article>
      </div>
      <div className="paper-bottom-details" data-writing-detail aria-hidden={!raised}>
      </div>
    </div>
    <WritingCompanion paper={paper} visible={raised} writing={active && (desk.phase === 'lifting' || writing)} />
    {reviewing && <div className="paper-replay-controls" data-story-local><WritingReplayControls replay={replay} en={locale === 'en'} /></div>}
    <div className="journey-writing-actions" data-story-local data-writing-detail inert={!raised ? true : undefined}>
      {!reviewing && <StampButton size="small" className="return-to-desk" onClick={putBack} label={copy('放回去', 'Put Back')} />}
      {reviewing
        ? <><StampButton disabled={workflow === 'confirmed' || sendReturning} onClick={() => dispatchWorkflow({ type: 'EDIT' })} label={copy('继续修改', 'Edit Again')} /><StampButton className="replay-send-letter" disabled={workflow === 'confirmed' || replay.preparing || sendReturning} onClick={confirm} label={copy('去寄信', 'Continue')} /></>
        : writing && letter.finalText.trim() && <StampButton onClick={finish} label={copy('写完了', 'Finish Writing')} />}
    </div>
  </div></div>;
}
