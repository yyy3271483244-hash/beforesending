import { useEffect, useRef, useState } from 'react';

export function StampButton({ label, children, size = 'medium', onClick, disabled = false, className = '', ...props }) {
  const [pressed, setPressed] = useState(false);
  const timer = useRef(null);
  const enabled = useRef(!disabled);
  enabled.current = !disabled;
  useEffect(() => () => clearTimeout(timer.current), []);
  function activate(event) {
    if (disabled || timer.current) return;
    const currentTarget = event.currentTarget;
    setPressed(true);
    timer.current = setTimeout(() => {
      timer.current = null;
      setPressed(false);
      if (enabled.current) onClick?.({ ...event, currentTarget });
    }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 120);
  }
  return <button {...props} type="button" className={`stamp-button stamp-button--${size} ${className}`} disabled={disabled} data-pressed={pressed} onClick={activate}>
    <span className="stamp-button-face">
      <img src="/assets/paper-ticket-button.png" alt="" draggable={false} width="1645" height="488" />
      <span className="stamp-button-label">{label ?? children}</span>
    </span>
  </button>;
}
