export const KEEPER_LOOP_SECONDS = 2;

export function keeperLoopStart(duration) {
  return Number.isFinite(duration) ? Math.max(0, duration - KEEPER_LOOP_SECONDS) : 0;
}

export function keeperPlaybackStart({ mode, duration, idleIntroPlayed = false, selectedIntroPlayed = false, selectedIdleLoopStart }) {
  if (mode === 'idle') return idleIntroPlayed ? keeperLoopStart(duration) : 0;
  if (mode === 'selected-idle') return selectedIntroPlayed ? selectedIdleLoopStart ?? keeperLoopStart(duration) : 0;
  return 0;
}

export function keeperPixels(packed, output, width, height) {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const source = (y * width * 2 + x) * 4;
      const target = (y * width + x) * 4;
      const alpha = packed[source + width * 4];
      output[target] = packed[source];
      output[target + 1] = packed[source + 1];
      output[target + 2] = packed[source + 2];
      output[target + 3] = alpha < 4 ? 0 : alpha;
    }
  }
}
