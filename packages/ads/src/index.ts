/**
 * @shikaku/ads
 *
 * Platform-agnostic ad abstraction (PRD §22). The app calls this interface;
 * platforms provide an implementation (AdMob via react-native-google-mobile-ads
 * on mobile; a web provider / house ads on web). A TestAdManager lets the game
 * run end-to-end with no ad SDK configured.
 */

export type RewardedPlacement = 'double_coins' | 'extra_hint' | 'extra_reward' | 'theme_fragment';

export interface AdManager {
  /** Show a rewarded ad; resolves true if the reward should be granted. */
  showRewarded(placement: RewardedPlacement): Promise<boolean>;
  /** Show an interstitial (between levels). Resolves when dismissed. */
  showInterstitial(): Promise<void>;
  /** Whether a banner may be shown on the current screen. */
  bannerAllowed(screen: string): boolean;
}

/** Interstitials show every N completed levels, never during gameplay (§22). */
export const INTERSTITIAL_EVERY = 4;

export function shouldShowInterstitial(levelsCompleted: number): boolean {
  return levelsCompleted > 0 && levelsCompleted % INTERSTITIAL_EVERY === 0;
}

/** Banner policy: Home only — never on the puzzle/game screen (§22). */
export function bannerAllowed(screen: string): boolean {
  return screen === 'home';
}

/**
 * No-network test provider: rewarded "succeeds", interstitial is instant.
 * Used until a real ad SDK is wired; keeps the reward flows fully testable.
 */
export class TestAdManager implements AdManager {
  constructor(private readonly grant = true) {}
  async showRewarded(_placement: RewardedPlacement): Promise<boolean> {
    return this.grant;
  }
  async showInterstitial(): Promise<void> {
    /* no-op */
  }
  bannerAllowed(screen: string): boolean {
    return bannerAllowed(screen);
  }
}
