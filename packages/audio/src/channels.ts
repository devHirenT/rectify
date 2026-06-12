import type { Channel, ToneSpec } from './events.js';

/** Independent per-channel volumes (PRD §8) plus the master enable flag. */
export interface AudioSettings {
  music: number;
  effects: number;
  ui: number;
  ambient: number;
  audioEnabled: boolean;
}

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  music: 0.7,
  effects: 0.8,
  ui: 0.8,
  ambient: 0.5,
  audioEnabled: true,
};

/** Effective 0..1 volume for a channel (0 when audio is disabled). */
export function channelVolume(channel: Channel, s: AudioSettings): number {
  if (!s.audioEnabled) return 0;
  return clamp01(s[channel]);
}

/** Final gain for a tone: its base gain scaled by its channel volume. */
export function effectiveGain(spec: ToneSpec, s: AudioSettings): number {
  return spec.gain * channelVolume(spec.channel, s);
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
