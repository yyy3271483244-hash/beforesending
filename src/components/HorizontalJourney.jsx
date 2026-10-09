import { useEffect, useReducer, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { X } from 'lucide-react';
import { useI18n } from '../i18n/Language';
import { chapters, companions, chapterIndex, draftKey, journeyProgressKey, normalizeJourneyProgress, emptyLetter, chapterFromHash, invalidateDelivery } from '../data/journey.mjs';
import { verticalSections, visualChapter, keeperChapter, availableChapter, isPublicSection, navigationTarget } from '../data/verticalJourney.mjs';
import { journeyScenes } from '../data/journeyScenes';
import { useVerticalJourney } from '../animation/useVerticalJourney';
import { initialWritingWorkflow, writingWorkflowReducer, isLetterConfirmed } from '../data/writingWorkflow.mjs';
import { useAdministrator } from './AdministratorSystem';
import { JourneyWriting } from './JourneyWriting';
import { JourneyCompanion } from './JourneyCompanion';
import { JourneyWaiting } from './JourneyWaiting';
import { JourneyPost } from './JourneyRitual';
import { StampSendScene } from './StampSendScene';
import { GlobalHeader } from './GlobalHeader';
import { useSceneReveal } from '../animation/useSceneReveal';
import { PostOfficeExterior, AnonymousBureau } from './PostOfficeScenes';
import '../horizontal-journey.css';
import '../journey-structure.css';

function loadDraft() {
  try { localStorage.removeItem(draftKey); } catch { /* A fresh in-memory letter still works without storage access. */ }
  return { ...emptyLetter, events: [], fragments: [], knots: [], stitch: [] };
}

function loadProgress() {
  try { return normalizeJourneyProgress(JSON.parse(localStorage.getItem(journeyProgressKey) || '{}')); }
  catch { return normalizeJourneyProgress(); }
}

export function HorizontalJourney() {
  const { language } = useI18n(), en = language === 'en';
  const { selectedAdministrator, select } = useAdministrator();
  const [letter, updateLetter] = useState(loadDraft);
  const [progress, setProgress] = useState(loadProgress);
  const [index, setIndex] = useState(() => navigationTarget(chapterFromHash(location.hash), letter, selectedAdministrator, progress));
  const [workflow, dispatchWorkflow] = useReducer(writingWorkflowReducer, letter, initialWritingWorkflow);
  const [readingBureau, setReadingBureau] = useState(() => index === chapterIndex('bureau'));
  const [keeperReady, setKeeperReady] = useState(() => index >= chapterIndex('write') && index < chapterIndex('bureau'));
  const [busy, setBusy] = useState(false), [notice, setNotice] = useState('');
  const [about, setAbout] = useState(false);
  const keeperStage = useRef('select');
  const root = useRef(null), track = useRef(null), noticeTimer = useRef(null), snapshot = useRef(null), navigationLock = useRef(false);
  useSceneReveal(track);
  snapshot.current = { index, letter, selectedAdministrator, progress, busy };
  function setLetter(value) { updateLetter(previous => invalidateDelivery(previous, typeof value === 'function' ? value(previous) : value)); }
  function commitNavigation(target, historyMode = 'push', behavior = 'smooth', onComplete) {
    if (navigationLock.current) return;
    navigationLock.current = true;
    target = visualChapter(target);
    if (target === chapterIndex('write') && keeperStage.current !== 'confirmed') target = keeperChapter;
    if (target === chapterIndex('write')) {
      dispatchWorkflow({ type: 'REOPEN' });
      // Reopening the task invalidates its old completion before returning to the desk.
      if (snapshot.current.letter.letterConfirmed) flushSync(() => setLetter(current => ({
        ...current, letterConfirmed: false, replayCompletedAt: null, replayConfirmedAt: null,
        packedAt: null, sealedAt: null, stampAppliedAt: null, deliveryEmail: '', sentAt: null,
      })));
    }
    // Explicit reading navigation may reveal the public archive; scrolling cannot unlock it.
    if (readingBureau !== (target === chapterIndex('bureau'))) flushSync(() => setReadingBureau(target === chapterIndex('bureau')));
    setAbout(false);
    document.activeElement?.blur();
    if (location.hash !== '#' + chapters[target][0]) history[historyMode === 'replace' ? 'replaceState' : 'pushState'](null, '', '#' + chapters[target][0]);
    scrollToSection(target, behavior, () => {
      navigationLock.current = false;
      onComplete?.();
    });
  }
  function navigate(target, historyMode = 'push', behavior = 'smooth', allowBusy = false) {
    const state = snapshot.current;
    if (navigationLock.current || (state.busy && !allowBusy) || target < 0 || target >= chapters.length) return state.index;
    target = visualChapter(target);
    const max = availableChapter(state.letter, state.selectedAdministrator, state.progress);
    if (!isPublicSection(target) && target > max) {
      const messages = {
        dog: ['选一位管理员，陪你去书桌吧。', 'Choose a keeper to accompany you to the desk.'],
        write: ['先把这封信写完。', 'Finish your letter first.'],
        stamp: ['请写好收件信息，贴上邮票并封好信。', 'Address, stamp and seal the letter first.'],
        post: ['先把这封信交给邮路。', 'Deliver this letter first.'],
        waiting: ['先陪这封信在邮路上停一会儿。', 'Visit the waiting room first.'],
      };
      const pair = messages[chapters[max][0]] || ['先认识住在这里的四位管理员。', 'Meet the four administrators first.'];
      setNotice(pair[en ? 1 : 0]); target = max;
      clearTimeout(noticeTimer.current); noticeTimer.current = setTimeout(() => setNotice(''), 2600);
    } else setNotice('');
    if (behavior === 'continuous') {
      setBusy(true);
      commitNavigation(target, historyMode, behavior, () => {
        navigationLock.current = false;
        setBusy(false);
      });
    } else commitNavigation(target, historyMode, behavior);
    return target;
  }
  function chooseAdministrator(id) {
    if (snapshot.current.busy || !companions.some(person => person.id === id)) return;
    select(id);
    setProgress(current => ({ ...current, confirmedAdministrator: id, dialogueProgress: { ...current.dialogueProgress, [id]: 1 } }));
    setNotice('');
  }
  const scrollToSection = useVerticalJourney(track, index, target => {
    setIndex(target); setAbout(false);
    history.replaceState(null, '', '#' + chapters[target][0]);
  });
  useEffect(() => { try { localStorage.setItem(journeyProgressKey, JSON.stringify(progress)); } catch { /* Navigation still works without persistence. */ } }, [progress]);
  useEffect(() => {
    if (!isLetterConfirmed(letter)) return;
    if (workflow === 'stamp' && letter.stampAppliedAt) dispatchWorkflow({ type: 'STAMPED', letter });
    if (workflow === 'recipient' && letter.sentAt) dispatchWorkflow({ type: 'SENT', letter });
  }, [workflow, letter.packedAt, letter.stampAppliedAt, letter.sentAt]);
  useEffect(() => {
    const id = chapters[index][0];
    if (id === 'waiting' && letter.sentAt) setProgress(current => current.waitingVisitedFor === letter.sentAt ? current : { ...current, waitingVisitedFor: letter.sentAt });
  }, [index, letter.sentAt]);
  useEffect(() => {
    history.replaceState(null, '', '#' + chapters[index][0]);
    function sync() {
      const state = snapshot.current;
      let target = chapterFromHash(location.hash);
      if (state.busy || navigationLock.current) { history.replaceState(null, '', '#' + chapters[state.index][0]); return; }
      else target = navigationTarget(target, state.letter, state.selectedAdministrator, state.progress);
      flushSync(() => setReadingBureau(target === chapterIndex('bureau')));
      history.replaceState(null, '', '#' + chapters[target][0]);
      commitNavigation(target, 'replace');
    }
    window.addEventListener('hashchange', sync); window.addEventListener('popstate', sync);
    return () => { window.removeEventListener('hashchange', sync); window.removeEventListener('popstate', sync); clearTimeout(noticeTimer.current); };
  }, []);
  const currentId = chapters[index][0];
  const available = availableChapter(letter, selectedAdministrator, progress);
  return <>
    <GlobalHeader navigate={id => navigate(chapterIndex(id))} busy={busy} about={about} toggleAbout={() => setAbout(value => !value)} currentId={currentId} />
    <main ref={root} className="horizontal-journey mint-journey restored-journey" data-chapter={currentId} data-workflow-step={workflow} data-letter-confirmed={isLetterConfirmed(letter)} data-selected-administrator={selectedAdministrator || ''}>
    <div ref={track} className="journey-track">
      {verticalSections.map(({ id, zh, en: english, index: chapter }) => {
        const unlocked = chapter === index || (id === 'bureau' ? readingBureau || chapter <= available
          : chapter <= keeperChapter || (!readingBureau && keeperReady && chapter <= available));
        const active = index === chapter && unlocked;
        return <section key={id} id={id} hidden={!unlocked} className={'journey-section section-' + id + (chapter === keeperChapter ? ' keeper-selection' : '')} data-scene={id} data-chapter-index={chapter} data-active={active} aria-label={en ? english : zh}>
        {unlocked && <>
        <div className="journey-scene-frame" data-scene-frame>
        <div className="journey-section-content" inert={!unlocked ? true : undefined}>
        {chapter === 0 && <PostOfficeExterior active={active} enter={() => navigate(1)} />}
        {chapter === keeperChapter && <JourneyCompanion active={active} chooseKeeper={chooseAdministrator} write={() => navigate(chapterIndex('write'), 'push', 'quick', true)} read={() => navigate(chapterIndex('bureau'), 'push', 'quick')} disabled={busy} onBusy={setBusy} onStageChange={stage => { keeperStage.current = stage; setKeeperReady(stage === 'confirmed'); }} />}
        {id === 'write' && <JourneyWriting letter={letter} setLetter={setLetter} workflow={workflow} dispatchWorkflow={dispatchWorkflow} active={active} next={() => {
          if (workflow !== 'confirmed') return;
          const confirmed = { ...letter, letterConfirmed: true, replayConfirmedAt: Date.now() };
          flushSync(() => {
            setLetter(confirmed);
            dispatchWorkflow({ type: 'POSTAGE', letter: confirmed });
            setBusy(false);
          });
          commitNavigation(chapterIndex('stamp'));
        }} onBusy={setBusy} />}
        {id === 'stamp' && <StampSendScene letter={letter} setLetter={setLetter} active={active} next={() => navigate(chapterIndex('waiting'))} />}
        {id === 'post' && <><img className="journey-post-bg" data-layer="background" src={journeyScenes.post.background} alt="" /><JourneyPost letter={letter} setLetter={setLetter} active={active} next={() => navigate(chapterIndex('waiting'))} onBusy={setBusy} /></>}
        {id === 'waiting' && <JourneyWaiting active={active} letter={letter} next={() => navigate(chapterIndex('bureau'))} />}
        {id === 'bureau' && <AnonymousBureau active={active} sentLetter={letter} />}
        </div>
        </div>
        </>}
      </section>; })}
    </div>
    {notice && <p className="postal-notice" role="status">{notice}</p>}
    {about && <aside className="postal-about" data-story-local><button className="journey-icon" onClick={() => setAbout(false)} aria-label={en ? 'Close about' : '关闭关于'}><X /></button><h2>Before Sending</h2><p>{en ? 'A place for words, and everything that happened before them: a pause, a crossed-out sentence, a different beginning.' : '这里留住的不只是一封信，还有它形成之前的停顿、删去的句子，以及一次重新开始。'}</p><small>{en ? 'A local interactive artwork. Drafts stay in this browser. No real email is sent.' : '本地互动作品。草稿保存在当前浏览器，不会发送真实邮件。'}</small></aside>}
  </main></>;
}
