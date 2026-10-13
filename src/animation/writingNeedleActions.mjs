export const needleActionDurations = Object.freeze({
  start: 900, deletion: 1050, newline: 820, finish: 900, 'send-return': 900,
});

// Return actions use the original SVG thread and CSS motion, never uploaded clips.
export const needleVideoClips = Object.freeze({
  deletion: 'sewing',
});

export const isNeedleReturnAction = action => action === 'finish' || action === 'send-return';
