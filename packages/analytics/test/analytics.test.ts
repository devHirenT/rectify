import { describe, it, expect, vi } from 'vitest';
import { Analytics, MemorySink, CompositeSink, type AnalyticsSink } from '../src/index.js';

describe('analytics', () => {
  it('records events with props in MemorySink', () => {
    const sink = new MemorySink();
    const a = new Analytics(sink);
    a.track('puzzle_complete', { difficulty: 'easy', stars: 3 });
    expect(sink.events).toHaveLength(1);
    expect(sink.events[0]!.event).toBe('puzzle_complete');
    expect(sink.events[0]!.props).toEqual({ difficulty: 'easy', stars: 3 });
    expect(sink.count('puzzle_complete')).toBe(1);
  });

  it('fans out to multiple sinks and survives a throwing sink', () => {
    const good = new MemorySink();
    const bad: AnalyticsSink = { track: vi.fn(() => { throw new Error('boom'); }) };
    const a = new Analytics(new CompositeSink([bad, good]));
    expect(() => a.track('app_open')).not.toThrow();
    expect(good.count('app_open')).toBe(1);
  });

  it('can swap sinks at runtime', () => {
    const s1 = new MemorySink();
    const s2 = new MemorySink();
    const a = new Analytics(s1);
    a.track('app_open');
    a.setSink(s2);
    a.track('session_end');
    expect(s1.count('app_open')).toBe(1);
    expect(s2.count('session_end')).toBe(1);
  });
});
