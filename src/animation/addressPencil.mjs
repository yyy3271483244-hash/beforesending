// The original pencil points up at 6% of its transparent canvas height.
// Rotating that artwork 180 degrees puts the tip at 94% of the same canvas.
export function pencilTravelToLine(pencilBox, line) {
  return {
    x: line.left - pencilBox.left - pencilBox.width / 2,
    y: line.top - pencilBox.top - pencilBox.height * .94,
  };
}

export function addressWritingFrames(start, width, characters, duration) {
  const count = Math.max(1, characters);
  const frames = [];
  for (let character = 0; character < count; character++) {
    for (const [fraction, rise] of [[.33, -1.4], [.67, 1.1], [1, 0]]) {
      frames.push({ x: start.x + width * (character + fraction) / count, y: start.y + rise, duration: duration / count / 3, ease: 'sine.inOut' });
    }
  }
  return frames;
}
