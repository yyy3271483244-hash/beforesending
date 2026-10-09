import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { stampChoices, writingTools } from "../data/content";
import { useWritingTrace } from "../trace/useWritingTrace";
import { useWritingSound } from "../trace/useWritingSound";
import StitchTraceCanvas from "./StitchTraceCanvas";
import ThreadAnimal from "./ThreadAnimal";

export default function WritingRoom({ letter, updateLetter, onFinish, onBack }) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const trace = useWritingTrace(letter, updateLetter);
  const sound = useWritingSound(letter.selectedPen, soundEnabled);
  const lastKeyAt = useRef(0);
  const ghostTimer = useRef(null);
  const [visibleGhost, setVisibleGhost] = useState(null);
  const paperRef = useRef(null);
  const dragRef = useRef(null);
  const decorations = letter.decorations || [];

  const selectedTool = useMemo(
    () => writingTools.find((tool) => tool.id === letter.selectedPen) || writingTools[0],
    [letter.selectedPen],
  );

  useEffect(() => {
    if (!trace.lastGhost) return;
    setVisibleGhost(trace.lastGhost);
    window.clearTimeout(ghostTimer.current);
    ghostTimer.current = window.setTimeout(() => setVisibleGhost(null), 2200);
    return () => window.clearTimeout(ghostTimer.current);
  }, [trace.lastGhost]);

  useLayoutEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !paperRef.current) return undefined;
    const tween = gsap.fromTo(paperRef.current, { y: 36, rotate: 0.8, opacity: 0 }, { y: 0, rotate: -0.25, opacity: 1, duration: 1.1, ease: "power3.out" });
    return () => tween.kill();
  }, []);

  const handleInput = (event) => {
    const now = performance.now();
    const density = lastKeyAt.current ? Math.max(0.8, Math.min(3.2, 500 / (now - lastKeyAt.current))) : 1;
    lastKeyAt.current = now;
    const change = trace.handleChange(event);
    sound.play(change?.deletedText ? "delete" : "write", density);
  };

  const finish = () => {
    trace.finish();
    window.setTimeout(onFinish, 30);
  };

  const addDecoration = (stamp) => {
    const next = [...decorations, {
      id: `decoration-${Date.now()}`,
      image: stamp.image,
      label: stamp.label,
      x: 68 + decorations.length * 24,
      y: 115 + decorations.length * 31,
    }];
    updateLetter({ decorations: next });
  };

  const moveDecoration = (id, offset) => {
    updateLetter({
      decorations: decorations.map((item) => item.id === id
        ? { ...item, x: item.x + offset.x, y: item.y + offset.y }
        : item),
    });
  };

  const removeDecoration = (id) => {
    updateLetter({ decorations: decorations.filter((item) => item.id !== id) });
  };

  const beginDecorationDrag = (event, item) => {
    if (event.target.closest("button")) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = {
      id: item.id,
      startX: event.clientX,
      startY: event.clientY,
      originX: item.x,
      originY: item.y,
    };
  };

  const moveDecorationDrag = (event) => {
    const active = dragRef.current;
    if (!active) return;
    moveDecoration(active.id, {
      x: active.originX + event.clientX - active.startX - (decorations.find((item) => item.id === active.id)?.x || 0),
      y: active.originY + event.clientY - active.startY - (decorations.find((item) => item.id === active.id)?.y || 0),
    });
  };

  const endDecorationDrag = () => {
    dragRef.current = null;
  };

  return (
    <main className={`bs-writing-room pen-${letter.selectedPen} ${trace.isPaused ? "is-paused" : ""}`}>
      <button className="bs-margin-back" onClick={onBack}>暂时离开书桌</button>
      <div className="bs-writing-light" aria-hidden="true" />
      <ThreadAnimal />
      <section className="bs-writing-desk">
        <aside className="bs-pen-tray" aria-label="选择书写工具">
          <p>挑一支顺手的笔</p>
          {writingTools.map((tool, index) => (
            <button
              key={tool.id}
              type="button"
              className={`bs-pen-object ${letter.selectedPen === tool.id ? "is-selected" : ""}`}
              onClick={() => updateLetter({ selectedPen: tool.id })}
              title={`${tool.label}：${tool.note}`}
              aria-label={`使用${tool.label}`}
              style={{ "--pen-order": index }}
            >
              <img src={tool.image} alt="" />
            </button>
          ))}
          <p className="bs-selected-pen-note">{selectedTool.note}</p>
          <button
            type="button"
            className={`bs-sound-switch ${soundEnabled ? "is-on" : ""}`}
            onClick={() => setSoundEnabled((value) => !value)}
          >
            {soundEnabled ? "纸上的声音：开" : "纸上的声音：关"}
          </button>
        </aside>

        <section
          className="bs-letter-paper"
          ref={paperRef}
        >
          <div className="bs-paper-fibers" aria-hidden="true" />
          {decorations.map((item) => (
            <div
              className="bs-paper-decoration"
              key={item.id}
              onPointerDown={(event) => beginDecorationDrag(event, item)}
              onPointerMove={moveDecorationDrag}
              onPointerUp={endDecorationDrag}
              onPointerCancel={endDecorationDrag}
              style={{ left: item.x, top: item.y }}
            >
              <img src={item.image} alt={item.label} />
              <button type="button" onClick={() => removeDecoration(item.id)} title="移除这张贴纸" aria-label="移除这张贴纸">×</button>
            </div>
          ))}
          <label className="bs-recipient-line">
            <span>写给：</span>
            <input
              value={letter.recipient}
              onChange={(event) => updateLetter({ recipient: event.target.value })}
              placeholder="可以不说明"
              aria-label="收信人"
            />
          </label>
          <div className="bs-writing-surface">
            <textarea
              value={trace.text}
              onChange={handleInput}
              placeholder="慢慢写，这里不会催促你。"
              spellCheck="false"
              aria-label="信件正文"
            />
            {visibleGhost && (
              <span
                className="bs-deleted-ghost"
                key={visibleGhost.id}
                style={{ top: `${22 + (visibleGhost.position % 9) * 7}%` }}
              >
                {visibleGhost.text}
              </span>
            )}
            <span className="bs-ink-pause" aria-hidden="true" />
            <StitchTraceCanvas events={trace.events} active={!trace.isPaused} />
          </div>
          <footer className="bs-paper-footer">
            <span>{trace.text.length ? "这封信仍在形成" : "纸是空的，时间还没有开始"}</span>
            <button type="button" onClick={finish} disabled={!trace.text.trim()}>
              写完了，看看它怎样形成
            </button>
          </footer>
        </section>

        <aside className="bs-sticker-tray" aria-label="信纸装饰">
          <p>STICKERS</p>
          <div>
            {stampChoices.map((stamp) => (
              <button type="button" key={stamp.id} onClick={() => addDecoration(stamp)} title={`添加${stamp.label}`}>
                <img src={stamp.image} alt={stamp.label} />
              </button>
            ))}
          </div>
          <small>点击贴上信纸，<br />再拖到想放的位置。</small>
        </aside>
      </section>
    </main>
  );
}
