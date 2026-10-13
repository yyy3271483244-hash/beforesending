export const BACKGROUND_MUSIC_VOLUME = .2;
export const BACKGROUND_MUSIC_FADE_MS = 2400;

export function createBackgroundMusicController(audio, {
  interactionTarget,
  requestFrame,
  cancelFrame,
  volume = BACKGROUND_MUSIC_VOLUME,
  fadeMs = BACKGROUND_MUSIC_FADE_MS,
}) {
  let started = false, pending = false, disposed = false, frame = null;
  audio.loop = true;
  audio.volume = 0;

  function removeTriggers() {
    interactionTarget.removeEventListener('pointerdown', start, true);
    interactionTarget.removeEventListener('keydown', start, true);
  }
  function fadeIn() {
    let began = null;
    function tick(time) {
      if (disposed) return;
      began ??= time;
      const progress = Math.min(1, (time - began) / fadeMs);
      audio.volume = volume * progress * progress * (3 - 2 * progress);
      frame = progress < 1 ? requestFrame(tick) : null;
    }
    frame = requestFrame(tick);
  }
  function start() {
    if (started || pending || disposed) return;
    pending = true;
    // Call play synchronously within the original gesture for browser autoplay rules.
    try {
      Promise.resolve(audio.play()).then(() => {
        pending = false;
        if (disposed) return;
        started = true;
        removeTriggers();
        fadeIn();
      }).catch(() => { pending = false; });
    } catch {
      pending = false;
    }
  }
  interactionTarget.addEventListener('pointerdown', start, { capture: true, passive: true });
  interactionTarget.addEventListener('keydown', start, { capture: true });
  return {
    audio,
    start,
    dispose() {
      disposed = true;
      removeTriggers();
      if (frame !== null) cancelFrame(frame);
      audio.pause();
    },
  };
}

let installed = import.meta.hot?.data.backgroundMusic;

export function installBackgroundMusic() {
  if (installed) return installed;
  const audio = document.querySelector('audio[data-background-music]') || new Audio();
  const extension = audio.canPlayType('audio/mpeg') ? 'mp3' : 'ogg';
  audio.src = `${import.meta.env.BASE_URL}assets/audio/before-sending-loop.${extension}`;
  audio.preload = 'auto';
  audio.hidden = true;
  audio.setAttribute('data-background-music', '');
  if (!audio.isConnected) document.body.append(audio);
  installed = createBackgroundMusicController(audio, {
    interactionTarget: document,
    requestFrame: callback => requestAnimationFrame(callback),
    cancelFrame: id => cancelAnimationFrame(id),
  });
  return installed;
}

// Development hot updates must not restart the one music instance either.
if (import.meta.hot) import.meta.hot.dispose(data => { data.backgroundMusic = installed; });
