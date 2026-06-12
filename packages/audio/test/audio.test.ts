import { describe, it, expect, vi } from 'vitest';
import {
  SFX,
  channelVolume,
  effectiveGain,
  musicStage,
  activeLayers,
  SoundManager,
  DEFAULT_AUDIO_SETTINGS,
  type AudioBackend,
  type AudioSettings,
} from '../src/index.js';

const settings = (over: Partial<AudioSettings> = {}): AudioSettings => ({
  ...DEFAULT_AUDIO_SETTINGS,
  ...over,
});

describe('channels', () => {
  it('returns 0 for every channel when audio is disabled', () => {
    const s = settings({ audioEnabled: false });
    expect(channelVolume('music', s)).toBe(0);
    expect(channelVolume('effects', s)).toBe(0);
  });

  it('reflects per-channel volumes', () => {
    const s = settings({ effects: 0.5, ui: 0.2 });
    expect(channelVolume('effects', s)).toBe(0.5);
    expect(channelVolume('ui', s)).toBe(0.2);
  });

  it('effectiveGain multiplies base gain by channel volume', () => {
    const s = settings({ effects: 0.5 });
    expect(effectiveGain(SFX.correct, s)).toBeCloseTo(SFX.correct.gain * 0.5);
  });
});

describe('dynamic music staging', () => {
  it('maps completion to stages at the PRD thresholds', () => {
    expect(musicStage(0)).toBe('calm');
    expect(musicStage(0.49)).toBe('calm');
    expect(musicStage(0.5)).toBe('energy');
    expect(musicStage(0.89)).toBe('energy');
    expect(musicStage(0.9)).toBe('anticipation');
    expect(musicStage(1)).toBe('victory');
  });

  it('adds layers as intensity rises', () => {
    expect(activeLayers('calm')).toBe(1);
    expect(activeLayers('victory')).toBe(4);
  });
});

describe('SoundManager', () => {
  function fakeBackend() {
    return {
      playTone: vi.fn(),
      setMusic: vi.fn(),
      stopMusic: vi.fn(),
      resume: vi.fn(),
    } satisfies AudioBackend & Record<string, unknown>;
  }

  it('plays a tone with the channel-scaled gain', () => {
    const be = fakeBackend();
    const mgr = new SoundManager(be, settings({ effects: 0.5 }));
    mgr.play('correct');
    expect(be.playTone).toHaveBeenCalledTimes(1);
    const [event, , gain] = be.playTone.mock.calls[0]!;
    expect(event).toBe('correct');
    expect(gain).toBeCloseTo(SFX.correct.gain * 0.5);
  });

  it('does not play when the channel is muted', () => {
    const be = fakeBackend();
    const mgr = new SoundManager(be, settings({ audioEnabled: false }));
    mgr.play('correct');
    expect(be.playTone).not.toHaveBeenCalled();
  });

  it('drives music stage transitions from completion', () => {
    const be = fakeBackend();
    const mgr = new SoundManager(be, settings());
    mgr.startMusic();
    expect(mgr.currentStage).toBe('calm');
    mgr.setCompletion(0.6);
    expect(mgr.currentStage).toBe('energy');
    mgr.setCompletion(1);
    expect(mgr.currentStage).toBe('victory');
    // setMusic called on start + each stage change.
    expect(be.setMusic).toHaveBeenCalled();
  });

  it('updates music gain live when settings change', () => {
    const be = fakeBackend();
    const mgr = new SoundManager(be, settings({ music: 0.7 }));
    mgr.startMusic();
    be.setMusic.mockClear();
    mgr.setSettings(settings({ music: 0.2 }));
    expect(be.setMusic).toHaveBeenCalledTimes(1);
    const [, , gain] = be.setMusic.mock.calls[0]!;
    expect(gain).toBeCloseTo(0.2);
  });

  it('stops music', () => {
    const be = fakeBackend();
    const mgr = new SoundManager(be, settings());
    mgr.startMusic();
    mgr.stopMusic();
    expect(be.stopMusic).toHaveBeenCalled();
  });
});
