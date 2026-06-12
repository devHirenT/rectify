import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
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
 * Mobile audio backend (expo-audio — replaces the deprecated expo-av).
 *
 * Plays recorded clips mapped from sound events / music themes. Drop real
 * assets into the maps below and they light up automatically; until then every
 * method is a safe no-op, so the shared SoundManager (events, channels, dynamic
 * staging) is fully wired and the game stays silent rather than crashing.
 *
 * To add assets:
 *   SFX_ASSETS.correct = require('../../assets/sfx/correct.mp3');
 *   MUSIC_ASSETS['lofi-focus'] = require('../../assets/music/lofi-focus.mp3');
 */
const SFX_ASSETS: Partial<Record<SoundEvent, number>> = {};
const MUSIC_ASSETS: Partial<Record<MusicTheme, number>> = {};

/** Per-stage music loudness multiplier (more intensity → fuller mix). */
const STAGE_GAIN: Record<MusicStage, number> = {
  calm: 0.6,
  energy: 0.8,
  anticipation: 0.9,
  victory: 1,
};

class ExpoAudioBackend implements AudioBackend {
  private music: AudioPlayer | null = null;
  private musicTheme: MusicTheme | null = null;
  private ready = false;

  async resume(): Promise<void> {
    if (this.ready) return;
    try {
      await setAudioModeAsync({ playsInSilentMode: true, shouldRouteThroughEarpiece: false });
      this.ready = true;
    } catch {
      /* audio mode unavailable — stay silent */
    }
  }

  playTone(event: SoundEvent, _spec: ToneSpec, gain: number): void {
    const asset = SFX_ASSETS[event];
    if (asset == null) return; // no recorded clip yet
    try {
      const player = createAudioPlayer(asset);
      player.volume = gain;
      player.play();
      // Release the one-shot player shortly after it finishes (SFX are short).
      setTimeout(() => {
        try {
          player.remove();
        } catch {
          /* already released */
        }
      }, 5000);
    } catch {
      /* ignore playback errors */
    }
  }

  setMusic(theme: MusicTheme, stage: MusicStage, gain: number): void {
    const asset = MUSIC_ASSETS[theme];
    const volume = gain * STAGE_GAIN[stage];
    if (asset == null) return; // no music track yet

    if (this.musicTheme !== theme) {
      try {
        this.music?.remove();
        const player = createAudioPlayer(asset);
        player.loop = true;
        player.volume = volume;
        player.play();
        this.music = player;
        this.musicTheme = theme;
      } catch {
        /* ignore */
      }
    } else if (this.music) {
      this.music.volume = volume;
    }
  }

  stopMusic(): void {
    try {
      this.music?.remove();
    } catch {
      /* ignore */
    }
    this.music = null;
    this.musicTheme = null;
  }
}

let singleton: SoundManager | null = null;

/** Shared SoundManager wired to the expo-audio backend. */
export function getSoundManager(settings: AudioSettings): SoundManager {
  if (!singleton) singleton = new SoundManager(new ExpoAudioBackend(), settings);
  else singleton.setSettings(settings);
  return singleton;
}

/** Map persisted profile settings → audio channel settings. */
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
