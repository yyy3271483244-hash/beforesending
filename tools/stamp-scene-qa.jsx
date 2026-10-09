import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {LanguageProvider} from '../src/i18n/Language';
import {StampSendScene} from '../src/components/StampSendScene';
import '../src/design-system.css';
import '../src/visual-restoration.css';
import '../src/scene-system.css';
import '../src/interface-layout.css';
import '../src/horizontal-journey.css';
import '../src/journey-structure.css';
function Test(){const [letter,setLetter]=useState({recipient:'',finalText:'QA letter',events:[],packedAt:null}),[done,setDone]=useState(false);return <div className="restored-journey"><StampSendScene letter={letter} setLetter={setLetter} active={!done} next={()=>setDone(true)}/><output aria-label="Test state">{JSON.stringify({packed:!!letter.packedAt,sealed:!!letter.sealedAt,stamped:!!letter.stampAppliedAt,recipient:letter.deliveryRecipient,sent:!!letter.sentAt,done,events:letter.events.length})}</output></div>;}
createRoot(document.getElementById('root')).render(<LanguageProvider><Test/></LanguageProvider>);
