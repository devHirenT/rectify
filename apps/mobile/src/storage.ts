import { type KVStore, MemoryKVStore } from '@shikaku/storage';
import { createMMKV, type MMKV } from 'react-native-mmkv';

/**
 * Mobile KV store backed by MMKV (fast, synchronous, persistent — PRD §21).
 *
 * The shared KVStore interface is async, so we wrap MMKV's synchronous calls in
 * resolved promises. If MMKV's native module is unavailable (e.g. Expo Go
 * without a dev client), we fall back to an in-memory store so the app still
 * runs (without persistence) rather than crashing.
 */
class MMKVKVStore implements KVStore {
  constructor(private readonly mmkv: MMKV) {}

  async get(key: string): Promise<string | null> {
    return this.mmkv.getString(key) ?? null;
  }
  async set(key: string, value: string): Promise<void> {
    this.mmkv.set(key, value);
  }
  async remove(key: string): Promise<void> {
    this.mmkv.remove(key);
  }
  async clear(): Promise<void> {
    this.mmkv.clearAll();
  }
  async keys(): Promise<string[]> {
    return this.mmkv.getAllKeys();
  }
}

export function createStore(): KVStore {
  try {
    // MMKV 4.x (Nitro) creates instances via a factory, not `new MMKV()`.
    return new MMKVKVStore(createMMKV({ id: 'shikaku' }));
  } catch {
    // Native module not linked (e.g. plain Expo Go) — degrade gracefully.
    return new MemoryKVStore();
  }
}
