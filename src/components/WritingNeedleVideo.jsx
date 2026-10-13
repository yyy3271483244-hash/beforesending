import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import '../writing-needle-video.css';
import fullAnimationLayout from '../data/fullAnimationLayout.json';
import { needleActionDurations as actionDuration, needleVideoClips as actionClips, isNeedleReturnAction } from '../animation/writingNeedleActions.mjs';

export const WritingNeedleVideo = forwardRef(function WritingNeedleVideo({ point, visible }, ref) {
  const layer = useRef(null);
  const needleEyeAnchor = useRef(null);
  const threadPath = useRef(null);
  const threadEcho = useRef(null);
  const threadFrame = useRef(null);
  const threadShape = useRef(null);
  const timer = useRef(null);
  const completion = useRef(null);
  const actionRef = useRef('idle');
  const [action, setAction] = useState('idle');
  const [size, setSize] = useState({ width: 900, height: 620 });
  const nativeVideos = useRef({});
  const requestId = useRef(0);
  const [nativePlaying, setNativePlaying] = useState(false);

  function completeAction(current, request = requestId.current) {
    if (request !== requestId.current || actionRef.current !== current) return;
    requestId.current += 1;
    clearTimeout(timer.current);
    nativeVideos.current[current]?.pause();
    actionRef.current = 'idle';
    setAction('idle');
    setNativePlaying(false);
    const callback = completion.current;
    completion.current = null;
    callback?.();
  }

  useEffect(() => {
    if (!layer.current) return undefined;
    const observer = new ResizeObserver(([entry]) => setSize({
      width: entry.contentRect.width || 900,
      height: entry.contentRect.height || 620,
    }));
    observer.observe(layer.current);
    return () => observer.disconnect();
  }, []);

  useImperativeHandle(ref, () => ({
    play(nextAction, onComplete) {
      if (isNeedleReturnAction(actionRef.current)) return false;
      clearTimeout(timer.current);
      completion.current = onComplete || null;
      actionRef.current = nextAction;
      setAction(nextAction);
      setNativePlaying(false);
      const request = ++requestId.current;
      for (const video of Object.values(nativeVideos.current)) video?.pause();
      const video = nativeVideos.current[nextAction];
      const clip = actionClips[nextAction];
      if (video && clip && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        video.currentTime = 0;
        video.playbackRate = 1;
        video.play().then(() => {
          if (requestId.current === request) setNativePlaying(true);
        }).catch(() => {
          if (requestId.current === request) {
            clearTimeout(timer.current);
            timer.current = setTimeout(() => completeAction(nextAction, request), actionDuration[nextAction]);
          }
        });
        timer.current = setTimeout(() => completeAction(nextAction, request), fullAnimationLayout.needle[clip].duration * 1000 + 4000);
      } else timer.current = setTimeout(() => completeAction(nextAction, request), actionDuration[nextAction] || 700);
      return true;
    },
    stop() {
      clearTimeout(timer.current);
      actionRef.current = 'idle';
      completion.current = null;
      setAction('idle');
      requestId.current += 1;
      setNativePlaying(false);
      for (const video of Object.values(nativeVideos.current)) video?.pause();
    },
  }), []);

  useEffect(() => () => { clearTimeout(timer.current); for (const video of Object.values(nativeVideos.current)) video?.pause(); }, []);

  const caret = point || { x: size.width * .18, y: size.height * .28 };
  const needle = {
    ...caret,
    x: Math.min(size.width - 52, caret.x + 18),
  };
  const spool = {
    x: size.width + Math.max(78, size.width * .09),
    y: size.height + 42,
  };
  // The supplied needle slopes from its point at bottom-left to its eye at
  // top-right. These offsets match the displayed asset, so the thread ends
  // inside the eye instead of beside the image.
  const needleEye = { x: needle.x + 31, y: needle.y - 27 };
  const initialDx = needleEye.x - spool.x;
  const initialSlack = Math.min(92, Math.max(46, Math.abs(initialDx) * .13));
  const initialPath = `M ${spool.x} ${spool.y} C ${spool.x + initialDx * .22} ${spool.y + 28}, ${spool.x + initialDx * .7} ${needleEye.y + initialSlack}, ${needleEye.x + 18} ${needleEye.y + 5} C ${needleEye.x + 8} ${needleEye.y + 2}, ${needleEye.x + 3} ${needleEye.y}, ${needleEye.x} ${needleEye.y}`;
  const motionStyle = {
    '--needle-x': `${needle.x}px`, '--needle-y': `${needle.y}px`,
    '--spool-x': `${spool.x}px`, '--spool-y': `${spool.y}px`,
    '--return-x': `${spool.x - needle.x - 28}px`, '--return-y': `${spool.y - needle.y + 19}px`,
  };
  function nativeStyle(clip, current) {
    const geometry = fullAnimationLayout.needle[clip];
    const anchor = geometry.spool || { x: geometry.width * .86, y: geometry.height * .82, width: 74 };
    const displayedSpoolWidth = Math.max(60, Math.min(size.width * .09, 90));
    const scale = displayedSpoolWidth / anchor.width;
    return { left: spool.x - anchor.x * scale, top: spool.y - anchor.y * scale,
      width: geometry.width * scale, height: geometry.height * scale,
      opacity: nativePlaying && action === current ? 1 : 0 };
  }

  useEffect(() => {
    const root = layer.current;
    const anchor = needleEyeAnchor.current;
    if (!root || !anchor) return undefined;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mix = (from, to, amount) => from + (to - from) * amount;
    function update(time) {
      const rootRect = root.getBoundingClientRect();
      const eyeRect = anchor.getBoundingClientRect();
      const eye = { x: eyeRect.left - rootRect.left, y: eyeRect.top - rootRect.top };
      const dx = eye.x - spool.x;
      const dy = eye.y - spool.y;
      const distance = Math.hypot(dx, dy);
      const gravitySag = Math.min(320, Math.max(110, distance * .43));
      const breath = reduced ? 0 : Math.sin(time / 760) * Math.min(2.2, distance * .004);
      const target = {
        // Leave the spool almost horizontally, then let gravity pull the
        // middle of the cotton thread down before it rises into the eye.
        c1x: spool.x + dx * .36,
        c1y: spool.y + 6 + breath,
        c2x: eye.x - dx * .14,
        c2y: eye.y + gravitySag - breath,
      };
      const shape = threadShape.current || { ...target };
      // The spool side carries more inertia; the needle side responds quickly.
      shape.c1x = mix(shape.c1x, target.c1x, .055);
      shape.c1y = mix(shape.c1y, target.c1y, .045);
      shape.c2x = mix(shape.c2x, target.c2x, .18);
      shape.c2y = mix(shape.c2y, target.c2y, .16);
      threadShape.current = shape;
      const d = `M ${spool.x} ${spool.y} C ${shape.c1x} ${shape.c1y}, ${shape.c2x} ${shape.c2y}, ${eye.x} ${eye.y}`;
      const echo = `M ${spool.x + 1} ${spool.y + 1} C ${shape.c1x + 1} ${shape.c1y + 1.5}, ${shape.c2x - 1} ${shape.c2y + 1}, ${eye.x} ${eye.y + 1}`;
      threadPath.current?.setAttribute('d', d);
      threadEcho.current?.setAttribute('d', echo);
      threadFrame.current = requestAnimationFrame(update);
    }
    threadFrame.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(threadFrame.current);
  }, [spool.x, spool.y]);

  return <div ref={layer} className={`writing-needle-system is-${action}${visible ? ' is-visible' : ''}`} data-native-playing={nativePlaying} data-animation-source={nativePlaying ? 'video' : 'svg-css'} style={motionStyle} aria-hidden="true">
    {Object.entries(actionClips).map(([current, clip]) => <video key={current}
      ref={node => { nativeVideos.current[current] = node; }}
      className="writing-needle-native-video" src={`${import.meta.env.BASE_URL}assets/animation-full/v1/needle/${clip}.webm`}
      muted playsInline preload="auto" style={nativeStyle(clip, current)}
      onEnded={() => completeAction(current)} onError={() => actionRef.current === current && completeAction(current)} />)}
    <svg className="writing-thread-svg" viewBox={`0 0 ${size.width} ${size.height}`} preserveAspectRatio="none">
      <path ref={threadEcho} className="writing-thread-line is-echo" d={initialPath} />
      <path ref={threadPath} className="writing-thread-line" d={initialPath} />
    </svg>
    <img className="writing-spool-image" src={`${import.meta.env.BASE_URL}assets/writing-desk/needle-assets/spool.png`} alt="" draggable={false} />
    <span className="writing-needle-carriage">
      <img className="writing-needle-image" src={`${import.meta.env.BASE_URL}assets/writing-desk/needle-assets/needle-clean.png`} alt="" draggable={false} />
      <i ref={needleEyeAnchor} className="writing-needle-eye-anchor" />
    </span>
  </div>;
});
