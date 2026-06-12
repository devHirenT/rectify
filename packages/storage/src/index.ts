/**
 * @shikaku/storage
 *
 * Platform-agnostic persistence: a tiny KVStore interface with adapters for
 * web (Web Storage) and in-memory (tests/SSR), plus the typed player-profile
 * repository. Mobile wires MMKV to the same KVStore interface in the app layer.
 */

export * from './kv.js';
export * from './profile.js';
export * from './savegame.js';
