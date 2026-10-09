import { useEffect, useRef } from "react";
import { listenThreadEvents, THREAD_ACTIONS } from "../animation/threadEvents";

function buildPoints(events = []) {
  let x = 24;
  let y = 44;
  return events
    .filter((event) => event.type === "input" || event.type === "pause" || event.type === "delete" || event.type === "revision")
    .slice(-120)
    .map((event, index) => {
      const isBack = event.action === "erase" || event.type === "delete";
      const isPause = event.type === "pause";
      x += isBack ? -10 : 14 + (index % 4);
      if (x > 330) {
        x = 28 + (index % 3) * 8;
        y += 28;
      }
      return {
        x,
        y: y + Math.sin(index * 1.7) * 9 + (isPause ? 7 : 0),
        kind: isPause ? "knot" : isBack ? "back" : "forward",
      };
    });
}

export default function StitchTraceCanvas({ events = [], active = false }) {
  const hostRef = useRef(null);
  const sketchRef = useRef(null);
  const pointsRef = useRef(buildPoints(events));

  useEffect(() => {
    pointsRef.current = buildPoints(events);
  }, [events]);

  useEffect(() => {
    if (!hostRef.current) return undefined;

    let cancelled = false;
    let instance = null;
    const sketch = (p) => {
      p.setup = () => {
        const canvas = p.createCanvas(360, 220);
        canvas.parent(hostRef.current);
        p.pixelDensity(Math.min(2, window.devicePixelRatio || 1));
        p.noLoop();
      };

      p.draw = () => {
        p.clear();
        const points = pointsRef.current;
        p.strokeWeight(1.6);
        p.stroke(137, 44, 48, 178);
        p.noFill();
        points.forEach((point, index) => {
          const previous = points[index - 1];
          if (!previous) return;
          if (point.kind === "back") p.drawingContext.setLineDash([4, 5]);
          else p.drawingContext.setLineDash([]);
          p.line(previous.x, previous.y, point.x, point.y);
          if (point.kind === "knot") {
            p.drawingContext.setLineDash([]);
            p.ellipse(point.x, point.y, 10, 7);
            p.ellipse(point.x + 3, point.y - 2, 6, 5);
          }
        });
      };
    };

    import("p5").then((module) => {
      if (cancelled) return;
      const P5 = module.default || module;
      instance = new P5(sketch);
      sketchRef.current = instance;
    });

    return () => {
      cancelled = true;
      instance?.remove();
      sketchRef.current?.remove();
      sketchRef.current = null;
    };
  }, []);

  useEffect(() => {
    sketchRef.current?.redraw();
  }, [events, active]);

  useEffect(() => listenThreadEvents((event) => {
    if (
      event.action === THREAD_ACTIONS.typing ||
      event.action === THREAD_ACTIONS.delete ||
      event.action === THREAD_ACTIONS.pause ||
      event.action === THREAD_ACTIONS.replay
    ) {
      window.requestAnimationFrame(() => sketchRef.current?.redraw());
    }
  }), []);

  return <div className="bs-stitch-canvas" ref={hostRef} aria-hidden="true" />;
}
