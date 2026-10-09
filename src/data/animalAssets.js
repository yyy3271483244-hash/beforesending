// September 6 cutouts. Activity names remain the current interaction contract.
const still = (animal, pose) => ({ src: `/assets/administrators/${animal}-${pose}.png`, pose, type: 'image' });
const motion = (animal, action, duration = 4.02) => ({
  src: `/assets/characters/processed/${animal}-${action}.png`,
  poster: `/assets/characters/processed/${animal}-${action}.png`,
  video: `/assets/characters/processed/${animal}-${action}.webm`,
  duration,
  pose: action,
  type: 'video',
});
const pauseMotion = (animal, entryDuration, hasLoop = false) => ({
  ...motion(animal, 'pause', entryDuration),
  video: `/assets/characters/idle-split/${animal}_idle_entry.webm`,
  ...(hasLoop ? { loopVideo: `/assets/characters/idle-split/${animal}_idle_loop.webm` } : {}),
  src: `/assets/characters/processed/${animal}-pause.png`,
  poster: `/assets/characters/processed/${animal}-pause.png`,
  holdAfterEnd: !hasLoop,
});
const mapping = {
  idle: 'idle', hover: 'following', selected: 'following', welcoming: 'following',
  writing: 'weaving', sewing: 'weaving', thread: 'weaving', packaging: 'carrying',
  sending: 'carrying', collecting: 'carrying', waiting: 'idle', reading: 'idle', archive: 'carrying',
};
export const animalAssets = Object.fromEntries(['rabbit', 'cat', 'mouse', 'dog'].map(animal => [
  animal, Object.fromEntries(Object.entries(mapping).map(([activity, pose]) => [activity, still(animal, pose)])),
]));
animalAssets.mouse.welcoming = still('mouse', 'reacting');
for (const animal of Object.keys(animalAssets)) {
  animalAssets[animal].select = motion(animal, 'select');
  animalAssets[animal].sewing = motion(animal, 'sewing', animal === 'mouse' ? 6.02 : 4.02);
  animalAssets[animal].pause = pauseMotion(animal, animal === 'rabbit' ? 3.023 : 4.017, animal === 'rabbit');
}

const aliases = { following: 'writing', weaving: 'writing', stitching: 'sewing', carrying: 'sending', reacting: 'welcoming', watching: 'reading', returning: 'idle', sorting: 'archive' };
const writingCutouts = {
  cat: { idle: '/assets/characters/writing-cutouts/cat-idle.png' },
  dog: {
    idle: '/assets/characters/writing-cutouts/dog-idle.png',
    sewing: '/assets/characters/writing-cutouts/dog-sewing.png',
  },
  mouse: { idle: '/assets/characters/writing-cutouts/mouse-idle.png' },
  rabbit: {
    idle: '/assets/characters/writing-cutouts/rabbit-idle.png',
    pause: '/assets/characters/writing-cutouts/rabbit-pause.png',
    sewing: '/assets/characters/writing-cutouts/rabbit-sewing.png',
  },
};
export function getAnimalAsset(animal, activity = 'idle') {
  const set = animalAssets[animal];
  return set?.[aliases[activity] || activity] || set?.idle || null;
}
export function getWritingAnimalAsset(animal, activity = 'idle') {
  const asset = getAnimalAsset(animal, activity);
  const cutout = writingCutouts[animal]?.[activity] || writingCutouts[animal]?.idle;
  if (!cutout) return asset;
  // The source action clips include an opaque paper canvas. In the writing
  // scene a clean cutout is preferable to showing that source canvas.
  if (asset.type === 'video') return { ...asset, src: cutout, poster: cutout, video: null, loopVideo: null, alphaMask: null, type: 'image' };
  return { ...asset, src: cutout, poster: cutout };
}

// Selection-only restorations; the writing/pause/sewing contracts above stay intact.
export const keeperSelectionAssets = Object.fromEntries(Object.keys(animalAssets).map(animal => [animal, {
  ...animalAssets[animal].select,
  video: ['cat', 'dog'].includes(animal)
    ? `/assets/characters/selection-restored/${animal}-select.webm`
    : animalAssets[animal].select.video,
  width: 320, height: 444,
  feet: { mouse: [148, 415], cat: [145, 428], rabbit: [144, 403], dog: [160, 418] }[animal],
}]));
