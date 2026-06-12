'use client';

import {
  SoundManager,
  type AudioBackend,
  type AudioSettings,
  type MusicStage,
  type MusicTheme,
  type SoundEvent,
  type ToneSpec,
} from '@shikaku/audio';

/**
 * Web Audio backend, modelled on real board games (chess / ludo): satisfying
 * *tactile* sound effects — a woody "tock" when a rectangle lands, soft clicks,
 * a gentle chime on a good move — and NO looping background music while you
 * play (chess apps stay quiet; the calm comes from the sounds, not a track).
 *
 * Everything is synthesized (no asset files → offline-first). Recorded assets
 * can later replace these behind the same AudioBackend interface.
 */
class WebAudioBackend implements AudioBackend {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;

  private ensure(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  async resume(): Promise<void> {
    const ctx = this.ensure();
    if (ctx && ctx.state === 'suspended') await ctx.resume();
  }

  // No background music — board games keep gameplay quiet (the SFX carry it).
  setMusic(_theme: MusicTheme, _stage: MusicStage, _gain: number): void {}
  stopMusic(): void {}

  playTone(event: SoundEvent, _spec: ToneSpec, gain: number): void {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    switch (event) {
      case 'correct':
        this.woodTock(gain); // a piece settling on the board
        break;
      case 'rectangleDraw':
        this.click(gain * 0.7, 2200, 0.025);
        break;
      case 'cellSelect':
        this.click(gain * 0.7, 2600, 0.02);
        break;
      case 'uiTap':
        this.click(gain * 0.8, 2400, 0.022);
        break;
      case 'undo':
        this.click(gain * 0.9, 1500, 0.035);
        break;
      case 'retry':
        this.click(gain * 0.9, 1200, 0.04);
        break;
      case 'wrong':
        this.thud(gain);
        break;
      case 'hint':
        this.chime(gain, [659.25, 783.99], 0.32);
        break;
      case 'xp':
        this.chime(gain, [523.25, 783.99], 0.3);
        break;
      case 'coin':
        this.ding(gain, [783.99, 1046.5]);
        break;
      case 'achievement':
        this.arpeggio(gain, [523.25, 659.25, 783.99, 1046.5]);
        break;
      case 'complete':
        this.arpeggio(gain, [523.25, 659.25, 783.99, 1046.5, 1318.51]);
        break;
    }
  }

  // ---- synthesis primitives ----

  private noiseBuffer(ctx: AudioContext): AudioBuffer {
    if (!this.noise) {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      this.noise = buf;
    }
    return this.noise;
  }

  /** A short filtered noise burst — the basis of clicks/tocks. */
  private click(gain: number, freq: number, dur: number, q = 2): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(ctx);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = freq;
    bp.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.001);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp);
    bp.connect(g);
    g.connect(this.master!);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  /** Wooden "tock" of a piece landing: noise click + a low body thump. */
  private woodTock(gain: number): void {
    this.click(gain * 0.9, 1750, 0.06, 1.4);
    this.body(170, gain * 0.5, 0.09);
  }

  /** Muted dull thud for a wrong placement. */
  private thud(gain: number): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(ctx);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 480;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain * 0.6, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    src.connect(lp);
    lp.connect(g);
    g.connect(this.master!);
    src.start(t);
    src.stop(t + 0.16);
    this.body(110, gain * 0.5, 0.14);
  }

  /** A short sine "body" tone (adds weight to clicks/thuds). */
  private body(freq: number, gain: number, dur: number): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.master!);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  /** Soft sine notes in sequence (chime / ding / arpeggio). */
  private notes(gain: number, freqs: number[], spacing: number, dur: number, bell = false): void {
    const ctx = this.ctx!;
    const t0 = ctx.currentTime;
    freqs.forEach((freq, i) => {
      const start = t0 + i * spacing;
      const partials = bell ? [[1, 1], [2, 0.25]] : [[1, 1]];
      for (const [mult, level] of partials) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq * mult!;
        g.gain.setValueAtTime(0, start);
        g.gain.linearRampToValueAtTime(gain * 0.55 * level!, start + 0.006);
        g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        osc.connect(g);
        g.connect(this.master!);
        osc.start(start);
        osc.stop(start + dur + 0.03);
      }
    });
  }

  private chime(gain: number, freqs: number[], dur: number): void {
    this.notes(gain, freqs, 0.09, dur);
  }
  private ding(gain: number, freqs: number[]): void {
    this.notes(gain, freqs, 0.07, 0.5, true);
  }
  private arpeggio(gain: number, freqs: number[]): void {
    this.notes(gain, freqs, 0.1, 0.5, true);
  }
}

let singleton: SoundManager | null = null;

/** Get (or lazily create) the shared SoundManager wired to a Web Audio backend. */
export function getSoundManager(settings: AudioSettings): SoundManager {
  if (!singleton) {
    singleton = new SoundManager(new WebAudioBackend(), settings);
  } else {
    singleton.setSettings(settings);
  }
  return singleton;
}

/** Map the persisted profile settings onto the audio channel settings. */
export function toAudioSettings(s: {
  musicVolume: number;
  effectsVolume: number;
  uiVolume: number;
  ambientVolume: number;
  audioEnabled: boolean;
}): AudioSettings {
  return {
    music: s.musicVolume,
    effects: s.effectsVolume,
    ui: s.uiVolume,
    ambient: s.ambientVolume,
    audioEnabled: s.audioEnabled,
  };
}

/** Fire a haptic pattern if supported and enabled (PRD §7, web Vibration API). */
export function haptic(pattern: number | readonly number[], enabled: boolean): void {
  if (!enabled) return;
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(typeof pattern === 'number' ? pattern : [...pattern]);
    } catch {
      /* ignore unsupported */
    }
  }
}

/** Standard haptic patterns (PRD §7). */
export const HAPTICS = {
  correct: 12,
  wrong: [18, 40, 18],
  hint: 15,
  complete: [40, 30, 40, 30, 80],
} as const;
