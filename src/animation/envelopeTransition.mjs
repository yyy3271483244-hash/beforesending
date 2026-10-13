export const envelopeTransitionTiming = Object.freeze({ sceneFade: .8, move: 1, tray: .9, settle: .05 });

// The video box includes transparent canvas and object-fit letterboxing.
export function closingEnvelopeBounds(mediaBox, geometry) {
  const scale = Math.min(mediaBox.width / geometry.width, mediaBox.height / geometry.height);
  return {
    left: mediaBox.left + (mediaBox.width - geometry.width * scale) / 2 + geometry.referenceLeft * scale,
    top: mediaBox.top + (mediaBox.height - geometry.height * scale) / 2 + geometry.referenceTop * scale,
    width: geometry.referenceWidth * scale,
    height: geometry.referenceHeight * scale,
  };
}

export function envelopeTravelTransform(source, destination) {
  return {
    x: destination.left + destination.width / 2 - source.left - source.width / 2,
    y: destination.top + destination.height / 2 - source.top - source.height / 2,
    scale: destination.width / source.width,
  };
}
