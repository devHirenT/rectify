import { SFX, type SoundEvent, type ToneSpec } from './events.js';
import { channelVolume, effectiveGain, type AudioSettings } from './channels.js';
import { musicStage, type MusicStage, type MusicTheme } from './dynamic.js';

/**
 * Platform backend contract. Web implements this with the Web Audio API;
 * mobile with expo-av (or a native synth). The manager holds all the
 * policy/logic; backends only produce sound.
 */
export interface AudioBackend {
  /**
   * Play a one-shot sound at the given final gain (0..1). `event` lets
   * asset-based backends pick a recorded clip; the synth backend uses `spec`.
   */
  playTone(event: SoundEvent, spec: ToneSpec, gain: number): void;
  /** Start/continue looping music for a theme at a stage and music-gain. */
  setMusic(theme: MusicTheme, stage: MusicStage, gain: number): void;
  /** Stop all music. */
  stopMusic(): void;
  /** Resume a suspended audio context (browsers require a user gesture). */
  resume?(): void | Promise<void>;
}

/**
 * Orchestrates sound: resolves channel volumes, maps gameplay completion to
 * music stages, and delegates synthesis to a backend. UI code talks only to
 * this manager.
 */
export class SoundManager {
  private settings: AudioSettings;
  private theme: MusicTheme;
  private stage: MusicStage = 'calm';
  private musicOn = false;

  constructor(
    private readonly backend: AudioBackend,
    settings: AudioSettings,
    theme: MusicTheme = 'lofi-focus',
  ) {
    this.settings = settings;
    this.theme = theme;
  }

  /** Update channel volumes / enable flag; live-applies to running music. */
  setSettings(settings: AudioSettings): void {
    this.settings = settings;
    if (this.musicOn) this.refreshMusic();
  }

  setTheme(theme: MusicTheme): void {
    this.theme = theme;
    if (this.musicOn) this.refreshMusic();
  }

  /** Play a sound effect by event name (no-op when its channel is muted). */
  play(event: SoundEvent): void {
    const spec = SFX[event];
    const gain = effectiveGain(spec, this.settings);
    if (gain > 0) this.backend.playTone(event, spec, gain);
  }

  /** Begin dynamic music (starts at the Calm stage). */
  startMusic(): void {
    this.musicOn = true;
    this.stage = 'calm';
    this.refreshMusic();
  }

  /** Update music intensity from puzzle completion (0..1). */
  setCompletion(completion: number): void {
    const next = musicStage(completion);
    if (next !== this.stage) {
      this.stage = next;
      if (this.musicOn) this.refreshMusic();
    }
  }

  stopMusic(): void {
    this.musicOn = false;
    this.backend.stopMusic();
  }

  /** Resume the audio context (call from a user gesture). */
  async resume(): Promise<void> {
    await this.backend.resume?.();
  }

  /** Current music stage — exposed for diagnostics/tests. */
  get currentStage(): MusicStage {
    return this.stage;
  }

  private refreshMusic(): void {
    this.backend.setMusic(this.theme, this.stage, channelVolume('music', this.settings));
  }
}
