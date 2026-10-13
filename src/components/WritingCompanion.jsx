import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AdministratorCharacter, useAdministrator } from './AdministratorSystem';
import { listenThreadEvents, THREAD_ACTIONS } from '../animation/threadEvents';
import { reachesDeletionThreshold } from '../trace/deletionRules.mjs';
import '../writing-companion.css';

export function WritingCompanion({ paper, visible, writing }) {
  const { selectedAdministrator } = useAdministrator();
  const root = useRef(null);
  const [motion, setMotion] = useState({ activity: 'pause', token: 0 });
  const current = useRef('pause'), lastDelete = useRef(0), lastActivity = useRef(0), sewingFinished = useRef(false);
  const deletionTimer = useRef(null), pauseTimer = useRef(null), pauseAfterSewing = useRef(false);
  function trigger(activity) {
    current.current = activity;
    setMotion(value => ({ activity, token: value.token + 1 }));
  }
  useLayoutEffect(() => {
    const sheet = paper.current, companion = root.current;
    if (!sheet || !companion) return;
    function place() {
      const height = Math.max(480, Math.min(innerHeight * .55, 590));
      const size = height * .72;
      const sheetRect = sheet.getBoundingClientRect();
      const overlap = Math.min(size * .34, 146);
      const outside = sheetRect.left - size + overlap;
      companion.dataset.placement = sheetRect.left >= 120 ? 'beside' : 'below';
      companion.style.setProperty('--companion-left', `${Math.max(12, outside)}px`);
      const visibleBottom = innerHeight - height - 20;
      const sheetBottom = sheetRect.bottom - height + 20;
      const top = Math.max(12, Math.min(sheetBottom, visibleBottom));
      companion.style.setProperty('--companion-top', `${top}px`);
    }
    place();
    const observer = new ResizeObserver(place);
    observer.observe(sheet); observer.observe(companion);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place);
    };
  }, [paper, visible]);
  useLayoutEffect(() => {
    current.current = 'pause'; sewingFinished.current = false;
    clearTimeout(deletionTimer.current);
    clearTimeout(pauseTimer.current);
    pauseAfterSewing.current = false;
    setMotion(value => ({ activity: 'pause', token: value.token + 1 }));
    if (!writing || !selectedAdministrator) return;
    // Enter the writing view on the keeper's pause pose before the first paint,
    // instead of briefly exposing the generic idle frame.
    lastActivity.current = performance.now();
    trigger('pause');
    function schedulePause() {
      clearTimeout(pauseTimer.current);
      pauseTimer.current = setTimeout(() => {
        if (current.current === 'sewing') pauseAfterSewing.current = true;
        else trigger('pause');
      }, 3000);
    }
    const editor = paper.current?.querySelector('textarea');
    const onEditorInput = event => {
      if (event.isComposing) return;
      lastActivity.current = performance.now();
      pauseAfterSewing.current = false;
      schedulePause();
    };
    editor?.addEventListener('input', onEditorInput);
    const stopListening = listenThreadEvents(event => {
      if (event.action === THREAD_ACTIONS.delete) {
        if (!reachesDeletionThreshold(event.deleted || event.text || '')) return;
        lastDelete.current = lastActivity.current = performance.now();
        pauseAfterSewing.current = false;
        schedulePause();
        clearTimeout(deletionTimer.current);
        if (current.current !== 'sewing' || sewingFinished.current) {
          sewingFinished.current = false;
          trigger('sewing');
        }
        return;
      }
      if (event.action === THREAD_ACTIONS.pause) {
        clearTimeout(pauseTimer.current);
        if (current.current === 'sewing') pauseAfterSewing.current = true;
        else if (current.current !== 'pause') trigger('pause');
      }
      if (event.action === THREAD_ACTIONS.typing) {
        lastActivity.current = performance.now();
        pauseAfterSewing.current = false;
        schedulePause();
      }
    });
    return () => {
      stopListening(); editor?.removeEventListener('input', onEditorInput);
      clearTimeout(deletionTimer.current); clearTimeout(pauseTimer.current);
    };
  }, [paper, writing, selectedAdministrator]);
  function actionEnded() {
    if (current.current === 'sewing') {
      sewingFinished.current = true;
      const settle = () => {
        const remaining = 850 - (performance.now() - lastDelete.current);
        if (remaining > 0) deletionTimer.current = setTimeout(settle, remaining);
        else {
          sewingFinished.current = false;
          const paused = pauseAfterSewing.current || performance.now() - lastActivity.current >= 3000;
          pauseAfterSewing.current = false;
          trigger(paused ? 'pause' : 'idle');
        }
      };
      settle();
      return;
    }
  }
  const activity = writing && selectedAdministrator ? motion.activity : 'idle';
  return <aside ref={root} className="desk-writing-companion"
    data-visible={visible} aria-hidden={!visible} onClick={event => event.stopPropagation()}>
    <AdministratorCharacter className="writing-companion-cutout" writingCutout preplay activity={activity} actionToken={motion.token} onActionEnd={activity === 'sewing' ? actionEnded : undefined} />
  </aside>;
}
