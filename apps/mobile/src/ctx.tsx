import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import {
  loadProfile,
  saveProfile,
  defaultProfile,
  type PlayerProfile,
  type KVStore,
} from '@shikaku/storage';
import type { Difficulty } from '@shikaku/game-engine';
import { createStore } from './storage';
import { getSoundManager, toAudioSettings } from './audio';
import { THEME_BY_ID, THEMES, type NativeTheme } from './theme';

/** Navigation state for the simple stack-free router. */
export type Nav =
  | { screen: 'home' }
  | { screen: 'levels'; difficulty: Difficulty }
  | { screen: 'game'; mode: Difficulty | 'daily'; level?: number }
  | { screen: 'themes' }
  | { screen: 'stats' }
  | { screen: 'achievements' }
  | { screen: 'settings' };

interface AppContextValue {
  profile: PlayerProfile;
  ready: boolean;
  update: (mutate: (p: PlayerProfile) => void) => void;
  store: KVStore;
  theme: NativeTheme;
  nav: Nav;
  go: (nav: Nav) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const store = useMemo<KVStore>(() => createStore(), []);
  const [profile, setProfile] = useState<PlayerProfile>(() => defaultProfile());
  const [ready, setReady] = useState(false);
  const [nav, setNav] = useState<Nav>({ screen: 'home' });

  useEffect(() => {
    let alive = true;
    void loadProfile(store).then((p) => {
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
        const next: PlayerProfile = JSON.parse(JSON.stringify(prev));
        mutate(next);
        void saveProfile(store, next);
        return next;
      });
    },
    [store],
  );

  // Keep the sound manager's settings in sync with the profile.
  useEffect(() => {
    getSoundManager(toAudioSettings(profile.settings));
  }, [profile.settings]);

  const theme = THEME_BY_ID[profile.activeTheme] ?? THEMES[0]!;
  const go = useCallback((n: Nav) => setNav(n), []);

  const value = useMemo<AppContextValue>(
    () => ({ profile, ready, update, store, theme, nav, go }),
    [profile, ready, update, store, theme, nav, go],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within <AppProvider>');
  return ctx;
}
