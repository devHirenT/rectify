/**
 * Sound event catalog and procedural tone specs (PRD §8 sound effects).
 *
 * The engine is platform-agnostic: each event maps to a `ToneSpec` describing a
 * short sequence of notes that a backend can synthesize (Web Audio on web,
 * expo-av/native on mobile) or replace with a recorded asset. Keeping the specs
 * as plain data means the mapping is testable without any audio hardware.
 */

export type Channel = 'music' | 'effects' | 'ui' | 'ambient';

export type OscShape = 'sine' | 'square' | 'sawtooth' | 'triangle';

/** All game sound effects (PRD §8). */
export type SoundEvent =
  | 'cellSelect'
  | 'rectangleDraw'
  | 'correct'
  | 'wrong'
  | 'undo'
  | 'retry'
  | 'hint'
  | 'coin'
  | 'xp'
  | 'achievement'
  | 'complete'
  | 'uiTap';

export interface ToneSpec {
  channel: Channel;
  /** Note frequencies in Hz, played in sequence. */
  notes: number[];
  shape: OscShape;
  /** Seconds per note. */
  noteDuration: number;
  /** Base gain 0..1 before channel volume is applied. */
  gain: number;
}

// Musical helpers (equal temperament around A4 = 440).
const N = {
  C4: 261.63,
  E4: 329.63,
  G4: 392.0,
  A4: 440.0,
  C5: 523.25,
  E5: 659.25,
  G5: 783.99,
  C6: 1046.5,
};

/** Event → tone spec. Effects use the `effects` channel; UI uses `ui`. */
export const SFX: Record<SoundEvent, ToneSpec> = {
  cellSelect: { channel: 'ui', notes: [N.G5], shape: 'sine', noteDuration: 0.05, gain: 0.25 },
  rectangleDraw: { channel: 'ui', notes: [N.E5], shape: 'triangle', noteDuration: 0.04, gain: 0.2 },
  correct: { channel: 'effects', notes: [N.E5, N.G5], shape: 'sine', noteDuration: 0.08, gain: 0.4 },
  wrong: { channel: 'effects', notes: [220, 175], shape: 'sawtooth', noteDuration: 0.1, gain: 0.35 },
  undo: { channel: 'ui', notes: [N.A4, N.E4], shape: 'triangle', noteDuration: 0.06, gain: 0.25 },
  retry: { channel: 'ui', notes: [N.E4, N.A4], shape: 'triangle', noteDuration: 0.06, gain: 0.25 },
  hint: { channel: 'effects', notes: [N.C5, N.E5, N.G5], shape: 'sine', noteDuration: 0.07, gain: 0.3 },
  coin: { channel: 'effects', notes: [N.G5, N.C6], shape: 'square', noteDuration: 0.06, gain: 0.3 },
  xp: { channel: 'effects', notes: [N.C5, N.G5], shape: 'triangle', noteDuration: 0.07, gain: 0.28 },
  achievement: { channel: 'effects', notes: [N.C5, N.E5, N.G5, N.C6], shape: 'sine', noteDuration: 0.1, gain: 0.4 },
  complete: { channel: 'effects', notes: [N.C5, N.E5, N.G5, N.C6, N.G5, N.C6], shape: 'sine', noteDuration: 0.12, gain: 0.45 },
  uiTap: { channel: 'ui', notes: [N.C5], shape: 'sine', noteDuration: 0.035, gain: 0.18 },
};
