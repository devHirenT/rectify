import { describe, it, expect } from 'vitest';
import {
  MemoryKVStore,
  getJSON,
  setJSON,
  loadProfile,
  saveProfile,
  defaultProfile,
} from '../src/index.js';

describe('MemoryKVStore', () => {
  it('round-trips values', async () => {
    const kv = new MemoryKVStore();
    await kv.set('a', '1');
    expect(await kv.get('a')).toBe('1');
    await kv.remove('a');
    expect(await kv.get('a')).toBeNull();
  });

  it('lists keys and clears', async () => {
    const kv = new MemoryKVStore();
    await kv.set('a', '1');
    await kv.set('b', '2');
    expect((await kv.keys()).sort()).toEqual(['a', 'b']);
    await kv.clear();
    expect(await kv.keys()).toEqual([]);
  });
});

describe('JSON helpers', () => {
  it('returns fallback for missing or corrupt values', async () => {
    const kv = new MemoryKVStore();
    expect(await getJSON(kv, 'missing', { x: 1 })).toEqual({ x: 1 });
    await kv.set('bad', '{not json');
    expect(await getJSON(kv, 'bad', 42)).toBe(42);
  });

  it('round-trips typed JSON', async () => {
    const kv = new MemoryKVStore();
    await setJSON(kv, 'obj', { name: 'shikaku', n: 3 });
    expect(await getJSON(kv, 'obj', null)).toEqual({ name: 'shikaku', n: 3 });
  });
});

describe('profile repository', () => {
  it('loads defaults when empty', async () => {
    const kv = new MemoryKVStore();
    const p = await loadProfile(kv);
    expect(p.coins).toBe(0);
    expect(p.activeTheme).toBe('classic');
    expect(p.version).toBe(1);
  });

  it('persists and reloads', async () => {
    const kv = new MemoryKVStore();
    const p = defaultProfile();
    p.coins = 250;
    p.unlockedThemes.push('ocean');
    await saveProfile(kv, p);
    const loaded = await loadProfile(kv);
    expect(loaded.coins).toBe(250);
    expect(loaded.unlockedThemes).toContain('ocean');
  });

  it('remaps legacy gen-id level completions to canonical ids in order', async () => {
    const kv = new MemoryKVStore();
    await kv.set(
      'profile',
      JSON.stringify({
        completedLevels: { easy: ['gen-111-0', 'gen-222-1'] },
        starsByLevel: { 'gen-111-0': 3, 'gen-222-1': 2 },
        bestTimeByLevel: { 'gen-111-0': 40, 'gen-222-1': 55 },
      }),
    );
    const p = await loadProfile(kv);
    expect(p.completedLevels.easy).toEqual(['easy-1', 'easy-2']);
    expect(p.starsByLevel['easy-1']).toBe(3);
    expect(p.starsByLevel['easy-2']).toBe(2);
    expect(p.bestTimeByLevel['easy-1']).toBe(40);
    // Old keys are removed.
    expect(p.starsByLevel['gen-111-0']).toBeUndefined();
  });

  it('merges defaults for partial/old saves', async () => {
    const kv = new MemoryKVStore();
    // Simulate an old save missing newer fields.
    await kv.set('profile', JSON.stringify({ coins: 10 }));
    const loaded = await loadProfile(kv);
    expect(loaded.coins).toBe(10);
    expect(loaded.settings.hapticsEnabled).toBe(true); // filled from defaults
    expect(loaded.streak.current).toBe(0);
  });
});
