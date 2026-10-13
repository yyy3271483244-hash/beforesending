import { splitGraphemes } from './graphemes.mjs';

export const DELETION_TRACE_THRESHOLD = 5;

// Count visible characters, not punctuation, numeric forms or spacing/format marks.
const excludedCharacter = /^[\p{P}\p{N}\p{Z}\p{C}\p{M}]+$/u;
export function countTraceCharacters(value = '') {
  return splitGraphemes(value).filter(({ text }) => !excludedCharacter.test(text)).length;
}

export const reachesDeletionThreshold = value => countTraceCharacters(value) >= DELETION_TRACE_THRESHOLD;
