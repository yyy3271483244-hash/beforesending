import { useI18n } from "../i18n/Language";import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

let activeMotion = null;

export function AnimalMedia({ asset, idle, name, actionToken, onActionEnd }) {const { t, locale } = useI18n();
  const video = useRef(null),loopVideo = useRef(null),root = useRef(null),finished = useRef(false);
  const fadeTimer = useRef(null), started = useRef(false), frame = useRef(null);
  const callback = useRef(onActionEnd);callback.current = onActionEnd;
  const [playing, setPlaying] = useState(false),[ready, setReady] = useState(false),[settled, setSettled] = useState(false),[looping, setLooping] = useState(false);
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    video.current?.pause();
    loopVideo.current?.pause();
    if (asset.holdAfterEnd) {
      setPlaying(false);setReady(true);setSettled(true);
      if (activeMotion === finish) activeMotion = null;
      return;
    }
    setPlaying(false);setReady(false);setSettled(true);
    setLooping(false);
    if (activeMotion === finish) activeMotion = null;
    clearTimeout(fadeTimer.current);
    fadeTimer.current = setTimeout(() => callback.current?.(), 240);
  }, [asset.holdAfterEnd]);
  useLayoutEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(media.matches);
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);
  useEffect(() => {
    finished.current = false;
    started.current = false;
    setSettled(false);setReady(false);setLooping(false);
    setPlaying(Boolean(asset.video) && !reduced);
    frame.current = requestAnimationFrame(() => {
      if (video.current?.readyState >= 2 && asset.video && !reduced) play();
      else if (!asset.video || reduced) setReady(asset.src !== idle.src || Boolean(asset.video));
    });
    const timer = !asset.loopVideo && (asset.video || callback.current) ? setTimeout(finish, asset.video && !reduced ? (asset.duration + 8) * 1000 : 1300) : null;
    return () => {clearTimeout(timer);clearTimeout(fadeTimer.current);cancelAnimationFrame(frame.current);video.current?.pause();loopVideo.current?.pause();if (activeMotion === finish) activeMotion = null;};
  }, [asset, actionToken, reduced, finish, idle.src]);
  function play() {
    if (finished.current || reduced || started.current || !video.current) return;
    if (root.current?.checkVisibility && !root.current.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) {finish();return;}
    if (activeMotion !== finish) activeMotion?.();
    activeMotion = finish;
    started.current = true;
    video.current.currentTime = 0;
    video.current.play().then(() => { if (!finished.current) setReady(true); }).catch(finish);
  }
  function startLoop() {
    if (!asset.loopVideo || reduced || finished.current || !loopVideo.current) { finish(); return; }
    loopVideo.current.currentTime = 0;
    loopVideo.current.play().then(() => {
      if (finished.current) return;
      setLooping(true);
      video.current?.pause();
    }).catch(finish);
  }
  useEffect(() => () => {if (activeMotion === finish) activeMotion = null;}, []);
  return <span ref={root} className="animal-media" data-motion={playing && ready ? 'playing' : 'still'}>
    <img src={settled && asset.holdAfterEnd ? asset.poster : idle.src} alt={t("{0}管理员", name)} draggable="false" style={{ opacity: ready ? 0 : 1 }} />
    {(!asset.video || reduced) && asset.src !== idle.src && <img className="animal-action-image" src={reduced && asset.video ? asset.poster : asset.src} alt="" draggable="false" style={{ opacity: ready ? 1 : 0 }} />}
    {asset.video && !reduced && <>
      <video ref={video} key={`${asset.video}:${actionToken || 0}`} src={asset.video} poster={asset.poster || asset.src}
          muted playsInline preload="auto" controls={false} onLoadedData={play} onEnded={asset.loopVideo ? startLoop : finish} onError={finish}
          style={{ opacity: ready && !looping ? 1 : 0, transition: 'opacity 140ms linear' }} aria-hidden="true" />
      {asset.loopVideo && <video ref={loopVideo} src={asset.loopVideo} muted playsInline preload="auto" loop controls={false}
        onError={finish} style={{ opacity: ready && looping ? 1 : 0, transition: 'opacity 140ms linear' }} aria-hidden="true" />}
    </>}
  </span>;
}
