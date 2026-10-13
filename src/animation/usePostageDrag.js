import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { attachedStampBounds, stampEntersEnvelope } from './postageGeometry.mjs';

export function usePostageDrag({ enabled, flipped, envelopeRef, flipVideoRef, onFlipped, onAttach }) {
  const [phase, setPhase] = useState('idle');
  const [dragStamp, setDragStamp] = useState(null);
  const [flipMode, setFlipMode] = useState(null);
  const [flipPlaying, setFlipPlaying] = useState(false);
  const phaseRef = useRef('idle');
  const gesture = useRef(null), stampMotion = useRef(null), ghostRef = useRef(null);
  const animation = useRef(null), frame = useRef(null);
  const callbacks = useRef({ onFlipped, onAttach });
  callbacks.current = { onFlipped, onAttach };

  function changePhase(next) { phaseRef.current = next; setPhase(next); }
  function stopMotion() {
    animation.current?.kill();
    animation.current = null;
    cancelAnimationFrame(frame.current);
    frame.current = null;
    flipVideoRef.current?.pause();
  }
  function reset() {
    stopMotion();
    gesture.current = null;
    stampMotion.current = null;
    setDragStamp(null);
    setFlipMode(null);
    setFlipPlaying(false);
    changePhase('idle');
  }
  useEffect(() => {
    if (!enabled) reset();
  }, [enabled]);
  useEffect(() => stopMotion, []);

  // Pointer moves only repaint the floating stamp, not the twelve-stamp tray.
  function paintGhost() {
    const current = stampMotion.current;
    if (ghostRef.current && current) gsap.set(ghostRef.current, { left: current.x, top: current.y, width: current.width, height: current.height, rotation: current.rotation });
    frame.current = null;
  }
  useLayoutEffect(() => {
    if (!dragStamp || !ghostRef.current) return;
    paintGhost();
    gsap.set(ghostRef.current, { rotation: dragStamp.rotation });
  }, [dragStamp]);

  function startDrag(event, item) {
    if (!enabled || phaseRef.current !== 'idle' || !event.isPrimary || event.button !== 0) return;
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const image = button.querySelector('img');
    const aspectRatio = image.naturalWidth / image.naturalHeight;
    if (!Number.isFinite(aspectRatio) || aspectRatio <= 0) return;
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    const width = button.offsetWidth * item.scale * 1.035;
    const origin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, rotation: item.position[2] };
    gesture.current = {
      pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
      offsetX: event.clientX - origin.x, offsetY: event.clientY - origin.y,
    };
    stampMotion.current = { ...origin, id: item.id, image: item.image, width, height: width / aspectRatio, aspectRatio, origin };
  }
  function moveDrag(event) {
    const pointer = gesture.current;
    const current = stampMotion.current;
    if (!pointer || pointer.pointerId !== event.pointerId || !current) return;
    if (phaseRef.current === 'idle') {
      if (Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY) < 5) return;
      changePhase('dragging');
      setDragStamp({ ...current });
    }
    if (phaseRef.current !== 'dragging') return;
    current.x = event.clientX - pointer.offsetX;
    current.y = event.clientY - pointer.offsetY;
    if (!frame.current) frame.current = requestAnimationFrame(paintGhost);

    // The whole envelope is a target. Capture the interaction before pointerup.
    if (stampEntersEnvelope(current, envelopeRef.current?.getBoundingClientRect())) {
      const bounds = envelopeRef.current.getBoundingClientRect();
      const target = attachedStampBounds(bounds, current.aspectRatio);
      current.x = target.x;
      current.y = target.y;
      current.width = target.width;
      current.height = target.height;
      current.rotation = target.rotation;
      paintGhost();
      changePhase(flipped ? 'placing' : 'flipping');
      setFlipPlaying(false);
      setFlipMode(flipped ? null : 'video');
    }
  }
  function returnToTray() {
    const current = stampMotion.current;
    if (!current || !ghostRef.current) { reset(); return; }
    changePhase('returning');
    cancelAnimationFrame(frame.current);
    frame.current = null;
    animation.current = gsap.to(ghostRef.current, {
      left: current.origin.x, top: current.origin.y, rotation: current.origin.rotation,
      duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? .01 : .3,
      ease: 'power2.out', onComplete: reset,
    });
  }
  function finishDrag(event) {
    if (gesture.current?.pointerId !== event.pointerId) return;
    if (phaseRef.current === 'dragging') moveDrag(event);
    gesture.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (phaseRef.current === 'dragging') returnToTray();
    else if (phaseRef.current === 'idle') stampMotion.current = null;
  }
  function cancelDrag(event) {
    if (gesture.current?.pointerId !== event.pointerId) return;
    gesture.current = null;
    // Once accepted by the envelope, releasing/cancelling the pointer cannot undo the handoff.
    if (phaseRef.current === 'dragging') returnToTray();
    else if (phaseRef.current === 'idle') stampMotion.current = null;
  }
  function finishFlip() {
    if (phaseRef.current !== 'flipping') return;
    flipVideoRef.current?.pause();
    setFlipPlaying(false);
    callbacks.current.onFlipped();
    changePhase('placing');
  }
  function fallbackFlip() {
    if (phaseRef.current !== 'flipping') return;
    setFlipPlaying(false);
    setFlipMode('css');
  }
  function videoPlaying() {
    if (phaseRef.current === 'flipping' && flipMode === 'video') setFlipPlaying(true);
  }
  useEffect(() => {
    if (phase !== 'flipping') return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { finishFlip(); return; }
    if (flipMode === 'css') {
      const timer = setTimeout(finishFlip, 1000);
      return () => clearTimeout(timer);
    }
    const video = flipVideoRef.current;
    if (!video || !video.canPlayType('video/webm; codecs="vp9"')) { fallbackFlip(); return; }
    let disposed = false;
    video.currentTime = 0;
    video.playbackRate = 1;
    const timer = setTimeout(() => { if (!disposed) fallbackFlip(); }, 5000);
    video.play().catch(() => { if (!disposed) fallbackFlip(); });
    return () => { disposed = true; clearTimeout(timer); video.pause(); };
  }, [phase, flipMode]);

  useLayoutEffect(() => {
    if (phase !== 'placing' || !ghostRef.current || !stampMotion.current || !envelopeRef.current) return;
    const current = stampMotion.current;
    callbacks.current.onAttach(current.id);
    setDragStamp(null);
    stampMotion.current = null;
    changePhase('attached');
  }, [phase]);

  return { phase, dragStamp, ghostRef, flipMode, flipPlaying, startDrag, moveDrag, finishDrag, cancelDrag, finishFlip, fallbackFlip, videoPlaying };
}
