import { useCallback, useEffect, useRef, useState } from 'react';
import '../selection-animal-motion.css';

let foregroundAction = null;

// Keep the decoded video mounted: idle and the final pose use the same pixels as motion.
export function SelectionAnimalMedia({ asset, active, request, name }) {
  const video = useRef(null), cover = useRef(null), cleanupFade = useRef(null);
  const pending = useRef(null), generation = useRef(0), frameCallback = useRef(null);
  const handledToken = useRef(0);
  const latest = useRef({ active, request }); latest.current = { active, request };
  const [ready, setReady] = useState(false), [state, setState] = useState('idle');
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);

  function clearFrame() {
    if (frameCallback.current != null) video.current?.cancelVideoFrameCallback?.(frameCallback.current);
    frameCallback.current = null;
  }
  const hold = useCallback(() => {
    generation.current++;
    pending.current = null;
    clearFrame(); clearTimeout(cleanupFade.current);
    video.current?.pause();
    if (cover.current) cover.current.style.opacity = '0';
    if (video.current) video.current.style.opacity = video.current.readyState >= 2 ? '1' : '0';
    setState('idle');
    if (foregroundAction === hold) foregroundAction = null;
  }, []);

  function reveal() {
    const node = video.current;
    if (!node || node.readyState < 2 || node.seeking) return;
    setReady(true); node.style.opacity = '1';
    const canvas = cover.current;
    if (canvas?.style.opacity === '1') {
      canvas.style.transition = 'opacity 240ms ease';
      canvas.style.opacity = '0';
      cleanupFade.current = setTimeout(() => canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height), 260);
    }
  }
  function play(kind) {
    const node = video.current;
    if (!node || !latest.current.active || reduced) return;
    if (foregroundAction !== hold) foregroundAction?.();
    foregroundAction = hold;
    if (node.readyState < 2) { pending.current = kind; return; }
    node.playbackRate = kind === 'hover' ? .8 : 1;
    // Selecting during hover promotes the same running action, without rewinding it.
    if (!node.paused && !node.ended) { setState(kind); return; }
    const run = ++generation.current;
    pending.current = null;
    clearTimeout(cleanupFade.current); clearFrame();
    if (node.ended || node.currentTime >= node.duration - .06) {
      const canvas = cover.current;
      canvas.width = node.videoWidth; canvas.height = node.videoHeight;
      canvas.getContext('2d').drawImage(node, 0, 0);
      canvas.style.transition = 'none'; canvas.style.opacity = '1';
      node.style.opacity = '0';
      node.currentTime = 0;
    }
    setState(kind);
    if (node.requestVideoFrameCallback) frameCallback.current = node.requestVideoFrameCallback(() => {
      frameCallback.current = null;
      if (generation.current === run) reveal();
    });
    node.play().catch(() => { if (generation.current === run) hold(); });
  }
  function loaded() {
    reveal();
    if (pending.current) play(pending.current);
  }
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(query.matches);
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);
  useEffect(() => {
    if (!active || reduced) { handledToken.current = request?.token || handledToken.current; hold(); return; }
    if (request?.token && request.token !== handledToken.current) {
      handledToken.current = request.token;
      play(request.kind);
    }
  }, [active, request?.token, reduced]);
  useEffect(() => {
    const hide = () => { if (document.hidden) hold(); };
    document.addEventListener('visibilitychange', hide);
    return () => {
      generation.current++; clearFrame(); clearTimeout(cleanupFade.current);
      video.current?.pause(); document.removeEventListener('visibilitychange', hide);
      if (foregroundAction === hold) foregroundAction = null;
    };
  }, []);

  return <span className="selection-animal-media" data-motion={state} data-ready={ready} role="img" aria-label={name}>
    <video ref={video} src={asset.video} muted playsInline preload="auto" controls={false}
      onLoadedData={loaded} onSeeked={reveal} onPlaying={() => { if (!video.current?.requestVideoFrameCallback) reveal(); }}
      onEnded={hold} onError={hold} aria-hidden="true" />
    <canvas ref={cover} aria-hidden="true" />
  </span>;
}
