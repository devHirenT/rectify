'use client';

import { useEffect, useMemo } from 'react';
import { useProfile } from '../app/providers';
import { getSoundManager, toAudioSettings, haptic, HAPTICS } from '../lib/audio';

/**
 * React access to the shared SoundManager. Keeps audio settings in sync with
 * the player profile and resumes the (gesture-gated) AudioContext on the first
 * user interaction.
 */
export function useAudio() {
  const { profile } = useProfile();
  const settings = profile.settings;

  const sound = useMemo(
    () => getSoundManager(toAudioSettings(settings)),
    // getSoundManager updates settings on every call; recompute when they change.
    [settings.musicVolume, settings.effectsVolume, settings.uiVolume, settings.ambientVolume, settings.audioEnabled],
  );

  // Browsers block audio until a user gesture — resume on the first one.
  useEffect(() => {
    const resume = () => void sound.resume();
    window.addEventListener('pointerdown', resume, { once: true });
    return () => window.removeEventListener('pointerdown', resume);
  }, [sound]);

  const hapticsEnabled = settings.hapticsEnabled;

  return {
    sound,
    /** Fire a named haptic pattern (respects the haptics setting). */
    haptic: (pattern: keyof typeof HAPTICS) => haptic(HAPTICS[pattern], hapticsEnabled),
  };
}
