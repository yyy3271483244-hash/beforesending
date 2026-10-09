import { useI18n } from "../i18n/Language";import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { RoomHeader } from "./ArchiveRooms";
import { AdministratorCharacter, LetterAdministrator } from "./AdministratorSystem";
import { measureCaret, useLetterSession } from "../trace/letterSession";
import { compactDeletionMarks, compactPauseMarks } from "../trace/visibleMarks";
import { useWritingDesk } from "../animation/useWritingDesk";
import { useGrowingPaper } from "../animation/useGrowingPaper";
import { ThreadTail } from "./ThreadTail";
import { PaperTurner } from "./PaperTurner";
import { useLetterReplay } from "../animation/useLetterReplay";
import { DeliveryObjects } from "./DeliveryWorktable";
import { DeletionStitch, EmbroideryText } from "./EmbroideryText";
import "../writing-desk.css";
import "../writing-flow.css";

function KnotThread({ level = 1, progress = 0, closed = false }) {
  return <svg viewBox="0 0 48 28" className={`knot-thread level-${level}${closed ? " is-closed" : ""}`} aria-hidden="true" style={{ "--loosen": progress }}>
    <path pathLength="100" d={progress > .95 ? "M6 16 Q22 20 40 14" : level === 1 ? "M6 15 Q17 23 29 15" : "M5 17 Q17 20 24 15 C33 5 14 5 20 16 Q26 20 38 16"} />
    {level >= 3 && progress < .65 && <path pathLength="100" d="M20 17 C13 24 31 25 28 16 Q25 12 22 17" />}
  </svg>;
}

export function LetterTraces({ letter, surface, interactive = false, onActivity, revealHost, single = false, individual = false, pauseMarks = !single }) {const { t, locale } = useI18n();
  const [positions, setPositions] = useState({});
  const [active, setActive] = useState(null);
  const [amount, setAmount] = useState(0);
  const [untied, setUntied] = useState([]);
  const gesture = useRef(null);
  const resetTimer = useRef(null);
  const fragments = useMemo(() => {
    if (!single) return letter.fragments || [];
    const kept = compactDeletionMarks(letter.fragments || [], letter.finalText);
    if (!kept.length) return [];
    if (individual) return kept;
    return [{ id: 'writing-thread', threadId: 'writing-thread', position: letter.finalText.length, resetKey: letter.finalText,
      content: kept.map((item) => item.content).join('\n\n') }];
  }, [single, individual, letter.fragments, letter.finalText]);
  const knots = useMemo(() => pauseMarks ? compactPauseMarks(letter.knots || [], letter.finalText) : [], [pauseMarks, letter.knots, letter.finalText]);
  const entries = [...fragments, ...knots];
  const activeKnot = knots.find((item) => item.id === active);

  useLayoutEffect(() => {
    function measure() {
      const next = {};
      entries.forEach((entry) => {next[entry.id] = measureCaret(surface.current, letter.finalText, entry.position);});
      if (single && pauseMarks && fragments[0]) {
        const tail = next[fragments[0].id];
        knots.forEach((knot) => {
          const pause = next[knot.id];
          if (Math.abs(pause.x - tail.x) < 30 && Math.abs(pause.y - tail.y) < 40) tail.y = pause.y + 32;
        });
      }
      setPositions(next);
    }
    measure();
    const observer = new ResizeObserver(measure);
    const element = surface.current;
    if (element) {observer.observe(element);element.addEventListener("scroll", measure, { passive: true });}
    window.addEventListener('before-sending-languagechange', measure);
    return () => {observer.disconnect();element?.removeEventListener("scroll", measure);window.removeEventListener('before-sending-languagechange', measure);};
  }, [letter.finalText, fragments, knots, individual]);

  useEffect(() => {
    if (!activeKnot) return;
    const timer = setInterval(() => {
      if (!gesture.current) return;
      const progress = Math.min(1, (performance.now() - gesture.current.started) / Math.min(3000, Math.max(700, activeKnot.duration * .22)));
      setAmount(progress * 100);
      if (progress >= 1) setUntied((current) => current.includes(activeKnot.id) ? current : [...current, activeKnot.id]);
    }, 50);
    return () => clearInterval(timer);
  }, [activeKnot]);
  useEffect(() => () => clearTimeout(resetTimer.current), []);

  function begin(event, item, keyboard = false) {
    clearTimeout(resetTimer.current);
    if (!keyboard) event.currentTarget.setPointerCapture?.(event.pointerId);
    gesture.current = { x: event.clientX || 0, y: event.clientY || 0, started: performance.now() };
    setActive(item.id);
    setAmount(item.cut ? 5 : keyboard && !item.duration ? 100 : 0);
    onActivity?.(item.cut ? "reacting" : "following");
  }
  function move(event, item) {
    if (!gesture.current || item.duration) return;
    setAmount(Math.min(item.cut ? 10 : 110, Math.hypot(event.clientX - gesture.current.x, event.clientY - gesture.current.y)));
  }
  function end() {
    clearTimeout(resetTimer.current);
    gesture.current = null;
    setAmount(0);
    onActivity?.("reading");
    resetTimer.current = setTimeout(() => setActive(null), 260);
  }

  return <div className="letter-trace-layer">
    {entries.map((entry, index) => {
      const point = positions[entry.id] || { x: 0, y: 0, width: surface.current?.clientWidth || 0 };
      const knot = Boolean(entry.duration);
      const surfaceStyle = surface.current ? getComputedStyle(surface.current) : null;
      const lineHeight = parseFloat(surfaceStyle?.lineHeight) || parseFloat(surfaceStyle?.fontSize) * 1.9 || 34;
      const nearby = entries.slice(0, index).filter((prior) => {
        const priorPoint = positions[prior.id];
        return priorPoint && Math.abs(priorPoint.x - point.x) < 38 && Math.abs(priorPoint.y - point.y) < 24;
      }).length;
      const traceOffset = single ? Math.min(nearby, 5) : 0;
      const left = Math.max(0, Math.min(point.width - 45, point.x + traceOffset * 8));
      if (!knot) return <ThreadTail key={entry.threadId || entry.id} fragment={entry} point={{ ...point, x: left, y: point.y + traceOffset * 12 }} interactive={interactive} onActivity={onActivity} revealHost={revealHost} />;
      const loosen = entry.id === active ? amount / 100 : untied.includes(entry.id) ? 1 : 0;
      const label = entry.cut ? t("封闭的线结") : knot ? t("解开停顿线结") : t("拉出这一处线头");
      return <button key={entry.id} type="button" tabIndex={interactive ? 0 : -1}
      className={`anchored-trace${knot ? " is-knot" : " is-backstitch"}${entry.cut ? " is-permanent" : ""}${entry.content?.length === 1 ? " is-tiny" : ""}`}
      style={{ left, top: point.y + lineHeight + 3 + traceOffset * 12, "--tension": entry.id === active ? amount : 0, pointerEvents: interactive ? "auto" : "none" }} aria-label={label}
      onPointerDown={(event) => begin(event, entry)} onPointerMove={(event) => move(event, entry)} onPointerUp={end} onPointerCancel={end}
      onKeyDown={(event) => {if ([" ", "Enter"].includes(event.key) && !event.repeat) {event.preventDefault();begin(event, entry, true);}}}
      onKeyUp={end} onBlur={() => {if (active === entry.id) end();}}>
        {knot || entry.cut ? <KnotThread level={entry.complexity || 3} progress={loosen} closed={entry.cut} /> : <svg className="backstitch-thread" viewBox="0 0 48 28" aria-hidden="true"><path d="M5 12 l6 1 m5 -1 l6 1 Q31 13 33 19" /><circle cx="5" cy="12" r=".7" /><circle cx="16" cy="12" r=".7" /></svg>}
      </button>;
    })}
    {interactive && activeKnot && amount > 0 && <span className="pause-duration" style={{ left: Math.max(0, Math.min(positions[active]?.x || 0, (positions[active]?.width || 300) - 110)), top: (positions[active]?.y || 0) + 65 }}>{t("停顿")}{Math.round(activeKnot.duration / 1000)}{t("秒")}</span>}
  </div>;
}

function BacksideLayer({ letter, editing, onCut }) {const { t, locale } = useI18n();
  return <div className="letter-backside-content">
    <span className="backside-label">{t("信纸背面")}</span>
    {!letter.fragments.length && <p className="backside-empty">{t("这里暂时没有留下纸条。")}</p>}
    {[...letter.fragments].sort((a, b) => a.position - b.position).map((fragment, index) => <article key={fragment.id} className={`backside-scrap backside-residue${fragment.cut ? " is-cut" : ""}`} data-fragment-id={fragment.id} style={{ "--residue-indent": `${Math.min(28, Math.max(0, (fragment.linePosition?.x || 0) / (fragment.linePosition?.width || 500) * 32))}%`, "--residue-gap": `${Math.min(42, Math.max(8, (fragment.linePosition?.y || 0) * .12))}px` }}>
      <svg className="residue-stitch" viewBox="0 0 40 18" aria-hidden="true"><path d={fragment.cut ? "M5 9 l9 1 M17 10 C10 1 28 1 22 10 C28 17 12 16 17 10 L32 10" : "M4 8 l6 1 m5 -1 l6 1 Q28 9 33 13"} /><circle cx="4" cy="8" r=".8" /><circle cx="15" cy="8" r=".8" /></svg>
      {fragment.cut ? <span className="cut-silence" aria-label={t("已剪断，不保留文字")} /> : <p>{fragment.content}</p>}
      {editing && !fragment.cut && <button onClick={() => onCut(fragment.id)}>{t("剪断这根线")}</button>}
    </article>)}
  </div>;
}

export function LivingWriting({ letter, setLetter, go, embedded = false, initialStage }) {const { t, locale } = useI18n();
  const Surface = embedded ? "section" : "main";
  const desk = useRef(null);
  const paper = useRef(null);
  const editor = useRef(null);
  const paperScroll = useRef(null);
  const [paste, setPaste] = useState(false);
  const pasteTimer = useRef(null);
  const session = useLetterSession(letter, setLetter, editor);
  const { ready, phase, seal, stamped } = useWritingDesk(desk, paper, initialStage);
  const replaying = phase === "replay";
  const replay = useLetterReplay(letter, replaying);
  const shownLetter = replaying ? replay.visibleLetter : letter;
  useGrowingPaper(editor, paperScroll, shownLetter.finalText, phase === 'desk' || ready || replaying,
  replaying ? replay.frame?.caretIndex ?? replay.content.length : null);
  const [replayCaret, setReplayCaret] = useState({ x: 0, y: 0, animalX: 20, width: 500 });
  useLayoutEffect(() => {
    if (replaying) setReplayCaret(measureCaret(editor.current, replay.content, replay.frame?.caretIndex ?? replay.content.length));
  }, [replaying, replay.content]);
  useEffect(() => {
    if (!ready) {session.suspend();editor.current?.blur();} else
    session.track();
  }, [ready]);
  useEffect(() => () => clearTimeout(pasteTimer.current), []);

  return <Surface ref={desk} className={`living-writing writing-desk writing-flow${ready ? " is-writing-ready" : ""}${embedded ? " is-embedded-writing" : ""}`} data-phase={phase} data-writing-ready={ready} aria-label={t("写信台")}>
    <div className="desk-viewport">
    <img className="desk-scene" src="/assets/writing-desk/desk-empty.png" alt="" draggable="false" />
    <div className="desk-writing-shade" aria-hidden="true" />
    <RoomHeader title={{ desk: t("写信台"), write: t("写信台"), replay: t("回看书写"), prepare: t("寄信准备"), packing: t("封好这封信"), stamping: t("贴上邮票"), drop: t("亲手投递") }[phase]} go={go} current="write" />
    <section ref={paper} className="living-paper" style={{ viewTransitionName: "carried-paper" }} inert={!ready ? true : undefined}>
      <div className="flow-paper-content" ref={paperScroll} data-lenis-prevent>
      <div className="paper-turner">
        <div className="letter-front">
          <label className="living-to"><span>{t("给")}</span><input disabled={!ready} aria-label={t("收信人")} value={letter.recipient} placeholder={t("某个人")} onChange={(event) => setLetter({ ...letter, recipient: event.target.value })} /></label>
          <div className="letter-editing-area">
            <textarea ref={editor} disabled={!ready} aria-label={t("信件正文")} value={shownLetter.finalText} onChange={session.change} spellCheck="false" placeholder="" onFocus={session.focus} onBlur={session.suspend}
                onSelect={() => session.track()} onClick={() => session.track()} onScroll={() => session.track()}
                onCompositionStart={session.compositionStart} onCompositionEnd={session.compositionEnd}
                onKeyDown={(event) => {if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {event.preventDefault();session.undo();}}}
                onPaste={(event) => {event.preventDefault();setPaste(true);clearTimeout(pasteTimer.current);pasteTimer.current = setTimeout(() => setPaste(false), 2200);}} />
            <LetterTraces letter={shownLetter} surface={editor} interactive={ready && !replaying} single individual pauseMarks />
            {ready && <LetterAdministrator caret={session.caret} activity={paste ? "reacting" : session.activity} ghost={session.ghost} />}
            {replaying && <LetterAdministrator caret={replayCaret} activity={replay.playing ? replay.frame?.type === "pause" ? "weaving" : "following" : "idle"} ghost={replay.frame?.deleted ? { id: replay.frame.id, content: replay.frame.deleted, linePosition: replay.frame.linePosition } : null} />}
            {paste && <span className="paste-slip" role="status">{t("这张纸，留给你亲手写。")}</span>}
          </div>
        </div>
      </div>
      </div>
      <div className="flow-fold-top" aria-hidden="true" />
      <div className="flow-fold-bottom" aria-hidden="true" />
    </section>
    <nav className="writing-margin-actions" aria-label={t("信纸操作")} inert={!ready ? true : undefined}>
      <button onClick={() => {session.suspend();go("replay");}} disabled={!letter.finalText.trim()}>{t("写完了")}</button>
    </nav>
    <nav className="flow-replay-controls" aria-label={t("回放控制")} hidden={!replaying}>
      <button aria-label={replay.playing ? t("暂停回放") : t("播放回放")} onClick={() => replay.setPlaying(!replay.playing)} disabled={!replay.events.length || replay.index >= replay.events.length - 1}>{replay.playing ? "Ⅱ" : "▷"}</button>
      <input type="range" aria-label={t("书写回放进度")} min="-1" max={Math.max(0, replay.events.length - 1)} value={replay.index} onChange={(event) => {replay.setPlaying(false);replay.setIndex(Number(event.target.value));}} />
      <button onClick={replay.restart} disabled={!replay.events.length}>{t("再看一遍")}</button>
      <div className="flow-replay-speeds">{[1, 2, 4].map((speed) => <button key={speed} aria-pressed={replay.speed === speed} onClick={() => replay.setSpeed(speed)}>{speed}×</button>)}</div>
      <span className="flow-replay-note">{replay.frame?.type === "pause" ? t("停顿 {0} 秒", Math.round(replay.frame.duration / 1000)) : ""}</span>
    </nav>
    <DeliveryObjects letter={letter} setLetter={setLetter} go={go} phase={phase} onSeal={seal} onStamped={stamped} />
    </div>
  </Surface>;
}

export function LivingReading({ letter, go, sourceId, embedded = false }) {const { t, locale } = useI18n();
  const body = useRef(null);
  const reveals = useRef(null);
  const [back, setBack] = useState(false);
  const [activity, setActivity] = useState("reading");
  const Surface = embedded ? 'div' : 'main';
  return <Surface className={`living-reading scene-frame${sourceId ? " is-archive-letter" : ""}${embedded ? ' is-flow-reading' : ''}`} data-letter-id={sourceId}>
    <img className="reading-cabinet-backdrop" src="/assets/demo-cutouts/drawer-bg.jpg" alt="" />
    <RoomHeader title={t("读信台")} go={go} />
    <section className={`living-paper${back ? " is-turned" : ""}`} style={{ viewTransitionName: "carried-paper" }}>
      <PaperTurner back={back} onBackChange={setBack}>
        <div className="letter-front" inert={back ? true : undefined}>
          <p className="reading-recipient">{letter.recipient || t("给你")}</p>
          <div className="reading-text-area"><article className="living-letter-text" ref={body}>{letter.finalText || t("这封信还没有落笔。")}</article>
            <div className="reading-revealed-strips" ref={reveals} />
            {letter.allowTraces && <LetterTraces letter={letter} surface={body} interactive onActivity={setActivity} revealHost={reveals} />}
          </div>
          <footer className="letter-bottom"><span>{sourceId ? t("馆藏样信 · 不署名") : "Before Sending"}</span></footer>
        </div>
        <div className="letter-back" inert={!back ? true : undefined}><BacksideLayer letter={letter.allowTraces ? letter : { ...letter, fragments: [] }} /></div>
      </PaperTurner>
    </section>
    <AdministratorCharacter activity={activity} className="reading-administrator" />
    <nav className="writing-margin-actions" aria-label={t("读信操作")}>
      <button onClick={() => go("bureau", sourceId)}>{t("放回抽屉")}</button>
      {letter.allowTraces && <button className="flip-accessibility" onClick={() => setBack(!back)}>{back ? t("翻回正面") : t("翻看背面")}</button>}
      {letter.allowTraces && letter.events.length > 0 && <button onClick={() => go("receiverReplay", sourceId)}>{t("回看书写")}</button>}
    </nav>
  </Surface>;
}

export function LivingReplay({ letter, go, backTo = "write", sourceId }) {const { t, locale } = useI18n();
  const events = letter.events.filter((event) => !event.cancelled);
  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const surface = useRef(null);
  const frame = events[index];
  const content = frame?.newText ?? "";
  const [caret, setCaret] = useState({ x: 0, y: 0, animalX: 20, width: 500 });
  const visibleLetter = { ...letter, finalText: content, fragments: letter.fragments.filter((item) => frame && item.timestamp <= frame.timestamp), knots: (letter.knots || []).filter((item) => frame && item.timestamp <= frame.timestamp) };
  useLayoutEffect(() => setCaret(measureCaret(surface.current, content, frame?.caretIndex ?? frame?.position ?? content.length)), [index, content]);
  useEffect(() => {
    if (!playing) return;
    if (index >= events.length - 1) {setPlaying(false);return;}
    const next = events[index + 1];
    const duration = frame?.type === "pause" ? Math.min(4200, Math.max(450, frame.duration * .12)) : Math.min(850, Math.max(70, next.timestamp - (frame?.timestamp || next.timestamp) || 150));
    const timer = setTimeout(() => setIndex((value) => value + 1), duration / speed);
    return () => clearTimeout(timer);
  }, [playing, index, speed, events.length]);
  const activity = frame?.type === "pause" ? "weaving" : frame?.type === 'deleteSequence' ? 'sewing' : frame?.deleted ? "carrying" : "following";
  const textStyle = frame?.textStyle || letter.textStyle || { color: '#8f5968', family: 'fine', size: 'medium' };
  const deletion = frame?.type === 'deleteSequence' ? { ...frame, mode: 'backside' }
    : frame?.type === 'delete' && frame.deletionVisual === 'unpick' ? { ...frame, mode: 'unpick', duration: 190 } : null;
  return <main className="living-replay scene-frame">
    <img className="office-depth" src="/assets/demo-cutouts/reader-room-bg.jpg" alt="" />
    <RoomHeader title={t("回看书写")} go={go} />
    <section className="living-paper" style={{ viewTransitionName: "carried-paper" }}>
      <div className="letter-front">
        <p className="reading-recipient">{letter.recipient || t("给你")}</p>
        <div className="reading-text-area"><article className={`living-letter-text receiver-replay-text${content ? ' is-embroidered' : ''}`} ref={surface} style={{ '--active-thread': textStyle.color }}>
          {content || "\u00a0"}
          <EmbroideryText className="receiver-replay-embroidery" text={content} tokenIds={frame?.tokenIds} style={textStyle}
            fresh={frame?.added ? { start: frame.position || 0, end: (frame.position || 0) + frame.added.length, key: frame.id, duration: 165 } : null} />
          {deletion && <DeletionStitch effect={deletion} position={frame?.linePosition ? { x: frame.linePosition.x, y: frame.linePosition.y + 16 } : null} color={deletion.textStyle?.color || textStyle.color} style={deletion.textStyle || textStyle} />}
        </article>
          <LetterTraces letter={visibleLetter} surface={surface} />
          <LetterAdministrator caret={caret} activity={activity} ghost={frame?.deleted ? { id: frame.id, content: frame.deleted, linePosition: frame.linePosition } : null} />
        </div>
        <span className="replay-time-note">{frame?.type === "pause" ? t("停顿 {0} 秒", Math.round(frame.duration / 1000)) : frame?.private || frame?.type === "permanentHide" ? t("一根线被剪断") : ""}</span>
      </div>
    </section>
    <nav className="replay-margin-controls" aria-label={t("回放控制")}>
      <button onClick={() => go(backTo, sourceId)}>{t("回到信上")}</button>
      <button onClick={() => {if (index >= events.length - 1) setIndex(-1);setPlaying(!playing);}} disabled={!events.length}>{playing ? t("暂停") : t("播放")}</button>
      <input aria-label={t("书写回放进度")} type="range" min="-1" max={Math.max(0, events.length - 1)} value={index} onChange={(event) => {setPlaying(false);setIndex(Number(event.target.value));}} />
      <div className="replay-speeds" aria-label={t("播放速度")}>{[1, 2, 4].map((value) => <button key={value} aria-pressed={speed === value} onClick={() => setSpeed(value)}>{value}×</button>)}</div>
      {backTo === "write" && <button onClick={() => go("seal")} disabled={!letter.finalText.trim()}>{t("封好信")}</button>}
    </nav>
  </main>;
}
