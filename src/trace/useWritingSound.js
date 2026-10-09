import { useCallback, useEffect, useRef } from "react";

export function useWritingSound(pen, enabled = true) {
  const audioRef = useRef(null);
  const lastSoundAt = useRef(0);

  const ensureAudio = useCallback(async () => {
    if (!enabled) return null;
    if (audioRef.current) return audioRef.current;
    const Tone = await import("tone");
    await Tone.start();
    const filter = new Tone.Filter(pen === "pencil" ? 1650 : pen === "ballpoint" ? 2300 : 1100, "lowpass").toDestination();
    const scratch = new Tone.NoiseSynth({
      noise: { type: pen === "pencil" ? "brown" : "pink" },
      envelope: { attack: 0.002, decay: 0.045, sustain: 0, release: 0.03 },
      volume: -27,
    }).connect(filter);
    const rub = new Tone.NoiseSynth({
      noise: { type: "brown" },
      envelope: { attack: 0.01, decay: 0.16, sustain: 0, release: 0.1 },
      volume: -25,
    }).connect(filter);
    audioRef.current = { Tone, filter, scratch, rub };
    return audioRef.current;
  }, [enabled, pen]);

  const play = useCallback(
    async (kind, density = 1) => {
      if (!enabled) return;
      const now = performance.now();
      if (kind === "write" && now - lastSoundAt.current < Math.max(26, 68 / density)) return;
      lastSoundAt.current = now;
      const audio = await ensureAudio();
      if (!audio) return;
      if (kind === "delete") audio.rub.triggerAttackRelease(0.11);
      else audio.scratch.triggerAttackRelease(pen === "fountain" ? 0.065 : 0.045);
    },
    [enabled, ensureAudio, pen],
  );

  useEffect(() => {
    return () => {
      audioRef.current?.scratch.dispose();
      audioRef.current?.rub.dispose();
      audioRef.current?.filter.dispose();
      audioRef.current = null;
    };
  }, [pen]);

  return { play };
}

