// Place the uncut source canvas against the existing artwork footprint.
export function fullFrameStyle(geometry) {
  return {
    '--motion-ratio': `${geometry.referenceWidth} / ${geometry.referenceHeight}`,
    '--motion-width': `${geometry.width / geometry.referenceWidth * 100}%`,
    '--motion-height': `${geometry.height / geometry.referenceHeight * 100}%`,
    '--motion-left': `${-geometry.referenceLeft / geometry.referenceWidth * 100}%`,
    '--motion-top': `${-geometry.referenceTop / geometry.referenceHeight * 100}%`,
  };
}
