import { useEffect, useRef, useState } from 'react';
import { fullFrameStyle } from '../animation/fullFrameStyle.mjs';

const FADE_MS = 360;

export function WritingAnimalMedia({ asset, name, activity, actionToken, onActionEnd }) {
  const companion = useRef(null);
  const companionLoop = useRef(null);
  const sewing = useRef(null);
  const transition = useRef(null);
  const previousToken = useRef(actionToken);
  const activeCompanion = useRef(0);
  const pendingCompanion = useRef(null);
  const loopTimer = useRef(null);
  const [layer, setLayer] = useState('companion');
  const [loopBlend, setLoopBlend] = useState(null);

  function companionNodes() {
    return [companion.current, companionLoop.current];
  }

  function settleCompanionLoop() {
    window.clearTimeout(loopTimer.current);
    loopTimer.current = null;
    if (pendingCompanion.current !== null) activeCompanion.current = pendingCompanion.current;
    pendingCompanion.current = null;
    setLoopBlend(null);
  }

  function play(node, time = 0, rate = 1, onStarted, onFailed) {
    if (!node) return;
    node.pause();
    node.playbackRate = rate;
    const target = Math.min(time, Number.isFinite(node.duration) ? Math.max(0, node.duration - 0.05) : time);
    const start = () => Promise.resolve(node.play()).then(onStarted).catch(() => onFailed?.());
    if (Math.abs(node.currentTime - target) < 0.03) start();
    else {
      node.addEventListener('seeked', start, { once: true });
      node.currentTime = target;
    }
  }

  function show(next) {
    requestAnimationFrame(() => setLayer(next));
  }

  function startCompanion(fromStart = false) {
    settleCompanionLoop();
    const nodes = companionNodes();
    const node = nodes[activeCompanion.current] || companion.current;
    nodes.forEach(other => { if (other && other !== node) other.pause(); });
    const rate = fromStart ? asset.companionRate : asset.companionLoopRate || asset.companionRate;
    play(node, fromStart ? 0 : asset.companionLoopStart, rate || 1, () => show('companion'));
  }

  function startSewing() {
    play(sewing.current, 0, 1, () => {
      settleCompanionLoop();
      companionNodes().forEach(node => node?.pause());
      show('sewing');
    });
  }

  useEffect(() => {
    settleCompanionLoop();
    activeCompanion.current = 0;
    startCompanion(true);
    return () => {
      window.clearTimeout(loopTimer.current);
      companion.current?.pause();
      companionLoop.current?.pause();
      sewing.current?.pause();
      transition.current?.pause();
    };
  }, [asset.companion]);

  useEffect(() => {
    if (activity !== 'sewing' || previousToken.current === actionToken) return;
    previousToken.current = actionToken;
    if (asset.transition) {
      play(transition.current, 0, 1, () => show('transition'));
    } else startSewing();
  }, [activity, actionToken, asset.transition]);

  function beginCompanionLoop(index) {
    if (pendingCompanion.current !== null) return;
    const nodes = companionNodes();
    const outgoing = nodes[index];
    const incomingIndex = 1 - index;
    const incoming = nodes[incomingIndex];
    if (!outgoing || !incoming) return;

    pendingCompanion.current = incomingIndex;
    const loopStart = asset.companionLoopStart || 0;
    const rate = asset.companionLoopRate || asset.companionRate || 1;
    play(incoming, loopStart, rate, () => {
      if (pendingCompanion.current !== incomingIndex) return;
      setLoopBlend(incomingIndex);
      loopTimer.current = window.setTimeout(() => {
        outgoing.pause();
        outgoing.currentTime = Math.min(loopStart, Number.isFinite(outgoing.duration) ? Math.max(0, outgoing.duration - 0.05) : loopStart);
        activeCompanion.current = incomingIndex;
        pendingCompanion.current = null;
        loopTimer.current = null;
        setLoopBlend(null);
      }, asset.companionLoopCrossfadeMs || FADE_MS);
    }, () => {
      if (pendingCompanion.current !== incomingIndex) return;
      pendingCompanion.current = null;
      outgoing.currentTime = Math.min(loopStart, Number.isFinite(outgoing.duration) ? Math.max(0, outgoing.duration - 0.05) : loopStart);
      outgoing.playbackRate = rate;
      outgoing.play().catch(() => {});
    });
  }

  function keepCompanionInIdle(node, index) {
    if (layer !== 'companion' || index !== activeCompanion.current || pendingCompanion.current !== null || !Number.isFinite(node.duration)) return;
    if (asset.companionLoopCrossfadeMs && companionLoop.current) {
      const leadTime = Math.max(.32, asset.companionLoopCrossfadeMs / 1000 + .14);
      if (node.currentTime >= node.duration - leadTime) {
        beginCompanionLoop(index);
        return;
      }
    }
    if (node.currentTime >= node.duration - 0.06) {
      node.playbackRate = asset.companionLoopRate || asset.companionRate || 1;
      node.currentTime = Math.min(asset.companionLoopStart, node.duration - 0.1);
      node.play().catch(() => {});
    }
  }

  function sewingEnded() {
    startCompanion(Boolean(asset.transition || asset.resumeFromStart));
    window.setTimeout(() => onActionEnd?.(), asset.crossfadeMs || FADE_MS);
  }

  const styleFor = current => ({ opacity: layer === current ? 1 : 0, ...fullFrameStyle(asset.presentation[current]) });
  const styleForCompanion = index => ({
    opacity: layer === 'companion' && (loopBlend === null ? activeCompanion.current === index : loopBlend === index) ? 1 : 0,
    ...fullFrameStyle(asset.presentation.companion),
  });
  return <span className="animal-media writing-animal-media" data-motion={layer}
    style={{ '--animal-crossfade': `${asset.crossfadeMs || FADE_MS}ms`, '--animal-loop-crossfade': `${asset.companionLoopCrossfadeMs || asset.crossfadeMs || FADE_MS}ms` }}>
    <span className="writing-full-motion-frame">
    <video ref={companion} className="writing-companion-layer" src={asset.companion} muted playsInline preload="auto" controls={false}
      onLoadedData={() => layer === 'companion' && companion.current?.paused && startCompanion(true)}
      onTimeUpdate={event => keepCompanionInIdle(event.currentTarget, 0)}
      onEnded={event => keepCompanionInIdle(event.currentTarget, 0)}
      style={styleForCompanion(0)} aria-label={`${name}管理员`} />
    {asset.companionLoopCrossfadeMs && <video ref={companionLoop} className="writing-companion-layer" src={asset.companion} muted playsInline preload="auto" controls={false}
      onTimeUpdate={event => keepCompanionInIdle(event.currentTarget, 1)}
      onEnded={event => keepCompanionInIdle(event.currentTarget, 1)}
      style={styleForCompanion(1)} aria-hidden="true" />}
    <video ref={sewing} src={asset.sewing} muted playsInline preload="auto" controls={false}
      onEnded={sewingEnded} style={styleFor('sewing')} aria-hidden="true" />
    {asset.transition && <video ref={transition} src={asset.transition} muted playsInline preload="auto" controls={false}
      onEnded={startSewing} style={styleFor('transition')} aria-hidden="true" />}
    </span>
  </span>;
}
