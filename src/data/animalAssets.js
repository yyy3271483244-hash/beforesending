import fullAnimationLayout from './fullAnimationLayout.json';

// Activity names remain the current interaction contract.
const asset = path => `${import.meta.env.BASE_URL}assets/${path}`;
const still = (animal, pose) => ({ src: asset(`administrators/${animal}-${pose}.png`), pose, type: 'image' });
const motion = (animal, action, duration = 4.02) => ({
  src: asset(`characters/processed/${animal}-${action}.png`),
  poster: asset(`characters/processed/${animal}-${action}.png`),
  video: asset(`characters/processed/${animal}-${action}.webm`),
  duration,
  pose: action,
  type: 'video',
});
const pauseMotion = (animal, entryDuration, hasLoop = false) => ({
  ...motion(animal, 'pause', entryDuration),
  video: asset(`characters/idle-split/${animal}_idle_entry.webm`),
  ...(hasLoop ? { loopVideo: asset(`characters/idle-split/${animal}_idle_loop.webm`) } : {}),
  src: asset(`characters/processed/${animal}-pause.png`),
  poster: asset(`characters/processed/${animal}-pause.png`),
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
animalAssets.mouse.pause = {
  ...animalAssets.mouse.pause,
  src: asset('characters/idle-split/mouse_pause_idle.png'),
  poster: asset('characters/idle-split/mouse_pause_idle.png'),
  video: asset('characters/idle-split/mouse_pause_intro.webm'),
  loopVideo: asset('characters/idle-split/mouse_pause_idle.webm'),
  duration: 6.016,
  holdAfterEnd: false,
};

const aliases = { following: 'writing', weaving: 'writing', stitching: 'sewing', carrying: 'sending', reacting: 'welcoming', watching: 'reading', returning: 'idle', sorting: 'archive' };
const writingCutouts = {
  cat: { idle: asset('characters/writing-cutouts/cat-idle.png') },
  dog: {
    idle: asset('characters/writing-cutouts/dog-idle.png'),
    sewing: asset('characters/writing-cutouts/dog-sewing.png'),
  },
  mouse: { idle: asset('characters/writing-cutouts/mouse-idle.png') },
  rabbit: {
    idle: asset('characters/writing-cutouts/rabbit-idle.png'),
    pause: asset('characters/writing-cutouts/rabbit-pause.png'),
    sewing: asset('characters/writing-cutouts/rabbit-sewing.png'),
  },
};
export const writingMotionAssets = Object.fromEntries(['cat', 'mouse', 'dog', 'rabbit'].map(animal => [animal, {
  companion: asset(`animation-full/v1/writing/${animal}-companion.webm`),
  sewing: asset(`animation-full/v1/writing/${animal}-sewing.webm`),
  companionLoopStart: { cat: 0, mouse: 4.016, dog: 2.25, rabbit: 3.05 }[animal],
  companionRate: 1,
  companionLoopRate: 1,
  crossfadeMs: 360,
  companionLoopCrossfadeMs: animal === 'mouse' ? 180 : undefined,
  resumeFromStart: animal === 'cat',
  presentation: {
    companion: fullAnimationLayout.writing[`${animal}-companion`].presentation,
    sewing: fullAnimationLayout.writing[`${animal}-sewing`].presentation,
    transition: fullAnimationLayout.writing[`${animal}-companion`].presentation,
  },
  ...(animal === 'rabbit' ? { transition: asset('animation-full/v1/writing/rabbit-companion-reverse.webm') } : {}),
}]));
export function getAnimalAsset(animal, activity = 'idle') {
  const set = animalAssets[animal];
  return set?.[aliases[activity] || activity] || set?.idle || null;
}
export function getWritingAnimalAsset(animal, activity = 'idle') {
  const asset = getAnimalAsset(animal, activity);
  const cutout = writingCutouts[animal]?.[activity] || writingCutouts[animal]?.idle;
  if (!cutout) return asset;
  if (animal === 'cat' && activity === 'pause') {
    const animatedCutout = `${import.meta.env.BASE_URL}assets/characters/idle-split/cat_idle_entry_cutout.webp`;
    return { src: animatedCutout, poster: animatedCutout, pose: 'pause', type: 'image' };
  }
  if (animal === 'cat' && activity === 'sewing') {
    const animatedCutout = `${import.meta.env.BASE_URL}assets/characters/processed/cat-sewing-cutout.webp`;
    return {
      src: animatedCutout,
      poster: `${import.meta.env.BASE_URL}assets/characters/processed/cat-sewing-cutout.png`,
      pose: 'sewing',
      type: 'image',
      animatedDuration: 5.1,
    };
  }
  // Use the clean cutout while the processed transparent action video loads.
  // The writing scene still needs the real pause and sewing motion.
  if (asset.type === 'video') return { ...asset, src: cutout, poster: cutout };
  return { ...asset, src: cutout, poster: cutout };
}

// Selection-only restorations; the writing/pause/sewing contracts above stay intact.
export const keeperSelectionAssets = Object.fromEntries(Object.keys(animalAssets).map(animal => {
  const directory = `animation-full/${animal === 'cat' ? 'v2' : 'v1'}/selection`;
  return [animal, {
  ...animalAssets[animal].select,
  video: asset(`${directory}/${animal}.webm`),
  width: 320, height: 444,
  sourceWidth: fullAnimationLayout.selection[animal].width,
  sourceHeight: fullAnimationLayout.selection[animal].height,
  playbackRate: .65,
  displayScale: animal === 'dog' ? .72 : 1,
  presentation: fullAnimationLayout.selection[animal].presentation,
  playbackVideo: asset(`${directory}/${animal}-packed.mp4`),
  idlePlaybackVideo: asset(`${directory}/${animal}-packed.mp4`),
  selectedIdlePlaybackVideo: asset(animal === 'dog'
    ? 'animation-full/v2/selection/dog-selected-idle-packed.mp4'
    : `${directory}/${animal}-selected-idle-packed.mp4`),
  frameAlphaCorrection: animal === 'cat' ? {
    src: asset('animation-full/v2/selection/cat-frame-010-alpha.png'),
    frameIndex: 10,
    sourceFrames: 97,
    fps: 24.149377593360995,
  } : undefined,
  selectedIdleLoopStart: animal === 'dog' ? 0 : undefined,
  feet: { mouse: [148, 415], cat: [145, 428], rabbit: [144, 403], dog: [160, 444] }[animal],
  }];
}));
