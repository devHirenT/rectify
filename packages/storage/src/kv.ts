/**
 * Minimal synchronous-ish key-value store interface.
 *
 * Both MMKV (mobile) and Web Storage / IndexedDB (web) can implement this.
 * Methods return promises so an async backend (IndexedDB) fits the same shape;
 * synchronous backends (MMKV, localStorage) simply resolve immediately.
 */
export interface KVStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  /** Remove everything this app owns. */
  clear(): Promise<void>;
  keys(): Promise<string[]>;
}

/** In-memory KV store — used for tests and as an SSR-safe fallback. */
export class MemoryKVStore implements KVStore {
  private map = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.map.has(key) ? this.map.get(key)! : null;
  }
  async set(key: string, value: string): Promise<void> {
    this.map.set(key, value);
  }
  async remove(key: string): Promise<void> {
    this.map.delete(key);
  }
  async clear(): Promise<void> {
    this.map.clear();
  }
  async keys(): Promise<string[]> {
    return [...this.map.keys()];
  }
}

/**
 * Adapter over the Web Storage API (localStorage / sessionStorage).
 * Use as the simple web default; swap for an IndexedDB adapter if quota grows.
 */
export class WebStorageKVStore implements KVStore {
  constructor(
    private readonly storage: Storage,
    private readonly prefix = 'shikaku:',
  ) {}

  async get(key: string): Promise<string | null> {
    return this.storage.getItem(this.prefix + key);
  }
  async set(key: string, value: string): Promise<void> {
    this.storage.setItem(this.prefix + key, value);
  }
  async remove(key: string): Promise<void> {
    this.storage.removeItem(this.prefix + key);
  }
  async clear(): Promise<void> {
    for (const k of await this.keys()) this.storage.removeItem(this.prefix + k);
  }
  async keys(): Promise<string[]> {
    const out: string[] = [];
    for (let i = 0; i < this.storage.length; i++) {
      const full = this.storage.key(i);
      if (full && full.startsWith(this.prefix)) out.push(full.slice(this.prefix.length));
    }
    return out;
  }
}

/** Typed JSON helpers layered over any KVStore. */
export async function getJSON<T>(store: KVStore, key: string, fallback: T): Promise<T> {
  const raw = await store.get(key);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function setJSON<T>(store: KVStore, key: string, value: T): Promise<void> {
  await store.set(key, JSON.stringify(value));
}
