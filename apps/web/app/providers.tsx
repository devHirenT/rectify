'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from 'react';
import {
  loadProfile,
  saveProfile,
  defaultProfile,
  WebStorageKVStore,
  MemoryKVStore,
  type PlayerProfile,
  type KVStore,
} from '@shikaku/storage';
import { THEME_BY_ID, THEMES } from '../lib/themes';
import { track } from '../lib/services';
import { getSoundManager, toAudioSettings, haptic } from '../lib/audio';

interface ProfileContextValue {
  profile: PlayerProfile;
  ready: boolean;
  /** Apply a mutation and persist. */
  update: (mutate: (p: PlayerProfile) => void) => void;
  /** The underlying KV store (for transient state like the saved game). */
  store: KVStore;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

function makeStore(): KVStore {
  if (typeof window !== 'undefined' && window.localStorage) {
    return new WebStorageKVStore(window.localStorage);
  }
  return new MemoryKVStore();
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<PlayerProfile>(() => defaultProfile());
  const [ready, setReady] = useState(false);
  const store = useMemo(makeStore, []);

  // Hydrate from storage once on mount.
  useEffect(() => {
    let alive = true;
    loadProfile(store).then((p) => {
      if (!alive) return;
      setProfile(p);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, [store]);

  const update = useCallback(
    (mutate: (p: PlayerProfile) => void) => {
      setProfile((prev) => {
        const next: PlayerProfile = structuredClone(prev);
        mutate(next);
        void saveProfile(store, next);
        return next;
      });
    },
    [store],
  );

  // Analytics: app_open on mount, session_end on leave (PRD §24).
  useEffect(() => {
    track('app_open');
    const onHide = () => {
      if (document.visibilityState === 'hidden') track('session_end');
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

  // Keep the shared sound manager in sync with audio settings.
  useEffect(() => {
    getSoundManager(toAudioSettings(profile.settings));
  }, [profile.settings]);

  // Global UI feedback: a soft click + light haptic on any button/link/card
  // press across the app (the board and in-game controls have their own sounds,
  // so they're excluded). Also unlocks the audio context on first interaction.
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const sound = getSoundManager(toAudioSettings(profile.settings));
      void sound.resume();
      const target = e.target as Element | null;
      const el = target?.closest?.('button, a, [role="button"]');
      if (!el) return;
      if (el.closest('.board') || el.classList.contains('ctrl')) return; // own sounds
      sound.play('uiTap');
      haptic(8, profile.settings.hapticsEnabled);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [profile.settings]);

  // Register the service worker for offline play (PRD §4).
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    const onLoad = () => navigator.serviceWorker.register('/sw.js').catch(() => {});
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  // Apply the active theme + accessibility flags to the document.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const theme = THEME_BY_ID[profile.activeTheme] ?? THEMES[0]!;
    for (const [k, v] of Object.entries(theme.vars)) {
      document.documentElement.style.setProperty(k, v);
    }
    document.body.classList.toggle('reduced-motion', profile.settings.reducedMotion);
    document.body.classList.toggle('large-text', profile.settings.largeText);
    document.body.classList.toggle('high-contrast', profile.settings.highContrast);
    document.body.classList.toggle('colorblind', profile.settings.colorblindMode);
    document.body.classList.toggle('left-hand', profile.settings.leftHandMode);
  }, [
    profile.activeTheme,
    profile.settings.reducedMotion,
    profile.settings.largeText,
    profile.settings.highContrast,
    profile.settings.colorblindMode,
    profile.settings.leftHandMode,
  ]);

  const value = useMemo<ProfileContextValue>(
    () => ({ profile, ready, update, store }),
    [profile, ready, update, store],
  );

  return (
    <ProfileContext.Provider value={value}>
      <Splash ready={ready} settings={profile.settings} />
      {children}
    </ProfileContext.Provider>
  );
}

/** Branded splash that covers the initial profile load (PRD §5). */
function Splash({ ready, settings }: { ready: boolean; settings: PlayerProfile['settings'] }) {
  const [gone, setGone] = useState(false);
  const [hiding, setHiding] = useState(false);
  const chimed = useRef(false);

  const welcome = useCallback(() => {
    const sound = getSoundManager(toAudioSettings(settings));
    void sound.resume().then(() => {
      if (chimed.current) return;
      chimed.current = true;
      sound.play('complete'); // cheerful welcome jingle
    });
  }, [settings]);

  // Show the splash only once per browser session (not on every navigation
  // or refresh) — keeps it from blocking the app on deep links.
  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('splashShown')) setGone(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (typeof window !== 'undefined') {
      if (sessionStorage.getItem('splashShown')) {
        setGone(true);
        return;
      }
      sessionStorage.setItem('splashShown', '1');
    }
    welcome(); // best-effort (autoplay may defer until first tap)
    const fade = setTimeout(() => setHiding(true), 1400);
    const done = setTimeout(() => setGone(true), 1800);
    return () => {
      clearTimeout(fade);
      clearTimeout(done);
    };
  }, [ready, welcome]);

  function dismiss() {
    welcome(); // guaranteed-unlocked gesture → the chime plays here
    setHiding(true);
    setTimeout(() => setGone(true), 350);
  }

  if (gone) return null;
  return (
    <div className={'splash' + (hiding ? ' hide' : '')} onPointerDown={ready ? dismiss : undefined}>
      <div className="splash-grid">
        {Array.from({ length: 9 }, (_, i) => (
          <span key={i} style={{ animationDelay: `${i * 70}ms` }} />
        ))}
      </div>
      <h1>SHIKAKU MASTER</h1>
      <div className="splash-bar">
        <i />
      </div>
      <div className="splash-hint">{ready ? 'Tap to start' : 'Loading…'}</div>
    </div>
  );
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within <Providers>');
  return ctx;
}
