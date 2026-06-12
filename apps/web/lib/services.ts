'use client';

import {
  Analytics,
  CompositeSink,
  ConsoleSink,
  MemorySink,
  type AnalyticsEvent,
  type EventProps,
} from '@shikaku/analytics';
import { TestAdManager, type AdManager } from '@shikaku/ads';

/**
 * App-level service singletons (analytics + ads). Swap the sink / ad manager
 * here to point at GA4/Firebase or a real ad SDK without touching call sites.
 */

// In-memory buffer is handy for debugging + the E2E (window.__analytics).
const memory = new MemorySink(() => Date.now());
export const analytics = new Analytics(new CompositeSink([memory, new ConsoleSink()]));

if (typeof window !== 'undefined') {
  (window as unknown as { __analytics?: MemorySink }).__analytics = memory;
}

/** Convenience tracker. */
export function track(event: AnalyticsEvent, props?: EventProps): void {
  analytics.track(event, props);
}

/** Web ad manager — TestAdManager for now (grants rewarded, instant interstitial). */
export const ads: AdManager = new TestAdManager();
