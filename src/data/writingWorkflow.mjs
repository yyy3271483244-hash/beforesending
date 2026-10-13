export function isLetterConfirmed(letter = {}) {
  return Boolean(letter.letterConfirmed && letter.finalText?.trim() && letter.writingFinishedAt
    && letter.replayConfirmedAt);
}

export function initialWritingWorkflow(letter) {
  if (!isLetterConfirmed(letter)) return 'desk';
  if (letter.sentAt) return 'send';
  if (letter.stampAppliedAt) return 'stamp';
  return 'stamp';
}

// Scroll position is deliberately not an event in this state machine.
export function writingWorkflowReducer(state, event) {
  switch (event.type) {
    case 'RESET': return 'desk';
    case 'REST': return 'desk';
    case 'LIFT': return state === 'desk' ? 'paper-lifting' : state;
    case 'READY': return state === 'paper-lifting' ? 'writing' : state;
    case 'FINISH': return state === 'writing' && event.hasText ? 'replay' : state;
    case 'EDIT': return state === 'replay' ? 'writing' : state;
    case 'REOPEN': return ['stamp', 'recipient', 'send'].includes(state) ? 'writing' : state;
    case 'CONFIRM': return state === 'replay' && event.replayReady ? 'confirmed' : state;
    case 'POSTAGE': return state === 'confirmed' && isLetterConfirmed(event.letter) ? 'stamp' : state;
    case 'STAMPED': return state === 'stamp' && event.letter.packedAt && event.letter.stampAppliedAt ? 'stamp' : state;
    case 'SENT': return ['stamp', 'recipient'].includes(state) && event.letter.stampAppliedAt && event.letter.sentAt ? 'send' : state;
    default: return state;
  }
}
