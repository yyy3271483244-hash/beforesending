import React, {StrictMode, useState, useReducer, useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {LanguageProvider} from '../src/i18n/Language';
import {AdministratorContext} from '../src/data/AdministratorContext';
import {JourneyWriting} from '../src/components/JourneyWriting';
import {emptyLetter} from '../src/data/journey.mjs';
import {writingWorkflowReducer} from '../src/data/writingWorkflow.mjs';
import '../src/horizontal-journey.css';
import '../src/journey-structure.css';
import '../src/experience.css';
import '../src/design-system.css';
import '../src/visual-restoration.css';
import '../src/scene-system.css';
import '../src/interface-layout.css';
import '../src/writing-replay.css';
function Test() {
  const [letter,setLetter]=useState({...emptyLetter,events:[],fragments:[],knots:[]});
  const [workflow,dispatchWorkflow]=useReducer(writingWorkflowReducer,'desk');
  const [done,setDone]=useState(false);
  useEffect(() => {
    const output = document.createElement('output');
    output.setAttribute('aria-label','Observed replay frames');
    document.body.append(output);
    const samples = [];
    const observer = new MutationObserver(() => {
      const surface = document.querySelector('.writing-replay-surface');
      if (!surface) return;
      const text = surface.firstChild?.nodeType === 3 ? surface.firstChild.nodeValue : '';
      if (samples.at(-1)?.text === text) return;
      samples.push({text,time:surface.dataset.replayTime});
      output.textContent = JSON.stringify(samples);
    });
    observer.observe(document.getElementById('root'),{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['data-replay-time']});
    return () => {observer.disconnect();output.remove();};
  },[]);
  return <main className="horizontal-journey restored-journey"><section className="journey-section section-write"><JourneyWriting letter={letter} setLetter={setLetter} workflow={workflow} dispatchWorkflow={dispatchWorkflow} active next={()=>setDone(true)} onBusy={()=>{}} /></section><output aria-label="QA record">{JSON.stringify({workflow,done,text:letter.finalText,events:letter.events,fragments:letter.fragments})}</output></main>;
}
const keeper = new URLSearchParams(location.search).get('keeper');
createRoot(document.getElementById('root')).render(<StrictMode><LanguageProvider><AdministratorContext.Provider value={{selectedAdministrator:['rabbit','cat','dog','mouse'].includes(keeper) ? keeper : 'rabbit'}}><Test/></AdministratorContext.Provider></LanguageProvider></StrictMode>);
