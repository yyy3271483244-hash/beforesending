import { useEffect, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { useI18n } from '../i18n/Language';
import { companions, languageText } from '../data/journey.mjs';
import { journeyScenes } from '../data/journeyScenes';
import { AdministratorCharacter, useAdministrator } from './AdministratorSystem';

export function JourneySelection({ active, confirm }) {
  const { language } = useI18n(), en = language === 'en';
  const { selectedAdministrator } = useAdministrator();
  const [candidate, setCandidate] = useState(selectedAdministrator);
  const [motion, setMotion] = useState(null);
  const [token, setToken] = useState(0);
  const copy = pair => languageText(language, pair);
  useEffect(() => { if (!active) setMotion(null); }, [active]);
  function respond(id) { if (active && motion !== id) { setMotion(id); setToken(value => value + 1); } }
  const chosen = companions.find(person => person.id === candidate);
  return <div className="companion-selection" data-layer="ui">
    <header><p className="chapter-kicker">{en ? 'A little company' : '让一个人，陪你慢慢写'}</p><h1 data-chapter-heading tabIndex={-1}>{en ? 'Who will stay with you?' : '今天，想让谁陪你？'}</h1></header>
    <div className="selection-labels" role="group" aria-label={en ? 'Choose your administrator' : '选择动物管理员'}>
      {companions.map(person => <button key={person.id} className={`selection-label label-${person.id}`} data-layer="interaction" data-animate={`${person.id}-choice`} aria-pressed={candidate === person.id}
        onPointerEnter={() => respond(person.id)} onPointerLeave={() => setMotion(id => id === person.id ? null : id)} onFocus={() => respond(person.id)} onBlur={() => setMotion(id => id === person.id ? null : id)}
        onClick={() => { setCandidate(person.id); respond(person.id); }}>
        <img className="selection-frame-art" data-layer="frame" src={journeyScenes.administrators.frame} alt="" draggable={false} />
        <span className="selection-name">{copy(person.name)}{candidate === person.id && <Check aria-label={en ? 'Selected' : '已选择'} />}</span>
        <AdministratorCharacter id={person.id} className="selection-animal" activity={active && motion === person.id ? 'hover' : 'idle'} actionToken={motion === person.id ? token : 0} onActionEnd={motion === person.id ? () => setMotion(null) : undefined} />
        <span className="selection-keywords">{copy(person.note)}</span>
        <span className="selection-description">{copy(person.mood)}</span>
      </button>)}
    </div>
    <footer>{chosen ? <button className="journey-link" onClick={() => confirm(candidate)}>{en ? `Let ${copy(chosen.name)} accompany me` : `让${copy(chosen.name)}陪我写信`}<ArrowRight /></button> : <p>{en ? 'Choose a companion.' : '选一位，陪你坐下来。'}</p>}</footer>
  </div>;
}
