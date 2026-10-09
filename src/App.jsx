import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { UnsealRoom, archiveEntries } from "./components/ArchiveRooms";
import { AdministratorProvider, useAdministrator } from "./components/AdministratorSystem";
import { LivingWriting, LivingReading, LivingReplay } from "./components/LivingLetter";
import { PostalWaiting } from "./components/DeliveryWorktable";
import { HomeScrollStage, hasSeenEntrance } from "./components/HomeScrollStage";
import { ReadingFlow } from "./components/ReadingFlow";
import { PostOfficeRoom } from "./components/PostOfficeChoices";
import { HorizontalJourney } from "./components/HorizontalJourney";

const STORAGE_KEY = "before-sending-letter-v3";
const blankLetter = { recipient: "", finalText: "", events: [], fragments: [], knots: [], stitch: [], allowTraces: true, startedAt: null };

function loadDraft() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* A fresh in-memory letter still works without storage access. */ }
  return { ...blankLetter, events: [], fragments: [], knots: [], stitch: [] };
}

const pages = new Set(["opening", "write", "replay", "seal", "waiting", "receive", "receiverReplay", "bureau", "unseal", "reading", "administrators", "office"]);
function readRoute() {
  const [requestedPage, id] = window.location.hash.slice(1).split("/");
  const page = requestedPage === "stitch" ? "reading" : requestedPage;
  if (requestedPage === "stitch") history.replaceState(null, "", `#reading${id ? `/${id}` : ""}`);
  if (pages.has(page)) return { page, id };
  const preview = new URLSearchParams(window.location.search).get("preview");
  return { page: preview === "drawers" ? "bureau" : hasSeenEntrance() ? "write" : "opening", arrival: "entrance" };
}

function Experience() {
  const { selectedAdministrator } = useAdministrator();
  const [letter, setLetter] = useState(loadDraft);
  const [route, setRoute] = useState(readRoute);
  const stage = route.page;
  const transition = useRef(null);
  const navigationIntent = useRef(0);
  const selected = archiveEntries.find((entry) => entry.id === route.id);
  const readingLetter = selected || letter;

  useEffect(() => {
    if (selectedAdministrator || stage === 'opening' || stage === 'administrators') return;
    history.replaceState(null, '', '#administrators');
    setRoute({ page: 'administrators' });
  }, [selectedAdministrator, stage]);

  useEffect(() => {
    const sync = () => { navigationIntent.current += 1; transition.current?.skipTransition(); delete document.documentElement.dataset.entryTransition; setRoute(readRoute()); };
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => { window.removeEventListener("hashchange", sync); window.removeEventListener("popstate", sync); };
  }, []);

  function go(page, id, arrival) {
    const intent = ++navigationIntent.current;
    const next = { page, id, arrival, navigationId: intent };
    const navigate = () => {
      if (intent !== navigationIntent.current) return;
      history.pushState(null, "", `#${page}${id ? `/${id}` : ""}`);
      flushSync(() => setRoute(next));
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    transition.current?.skipTransition();
    if (arrival) document.documentElement.dataset.entryTransition = arrival;
    else delete document.documentElement.dataset.entryTransition;
    const finish = () => { if (intent === navigationIntent.current) delete document.documentElement.dataset.entryTransition; };
    if (document.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      transition.current = document.startViewTransition(navigate);
      transition.current.ready.catch(() => {});
      transition.current.finished.then(finish, finish);
    } else { navigate(); finish(); }
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    setLetter(blankLetter);
    go("opening");
  }

  if (!selectedAdministrator && stage !== 'opening') return <HomeScrollStage key="companion-choice" go={go} initialAct="companions" />;
  if (route.id && !selected) return <ReadingFlow go={go}/>;
  if (!selected && letter.sentAt && ["receive", "reading", "unseal", "receiverReplay"].includes(stage)) return <PostalWaiting letter={letter} setLetter={setLetter} go={go} />;
  if (stage === "opening") return <HomeScrollStage go={go} />;
  if (stage === "administrators" || stage === "office") return <HomeScrollStage key="companion-choice" go={go} initialAct="companions" />;
  if (stage === "replay" || stage === "seal") return <LivingWriting key={stage} letter={letter} setLetter={setLetter} go={go} initialStage={stage === "seal" ? "prepare" : "replay"} />;
  if (stage === "waiting") return <PostalWaiting letter={letter} setLetter={setLetter} go={go} />;
  if ((stage === "receive" || stage === "reading") && selected) return <ReadingFlow key={route.id} go={go} initialId={route.id} initialReading/>;
  if (stage === "receive" || stage === "reading") return <LivingReading key="draft" letter={readingLetter} go={go} />;
  if (stage === "receiverReplay") return <LivingReplay letter={readingLetter.allowTraces ? readingLetter : { ...readingLetter, events: [], fragments: [], knots: [] }} go={go} backTo="reading" sourceId={route.id} />;
  if (stage === "bureau") return <ReadingFlow go={go} initialId={route.id} arrival={route.arrival}/>;
  if (stage === "unseal") return <UnsealRoom letter={readingLetter} go={go} sourceId={route.id} />;
  return <LivingWriting key={`${route.arrival || 'desk'}-${route.navigationId || 0}`} letter={letter} setLetter={setLetter} go={go} initialStage={['paper-write','write'].includes(route.arrival) ? 'desk' : route.arrival === 'entrance' ? 'write' : undefined} />;
}

export default function App() { return <AdministratorProvider><HorizontalJourney /></AdministratorProvider>; }
