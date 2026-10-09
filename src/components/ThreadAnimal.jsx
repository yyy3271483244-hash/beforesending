import { useI18n } from "../i18n/Language";import { useEffect, useRef, useState } from 'react';
import { listenThreadEvents, THREAD_ACTIONS } from '../animation/threadEvents';
import { AdministratorCharacter } from './AdministratorSystem';

export default function ThreadAnimal({ docked = false }) {const { t, locale } = useI18n();
  const [activity, setActivity] = useState('idle');
  const timer = useRef(null);
  useEffect(() => {
    const stop = listenThreadEvents((event) => {
      const states = {
        [THREAD_ACTIONS.typing]: 'writing', [THREAD_ACTIONS.delete]: 'collecting',
        [THREAD_ACTIONS.pause]: 'waiting', [THREAD_ACTIONS.replay]: 'sewing',
        [THREAD_ACTIONS.threadPull]: 'thread'
      };
      setActivity(states[event.action] || 'idle');
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setActivity('idle'), 1300);
    });
    return () => {stop();clearTimeout(timer.current);};
  }, []);
  return <aside className={`bs-thread-animal ${docked ? 'is-docked' : ''}`} aria-label={t("陪伴管理员")}>
    <div className="bs-thread-animal__viewport"><AdministratorCharacter activity={activity} /></div>
  </aside>;
}
