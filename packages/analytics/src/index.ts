/**
 * @shikaku/analytics
 *
 * Pluggable analytics: a small event catalog (PRD §24) and a sink interface so
 * the app can fan events to console (dev), an in-memory buffer (tests), or a
 * real provider (GA4 / Firebase / Amplitude) without touching call sites.
 */

/** Analytics events from PRD §24. */
export type AnalyticsEvent =
  | 'app_open'
  | 'puzzle_start'
  | 'puzzle_complete'
  | 'hint_used'
  | 'achievement_unlock'
  | 'theme_unlock'
  | 'reward_claimed'
  | 'ad_watched'
  | 'session_end';

export type EventProps = Record<string, string | number | boolean | null | undefined>;

export interface AnalyticsSink {
  track(event: AnalyticsEvent, props?: EventProps): void;
}

/** Records events in memory — for tests and debugging. */
export class MemorySink implements AnalyticsSink {
  readonly events: Array<{ event: AnalyticsEvent; props?: EventProps; t: number }> = [];
  constructor(private now: () => number = () => 0) {}
  track(event: AnalyticsEvent, props?: EventProps): void {
    this.events.push({ event, props, t: this.now() });
  }
  count(event: AnalyticsEvent): number {
    return this.events.filter((e) => e.event === event).length;
  }
}

/** Logs events to the console (dev). */
export class ConsoleSink implements AnalyticsSink {
  track(event: AnalyticsEvent, props?: EventProps): void {
    // eslint-disable-next-line no-console
    console.debug(`[analytics] ${event}`, props ?? {});
  }
}

/** Fans an event out to multiple sinks; one failing sink never blocks others. */
export class CompositeSink implements AnalyticsSink {
  constructor(private sinks: AnalyticsSink[]) {}
  track(event: AnalyticsEvent, props?: EventProps): void {
    for (const s of this.sinks) {
      try {
        s.track(event, props);
      } catch {
        /* never let analytics break the app */
      }
    }
  }
}

/** Thin facade the app calls. Swap the sink to change destinations. */
export class Analytics {
  constructor(private sink: AnalyticsSink) {}
  setSink(sink: AnalyticsSink): void {
    this.sink = sink;
  }
  track(event: AnalyticsEvent, props?: EventProps): void {
    this.sink.track(event, props);
  }
}
