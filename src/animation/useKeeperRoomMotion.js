import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

export function useKeeperRoomMotion(root, active, scene, choosing) {
  const controls = useRef({ respond() {}, detail() {} });

  useLayoutEffect(() => {
    if (!active) return;
    const node = root.current, art = node.querySelector('.keeper-room-art');
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const layers = [...node.querySelectorAll('[data-depth]')];
      const motions = layers.map(layer => ({
        amount: Number(layer.dataset.depth),
        x: gsap.quickTo(layer, 'x', { duration: 1.2, ease: 'sine.out' }),
        y: gsap.quickTo(layer, 'y', { duration: 1.2, ease: 'sine.out' }),
      }));
      const character = node.querySelector('[data-motion="keeper"]');
      const detailNodes = [...node.querySelectorAll('[data-detail-motion]')];
      let idleTimer, characterTween, detailTween, lightTween;
      let currentDetail = null;

      function respond(showNote = true) {
        if (characterTween?.isActive()) return;
        characterTween = gsap.timeline().to(character, { y: scene.number === '02' ? -1 : -2.5, duration: .5, ease: 'sine.inOut' })
          .to(character, { y: 0, duration: .7, ease: 'sine.inOut' }, '+=.15');
        if (showNote && scene.number === '04') detail('note');
      }
      function detail(id, automatic = false) {
        const definition = scene.details.find(item => item.id === id);
        if (!definition || currentDetail === id && detailTween?.isActive()) return;
        detailTween?.kill();
        // One object gesture at a time, including the archive's drawers.
        gsap.set(detailNodes, { x: 0, y: 0 });
        node.querySelectorAll('[data-open]').forEach(el => el.removeAttribute('data-open'));
        currentDetail = id;
        const target = node.querySelector(`[data-detail-motion="${id}"]`);
        target.parentElement.dataset.open = 'true';
        detailTween = gsap.timeline({ onComplete: () => { currentDetail = null; target.parentElement.removeAttribute('data-open'); } })
          .to(target, { x: (definition.dx || 0) * (automatic ? .65 : 1), y: (definition.dy || 0) * (automatic ? .65 : 1), duration: .7, ease: 'sine.inOut' })
          .to(target, { x: 0, y: 0, duration: .9, ease: 'sine.inOut' }, '+=.5');
      }
      function schedule() {
        const [min, max] = scene.idleDelay;
        idleTimer = setTimeout(() => {
          if (document.visibilityState === 'visible') {
            respond(false);
            const candidates = scene.details.filter(item => scene.number !== '04' || item.drawer);
            if (!detailTween?.isActive() && candidates.length) detail(candidates[Math.floor(Math.random() * candidates.length)].id, true);
            const light = node.querySelector('.keeper-window-light');
            if (light) lightTween = gsap.timeline().to(light, { opacity: .03, duration: 3 }).to(light, { opacity: 0, duration: 3 });
          }
          schedule();
        }, (min + Math.random() * (max - min)) * 1000);
      }
      function move(event) {
        if (event.pointerType !== 'mouse' || event.buttons) return;
        const bounds = art.getBoundingClientRect();
        const x = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
        const y = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1));
        motions.forEach(layer => { layer.x(x * layer.amount); layer.y(y * layer.amount); });
      }
      function reset() { motions.forEach(layer => { layer.x(0); layer.y(0); }); }
      controls.current = { respond, detail };
      art.addEventListener('pointermove', move); art.addEventListener('pointerleave', reset);
      schedule();
      return () => {
        clearTimeout(idleTimer); characterTween?.kill(); detailTween?.kill(); lightTween?.kill();
        motions.forEach(layer => { layer.x.tween.kill(); layer.y.tween.kill(); });
        gsap.set([...layers, character, ...detailNodes], { clearProps: 'transform' });
        const light = node.querySelector('.keeper-window-light');
        if (light) gsap.set(light, { opacity: 0 });
        node.querySelectorAll('[data-open]').forEach(el => el.removeAttribute('data-open'));
        art.removeEventListener('pointermove', move); art.removeEventListener('pointerleave', reset);
        controls.current = { respond() {}, detail() {} };
      };
    });
    return () => media.revert();
  }, [active, scene]);

  useLayoutEffect(() => { if (choosing) controls.current.respond(); }, [choosing]);
  return controls;
}
