import { useEffect, useRef, useState } from 'react';
import { clearPaperMatte } from '../animation/postagePaperCutout.mjs';

export function PostagePaperBack({ src, style }) {
  const canvasRef = useRef(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let disposed = false;
    const image = new Image();
    image.onload = () => {
      const canvas = canvasRef.current;
      if (disposed || !canvas) return;
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) { setFailed(true); return; }
      context.drawImage(image, 0, 0);
      const frame = context.getImageData(0, 0, canvas.width, canvas.height);
      frame.data.set(clearPaperMatte(frame.data, canvas.width, canvas.height));
      context.putImageData(frame, 0, 0);
      canvas.dataset.cutoutState = 'ready';
    };
    image.onerror = () => { if (!disposed) setFailed(true); };
    image.src = src;
    return () => { disposed = true; image.onload = null; image.onerror = null; };
  }, [src]);
  if (failed) return <img className="send-envelope-flip-still is-back is-paper-back" src={src} style={style} alt="" draggable={false} />;
  return <canvas ref={canvasRef} className="send-envelope-flip-still is-back is-cutout-back" style={style} data-cutout-state="loading" aria-hidden="true" />;
}
