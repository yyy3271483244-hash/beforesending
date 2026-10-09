import { useI18n } from "../i18n/Language";import { useRef, useState } from 'react';
import { AdministratorCharacter, administrators } from './AdministratorSystem';

const introductions = {
  dog: '如果你不知道怎么开口，我可以先陪你走过去。',
  cat: '你可以慢慢写。我不会催你。',
  rabbit: '乱掉的线，也可以一点一点理清。',
  mouse: '删掉的话，我也会替你收好。'
};

export function CompanionChoice({ id, selected, hasChoice, onSelect, disabled }) {const { t, locale } = useI18n();
  const [action, setAction] = useState({ activity: 'idle', token: 0 });
  const [over, setOver] = useState(false);
  const running = useRef(false),pending = useRef(false),inside = useRef(false);
  const focused = useRef(false),hovered = useRef(false);
  function play(activity) {
    running.current = true;
    setAction((current) => ({ activity, token: current.token + 1 }));
  }
  function end() {
    running.current = false;
    if (pending.current) {pending.current = false;play('selected');} else
    setAction((current) => ({ ...current, activity: 'idle' }));
  }
  function enter() {
    setOver(true);
    if (!inside.current && !running.current && !disabled) play('hover');
    inside.current = true;
  }
  function leave() {
    if (hovered.current || focused.current) return;
    inside.current = false;setOver(false);
  }
  function choose() {
    onSelect(id);
    if (running.current) pending.current = true;else
    play('selected');
  }
  return <button className={`entrance-companion${hasChoice && !selected ? ' is-unselected' : ''}`} aria-pressed={selected} disabled={disabled}
  onPointerEnter={() => {hovered.current = true;enter();}} onPointerLeave={() => {hovered.current = false;leave();}}
  onFocus={() => {focused.current = true;enter();}} onBlur={() => {focused.current = false;leave();}}
  onClick={choose} aria-label={t("选择{0}", t(administrators[id].name))}>
    <AdministratorCharacter id={id} activity={action.activity} actionToken={action.token} onActionEnd={action.activity === 'idle' ? undefined : end} />
    <span>{t(administrators[id].name)}</span>
    <small className={`companion-introduction${over ? ' is-visible' : ''}`}>{t(introductions[id])}</small>
  </button>;
}
