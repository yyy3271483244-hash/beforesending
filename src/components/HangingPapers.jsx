import { useEffect, useRef } from 'react';
import './hanging-papers.css';

const papers = [
  { id: 'left', x: 452, y: 556, w: 101, h: 84, origin: '52% 8%', angle: 2, duration: 1050 },
  { id: 'middle', x: 606, y: 556, w: 77, h: 92, origin: '44% 15%', angle: 1.6, duration: 1120 },
  { id: 'right', x: 841, y: 552, w: 108, h: 83, origin: '54% 13%', angle: 2.3, duration: 980 },
];

function HangingPaper({ paper, active, currentMotion }) {
  const root = useRef(null), animation = useRef(null);
  function stop() {
    animation.current?.cancel();
    animation.current = null;
    if (root.current) root.current.dataset.moving = 'false';
  }
  useEffect(() => { if (!active) stop(); return stop; }, [active]);
  function sway() {
    if (!active || animation.current || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    currentMotion.current?.();
    currentMotion.current = stop;
    root.current.dataset.moving = 'true';
    const angles = [0, 1, -1.6 / 2.2, 1 / 2.2, -.5 / 2.2, .2 / 2.2, 0];
    const offsets = [0, .18, .38, .58, .76, .9, 1];
    const skew = [0, .3, -.2, .12, -.06, .02, 0];
    const motion = root.current.querySelector('.hanging-paper-cutout').animate(angles.map((angle, i) => ({
      offset: offsets[i], transform: `rotate(${angle * paper.angle}deg) translateY(${i > 0 && i < 6 ? .6 : 0}px) skewX(${skew[i]}deg)`,
    })), { duration: paper.duration, easing: 'ease-out', iterations: 1 });
    animation.current = motion;
    motion.onfinish = stop;
  }
  const path = `${import.meta.env.BASE_URL}assets/stamp-scene/hanging-${paper.id}`;
  return <div ref={root} className="hanging-paper-hit" aria-hidden="true" onPointerEnter={sway}
    style={{ left: `${paper.x / 17.28}%`, top: `${paper.y / 9.10}%`, width: `${paper.w / 17.28}%`, height: `${paper.h / 9.10}%`, '--paper-pivot': paper.origin }}>
    <img className="hanging-paper-wall" src={`${path}-wall.png`} alt="" draggable={false} />
    <img className="hanging-paper-cutout" src={`${path}.png`} alt="" draggable={false} />
    <img className="hanging-paper-clip" src={`${path}-clip.png`} alt="" draggable={false} />
  </div>;
}

export function HangingPapers({ active }) {
  const currentMotion = useRef(null);
  return papers.map(paper => <HangingPaper key={paper.id} paper={paper} active={active} currentMotion={currentMotion} />);
}
