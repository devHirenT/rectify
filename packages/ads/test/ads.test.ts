import { describe, it, expect } from 'vitest';
import { shouldShowInterstitial, bannerAllowed, TestAdManager } from '../src/index.js';

describe('ad policy', () => {
  it('shows an interstitial every 4 completed levels (PRD §22)', () => {
    expect(shouldShowInterstitial(0)).toBe(false);
    expect(shouldShowInterstitial(3)).toBe(false);
    expect(shouldShowInterstitial(4)).toBe(true);
    expect(shouldShowInterstitial(8)).toBe(true);
    expect(shouldShowInterstitial(9)).toBe(false);
  });

  it('allows banners only on home, never on the game screen', () => {
    expect(bannerAllowed('home')).toBe(true);
    expect(bannerAllowed('game')).toBe(false);
    expect(bannerAllowed('play')).toBe(false);
  });

  it('TestAdManager grants rewarded by default', async () => {
    const ads = new TestAdManager();
    expect(await ads.showRewarded('double_coins')).toBe(true);
    await expect(ads.showInterstitial()).resolves.toBeUndefined();
  });
});
