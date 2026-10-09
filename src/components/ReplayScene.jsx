import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import SplitType from "split-type";
import { emitThreadEvent, THREAD_ACTIONS } from "../animation/threadEvents";
import StitchTraceCanvas from "./StitchTraceCanvas";
import ThreadAnimal from "./ThreadAnimal";

function replayFrames(events, finalText) {
  const snapshots = events
    .filter((event) => event.type === "input" || event.type === "pause")
    .map((event) => ({
      type: event.type,
      action: event.action,
      timestamp: event.relativeTime || 0,
      text: event.newText ?? finalText,
      deletedText: event.deletedText || "",
      duration: event.duration || 0,
    }));
  return snapshots.length ? snapshots : [{ type: "input", action: "write", timestamp: 0, text: finalText }];
}

function abandonedLetter(fragments) {
  if (!fragments.length) return "这里没有被完整留下的句子。\n\n有些犹豫发生得太轻，轻到没有成为文字。";
  return fragments
    .map((fragment, index) => `${index ? "\n\n" : ""}${fragment.text}${fragment.replacedBy ? `\n${fragment.replacedBy}` : ""}`)
    .join("");
}

export default function ReplayScene({ letter, updateLetter, onContinue, onBack }) {
  const frames = useMemo(() => replayFrames(letter.writingEvents, letter.finalText), [letter.writingEvents, letter.finalText]);
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [displayText, setDisplayText] = useState("");
  const [ghost, setGhost] = useState("");
  const [sheet, setSheet] = useState("kept");
  const textRef = useRef(null);
  const timelineRef = useRef(null);

  useLayoutEffect(() => {
    const timeline = gsap.timeline({
      paused: true,
      onComplete: () => {
        setPlaying(false);
        setDisplayText(letter.finalText);
      },
    });
    let cursor = 0;
    frames.forEach((current, index) => {
      const previous = frames[Math.max(0, index - 1)];
      const rawGap = index ? current.timestamp - previous.timestamp : 120;
      const pauseWeight = current.type === "pause" ? Math.min(1500, 520 + current.duration * 0.08) : 0;
      cursor += Math.max(0.06, Math.min(1.1, (rawGap * 0.12 + pauseWeight) / 1000));
      timeline.call(() => {
        setDisplayText(current.text);
        setGhost(current.deletedText || "");
        setFrameIndex(index + 1);
        emitThreadEvent(THREAD_ACTIONS.replay, { frame: index, event: current });
      }, null, cursor);
    });
    timelineRef.current = timeline;
    return () => {
      timeline.kill();
      timelineRef.current = null;
    };
  }, [frames, letter.finalText]);

  useEffect(() => {
    timelineRef.current?.timeScale(speed);
  }, [speed]);

  useEffect(() => {
    if (!textRef.current || !displayText) return;
    const split = new SplitType(textRef.current, { types: "words" });
    gsap.fromTo(split.words, { opacity: 0.25 }, { opacity: 1, duration: 0.65, stagger: 0.018, ease: "power1.out" });
    return () => split.revert();
  }, [displayText]);

  const restart = () => {
    setFrameIndex(0);
    setDisplayText("");
    setGhost("");
    setPlaying(true);
    emitThreadEvent(THREAD_ACTIONS.replay, { frame: 0, restart: true });
    timelineRef.current?.restart();
  };

  const togglePlayback = () => {
    if (playing) {
      timelineRef.current?.pause();
      setPlaying(false);
      return;
    }
    if (!frameIndex || timelineRef.current?.progress() === 1) restart();
    else {
      timelineRef.current?.play();
      setPlaying(true);
    }
  };

  const deletedLetter = abandonedLetter(letter.deletedFragments);

  return (
    <main className="bs-replay-room">
      <button className="bs-margin-back" onClick={onBack}>回到书桌</button>
      <ThreadAnimal />
      <header className="bs-replay-heading">
        <p>这不是修改记录。</p>
        <h1>看这封信怎样经过沉默，才成为现在的样子。</h1>
      </header>

      <nav className="bs-replay-controls" aria-label="回放控制">
        <button onClick={togglePlayback}>{playing ? "暂停" : frameIndex ? "继续" : "播放"}</button>
        <button onClick={restart}>从头看</button>
        {[1, 2, 4].map((value) => (
          <button key={value} className={speed === value ? "is-active" : ""} onClick={() => setSpeed(value)}>{value}×</button>
        ))}
      </nav>

      <section className="bs-replay-desk">
        <div className="bs-version-tabs">
          <button className={sheet === "kept" ? "is-active" : ""} onClick={() => setSheet("kept")}>留下的信</button>
          <button className={sheet === "abandoned" ? "is-active" : ""} onClick={() => setSheet("abandoned")}>你没有寄出的那封</button>
        </div>
        <StitchTraceCanvas events={letter.writingEvents} active={playing} />
        {sheet === "kept" ? (
            <article
              key="kept"
              className="bs-replay-paper bs-replay-paper--kept"
            >
              <span className="bs-replay-to">写给：{letter.recipient || "没有说明的人"}</span>
              <p ref={textRef}>{displayText || "纸面正在等待第一句话。"}</p>
              {ghost && <del key={`${frameIndex}-${ghost}`}>{ghost}</del>}
              <span className={`bs-replay-breath ${playing ? "is-moving" : ""}`} />
            </article>
          ) : (
            <article
              key="abandoned"
              className="bs-replay-paper bs-replay-paper--abandoned"
            >
              <span className="bs-replay-to">由被擦去的句子留下</span>
              <p>{deletedLetter}</p>
              <label className="bs-trace-permission">
                <input
                  type="checkbox"
                  checked={letter.traceSharingPermission}
                  onChange={(event) => updateLetter({ traceSharingPermission: event.target.checked })}
                />
                <span>也允许收信人看见这些痕迹</span>
              </label>
            </article>
          )}
      </section>

      <button className="bs-replay-continue" onClick={onContinue}>把信拿去装封</button>
    </main>
  );
}
