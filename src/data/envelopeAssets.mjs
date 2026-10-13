export const envelopeClosingPlaybackRate = 1;

function frame(width, height, referenceLeft, referenceTop, referenceWidth, referenceHeight) {
  return { width, height, referenceLeft, referenceTop, referenceWidth, referenceHeight };
}

// Frame geometry aligns the existing uncut canvases with the artwork footprint.
const definitions = [
  { id: 'lavender', openGeometry: frame(960, 960, 130, 64, 704, 789), closedGeometry: frame(960, 960, 130, 343, 696, 489), flipKey: null,
    backImage: 'assets/envelope/lavender-back.png', backGeometry: frame(666, 552, 55, 73, 594, 445) },
  { id: 'sage', openGeometry: frame(960, 960, 124, 0, 697, 823), closedGeometry: frame(960, 960, 124, 328, 698, 459), flipKey: 'sage' },
  { id: 'ivory', openGeometry: frame(832, 1108, 9, 11, 810, 1021), closedGeometry: frame(832, 1108, 44, 300, 738, 552), flipKey: 'lavender' },
  { id: 'rose', openGeometry: frame(960, 960, 174, 80, 610, 709), closedGeometry: frame(960, 960, 172, 298, 616, 485), flipKey: 'rose' },
  { id: 'oat', openGeometry: frame(960, 960, 138, 0, 668, 795), closedGeometry: frame(960, 960, 140, 340, 664, 444), flipKey: 'ivory' },
];

export const envelopeAssets = Object.freeze(definitions.map(item => Object.freeze({
  ...item,
  image: `assets/animation-full/v1/closing/${item.id}-last.png`,
  openImage: `assets/animation-full/v1/closing/${item.id}-first.png`,
  closeVideo: `assets/animation-full/v1/closing/${item.id}.webm`,
})));

export const envelopeById = id => envelopeAssets.find(item => item.id === id) || null;

export function normalizeEnvelopeId(value) {
  const id = { peach: 'rose', blue: 'lavender' }[value] || value;
  return envelopeById(id) ? id : 'ivory';
}
