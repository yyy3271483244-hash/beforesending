import { FinalPostingScene } from './FinalPostingScene';

export function JourneyWaiting({ active, letter, next }) {
  return <FinalPostingScene active={active} sent={Boolean(letter.sentAt)} next={next} />;
}
