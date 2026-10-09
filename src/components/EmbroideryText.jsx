import { useMemo } from 'react';
import { splitGraphemes } from '../trace/graphemes.mjs';

export function EmbroideryText({ text = '', style = {}, fresh, tokenIds = [], className = '' }) {
  const parts = useMemo(() => splitGraphemes(text), [text]);
  return <div className={`embroidered-text-layer ${className}`} aria-hidden="true"
    data-stitch-family={style.family || 'fine'} data-stitch-size={style.size || 'medium'}
    style={{ '--active-thread': style.color || '#8f5968', '--fresh-stitch-duration': `${fresh?.duration || 170}ms` }}>
    {parts.map((part) => {
      const newlyStitched = fresh && part.start < fresh.end && part.end > fresh.start;
      const tokenKey = tokenIds.slice(part.start, part.end).join('.') || `${part.start}:${part.text}`;
      return <span key={tokenKey} data-char-start={part.start}
        className={newlyStitched ? 'embroidered-character is-forming' : 'embroidered-character'}
        data-stitch-token={newlyStitched ? fresh.key : undefined}>{part.text}</span>;
    })}
  </div>;
}

export function DeletionStitch({ effect, position, color, style = {} }) {
  if (!effect) return null;
  const concealed = effect.mode === 'backside';
  return <div key={effect.sequenceId || effect.id} className={`writing-deletion-visual ${concealed ? 'is-concealing' : 'is-unpicking'}`}
    aria-hidden="true" data-stitch-family={style.family || 'fine'} data-stitch-size={style.size || 'medium'}
    style={{ left: position?.x || 0, top: position?.y || 0, '--active-thread': color || style.color || '#8f5968', '--deletion-duration': `${effect.duration || 190}ms` }}>
    <span className="writing-deletion-words">{effect.deleted}</span>
    {concealed && <svg className="writing-deletion-needlework" viewBox="0 0 220 64" preserveAspectRatio="none">
      <path className="paper-puncture" d="M8 23 Q48 39 88 24" />
      <ellipse className="needle-entry-hole" cx="18" cy="40" rx="3.5" ry="1.8" />
      <ellipse className="needle-exit-hole" cx="194" cy="18" rx="3.5" ry="1.8" />
      <path className="conceal-thread-path" pathLength="100" d="M18 40 C48 59 63 19 101 35 S151 52 194 18" />
      <g className="conceal-needle">
        <path className="needle-shaft" d="M0 48 L36 31 L31 39 Z" />
        <ellipse cx="32" cy="34" rx="3.2" ry="1.8" transform="rotate(-25 32 34)" />
        <path className="needle-point" d="M33 33 L39 30 L36 36" />
      </g>
    </svg>}
  </div>;
}

export function StitchingThread({ point, color, phase = 'stitching' }) {
  if (!point?.width || !point?.height) return null;
  const width = point.width, height = point.height;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const eyeX = point.x - 52;
  const eyeY = point.y + 27;
  const progress = eyeX / width;
  const spoolX = clamp(width * (.86 - progress), 12, width - 18);
  const verticalGap = Math.min(145, Math.max(82, height * .18));
  const spoolY = eyeY + verticalGap <= height - 22 ? eyeY + verticalGap : Math.max(22, eyeY - verticalGap);
  const dx = eyeX - spoolX, dy = eyeY - spoolY;
  const slack = Math.min(64, Math.max(24, Math.hypot(dx, dy) * .13));
  const controlOneX = spoolX + dx * .25;
  const controlOneY = spoolY + dy * .25 + slack;
  const controlTwoX = spoolX + dx * .74;
  const controlTwoY = Math.max(20, eyeY - Math.min(48, slack * .8));
  const path = `M ${spoolX} ${spoolY} C ${controlOneX} ${controlOneY}, ${controlTwoX} ${controlTwoY}, ${eyeX} ${eyeY}`;
  return <svg className={`stitching-thread-overlay is-${phase}`} viewBox={`0 0 ${point.width} ${point.height}`} preserveAspectRatio="none" aria-hidden="true"
    style={{ width, height, '--active-thread': color || '#8f5968' }}>
    <path className="stitching-thread-path" d={path} />
    <circle className="stitching-spool" cx={spoolX} cy={spoolY} r="13" />
    <path className="stitching-spool-core" d={`M ${spoolX - 3} ${spoolY + 1} q 3 -6 6 -2 q 2 3 -2 4 q -3 1 -2 -2`} />
    <path className="stitching-spool-wind" d={`M ${spoolX - 9} ${spoolY - 1} q 6 -9 15 -2 q 5 5 -3 9 q -8 4 -11 -3 M ${spoolX - 8} ${spoolY + 6} q 6 -5 13 -1`} />
  </svg>;
}

export function EmbroideryNeedle({ point, color, phase = 'stitching' }) {
  if (!point) return null;
  return <span className={`active-embroidery-needle is-${phase}`} aria-hidden="true"
    style={{ left: point.x - 68, top: point.y - 2, '--active-thread': color || '#8f5968' }}>
    <svg viewBox="0 0 72 36" focusable="false">
      <path className="needle-body" d="M9 30 L68 2 L56 14 L12 33 Z" />
      <path className="needle-highlight" d="M16 28 L60 7" />
      <ellipse className="needle-eye" cx="16" cy="29" rx="3.6" ry="2.2" transform="rotate(-25 16 29)" />
    </svg>
  </span>;
}
