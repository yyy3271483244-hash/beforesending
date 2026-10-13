import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { keeperLoopStart, keeperPlaybackStart, keeperPixels } from '../animation/keeperPlayback.mjs';
import { fullFrameStyle } from '../animation/fullFrameStyle.mjs';
import '../selection-animal-motion.css';

// Only the keeper selector uses this player. Writing-side media remains untouched.
export function SelectionAnimalMedia({ asset, active, selected = false, request, name }) {
  const root = useRef(null), video = useRef(null), canvas = useRef(null), controller = useRef(null);
  const latest = useRef({ active, selected, request }); latest.current = { active, selected, request };
  const handledToken = useRef(0);
  const [ready, setReady] = useState(false), [state, setState] = useState('idle');
  const renderDivisor = 2 ** Math.max(0, Math.ceil(Math.log2(Math.max(asset.sourceWidth, asset.sourceHeight) / 640)));
  const renderWidth = asset.sourceWidth / renderDivisor, renderHeight = asset.sourceHeight / renderDivisor;
  const [frameBox, setFrameBox] = useState({ width:asset.width, height:asset.height, left:0, top:0 });
  useLayoutEffect(() => {
    const node = root.current;
    function fit() {
      const scale = Math.min(node.clientWidth / asset.width, node.clientHeight / asset.height);
      setFrameBox({ width:asset.width * scale, height:asset.height * scale,
        left:(node.clientWidth - asset.width * scale) / 2, top:node.clientHeight - asset.height * scale });
    }
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(node);
    return () => observer.disconnect();
  }, [asset.width, asset.height]);

  useEffect(() => {
    const node = video.current, surface = canvas.current, element = root.current;
    const width = renderWidth, height = renderHeight;
    const context = surface.getContext('2d');
    const packed = document.createElement('canvas');
    packed.width = width * 2; packed.height = height;
    const unpack = packed.getContext('2d', { willReadFrequently: true });
    const pixels = context.createImageData(width, height);
    const alphaFix = asset.frameAlphaCorrection;
    const alphaFixCanvas = alphaFix ? document.createElement('canvas') : null;
    if (alphaFixCanvas) { alphaFixCanvas.width = width; alphaFixCanvas.height = height; }
    const alphaFixContext = alphaFixCanvas?.getContext('2d', { willReadFrequently: true });
    let correctedAlpha = null, alphaFixReady = !alphaFix, resumeAfterAlphaFix = false;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    let mode = latest.current.selected ? 'selected-idle' : 'idle';
    let source = '', frame = null, disposed = false, hasFrame = false;
    let needsSeek = false, generation = 0, loops = 0, idleIntroPlayed = false, selectedIntroPlayed = false;
    if (alphaFix) {
      const image = new Image();
      const ready = () => {
        alphaFixReady = true;
        if (resumeAfterAlphaFix && !disposed) { resumeAfterAlphaFix = false; play(); }
      };
      image.onload = () => {
        try {
          alphaFixContext.drawImage(image, 0, 0, width, height);
          correctedAlpha = alphaFixContext.getImageData(0, 0, width, height).data;
        } catch { correctedAlpha = null; }
        ready();
      };
      image.onerror = ready;
      image.src = alphaFix.src;
    }

    const idle = () => mode === 'idle' || mode === 'selected-idle';
    const loopStart = () => mode === 'selected-idle'
      ? asset.selectedIdleLoopStart ?? keeperLoopStart(node.duration)
      : keeperLoopStart(node.duration);
    const canPlay = () => latest.current.active && !document.hidden && !preference.matches;
    function cancelFrame() {
      if (frame == null) return;
      if (node.requestVideoFrameCallback) node.cancelVideoFrameCallback(frame);
      else cancelAnimationFrame(frame);
      frame = null;
    }
    function pause() { cancelFrame(); node.pause(); }
    function draw() {
      if (disposed || node.readyState < 2 || node.seeking || needsSeek) return;
      unpack.drawImage(node, 0, 0, width * 2, height);
      keeperPixels(unpack.getImageData(0, 0, width * 2, height).data, pixels.data, width, height);
      if (correctedAlpha && source) {
        const frameNumber = Math.round(node.currentTime * alphaFix.fps);
        const selectedIdle = source === asset.selectedIdlePlaybackVideo && source !== asset.playbackVideo;
        const sourceFrame = selectedIdle && frameNumber >= alphaFix.sourceFrames
          ? alphaFix.sourceFrames * 2 - 1 - frameNumber
          : frameNumber;
        if (sourceFrame === alphaFix.frameIndex) {
          for (let pixel = 0; pixel < width * height; pixel++) {
            pixels.data[pixel * 4 + 3] = correctedAlpha[pixel * 4 + 3];
          }
        }
      }
      // Keep the last frame while seeking, then replace it atomically. Blending
      // two cutout silhouettes produces double outlines and fades opaque pixels.
      context.putImageData(pixels, 0, 0);
      if (!hasFrame) { hasFrame = true; setReady(true); }
    }
    function schedule() {
      if (frame != null || !canPlay() || disposed) return;
      const tick = () => { frame = null; draw(); if (!node.paused) schedule(); };
      frame = node.requestVideoFrameCallback ? node.requestVideoFrameCallback(tick) : requestAnimationFrame(tick);
    }
    function play() {
      if (!canPlay()) { pause(); draw(); return; }
      if (!alphaFixReady) { resumeAfterAlphaFix = true; return; }
      node.defaultPlaybackRate = asset.playbackRate ?? 1;
      node.playbackRate = asset.playbackRate ?? 1;
      const run = generation;
      node.play().then(() => {
        if (disposed || run !== generation) return;
        if (!canPlay()) pause(); else schedule();
      }).catch(error => {
        if (!disposed && run === generation && error.name !== 'AbortError') element.dataset.playbackBlocked = 'true';
      });
    }
    function seek() {
      if (!needsSeek || node.readyState < 1) return;
      const loopPoint = loopStart();
      const start = keeperPlaybackStart({ mode, duration: node.duration, idleIntroPlayed, selectedIntroPlayed,
        selectedIdleLoopStart: asset.selectedIdleLoopStart });
      element.dataset.loopStart = String(loopPoint);
      needsSeek = false;
      node.currentTime = start;
    }
    function change(next, restart = true) {
      // Clicking during a hover promotes the ongoing action, not a new first frame.
      if (next === 'select' && mode === 'hover' && !node.ended) {
        mode = next; setState(mode); play(); return;
      }
      if (next === mode && !restart) { play(); return; }
      // A hover/selection completes the greeting instead of replaying it on return.
      if (mode === 'idle' && (next === 'hover' || next === 'select')) idleIntroPlayed = true;
      pause(); generation++;
      mode = next; setState(mode);
      if (mode === 'selected-idle') selectedIntroPlayed = false;
      needsSeek = true;
      const destination = mode === 'selected-idle'
        ? asset.selectedIdlePlaybackVideo || asset.idlePlaybackVideo || asset.playbackVideo
        : mode === 'idle'
          ? asset.idlePlaybackVideo || asset.playbackVideo
          : asset.playbackVideo;
      if (source !== destination) {
        source = destination;
        node.src = source;
        // Explicit source selection also recovers after deployment-base/HMR changes.
        node.load();
      } else seek();
      play();
    }
    function sync() {
      const current = latest.current;
      if (current.request?.token && current.request.token !== handledToken.current && current.active) {
        handledToken.current = current.request.token;
        const kind = current.request.kind;
        if (kind === 'select' || kind === 'hover' && !current.selected) change(kind);
        else if (kind === 'idle' && !current.selected) change('idle', false);
      }
      if (idle() && current.selected !== (mode === 'selected-idle')) change(current.selected ? 'selected-idle' : 'idle', false);
      if (!canPlay()) pause(); else play();
    }
    function metadata() { seek(); }
    function loaded() { seek(); draw(); play(); }
    function seeked() { draw(); play(); }
    function timeupdate() {
      if (!idle() || !Number.isFinite(node.duration)) return;
      element.dataset.playbackPhase = node.currentTime >= loopStart() ? 'idle' : 'intro';
    }
    function ended() {
      if (!canPlay()) return;
      loops++;
      element.dataset.loopCount = String(loops);
      if (idle()) {
        if (mode === 'idle') idleIntroPlayed = true;
        selectedIntroPlayed = mode === 'selected-idle';
        needsSeek = true;
        seek();
        play();
        return;
      }
      change(latest.current.selected ? 'selected-idle' : 'idle');
    }
    function failed() { element.dataset.mediaError = 'true'; pause(); }
    function playing() { delete element.dataset.playbackBlocked; schedule(); }
    const handlers = { loadedmetadata: metadata, loadeddata: loaded, seeked, timeupdate, ended, error: failed, playing };
    for (const [event, handler] of Object.entries(handlers)) node.addEventListener(event, handler);
    preference.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    controller.current = { sync };
    setReady(false);
    change(mode);
    sync();
    return () => {
      disposed = true; generation++; pause(); controller.current = null;
      for (const [event, handler] of Object.entries(handlers)) node.removeEventListener(event, handler);
      preference.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [asset.playbackVideo, asset.idlePlaybackVideo, asset.selectedIdlePlaybackVideo, asset.selectedIdleLoopStart, asset.frameAlphaCorrection, asset.playbackRate, renderWidth, renderHeight]);

  useEffect(() => { controller.current?.sync(); }, [active, selected, request?.token]);

  return <span ref={root} className="selection-animal-media" data-motion={state} data-ready={ready} role="img" aria-label={name}>
    <video ref={video} muted playsInline preload="auto" controls={false} aria-hidden="true" />
    <span className="selection-full-motion-frame" style={{ ...frameBox,
      transform: `scale(${asset.displayScale ?? 1})`,
      transformOrigin: `${asset.feet[0] / asset.width * 100}% ${asset.feet[1] / asset.height * 100}%` }}>
      <canvas ref={canvas} width={renderWidth} height={renderHeight} style={fullFrameStyle(asset.presentation)} aria-hidden="true" />
    </span>
  </span>;
}
