# Shikaku Master — Implementation Status

Offline-first Shikaku puzzle game. TurboRepo monorepo with a shared TypeScript
core consumed by a Next.js PWA (web) and an Expo React Native app (mobile).
See `readme.md` (PRD), `DESIGN.md` (design tokens), `SCREENS.md` (screen specs).

## Layout

```
apps/
  web/        Next.js 14 PWA  — playable, E2E-verified
  mobile/     Expo RN app     — full screen parity, typechecks (needs device to run)
packages/
  game-engine/   generation (unique-solution guaranteed), exact-cover solver,
                 difficulty scoring, daily challenge, play grading, smart-snap inputs
  storage/       KVStore (Web Storage / MMKV / in-memory) + profile + saved-game
  rewards/       coins, XP/levels, stars, streaks, 7-day login cycle
  achievements/  catalog + progress engine
  audio/         sound events, channels, dynamic-music staging, SoundManager
  ads/           rewarded/interstitial/banner abstraction + policy + TestAdManager
  analytics/     pluggable event sink (memory/console/composite) + PRD §24 events
```

## Commands

```bash
npm install
npm run build       # turbo build (packages then apps)
npm test            # all package suites (73 tests)
npm run typecheck   # every package + app

cd apps/web && npm run dev       # http://localhost:3000
cd apps/mobile && npm run ios    # or android / start (needs simulator)
```

## Implemented
- **Engine & economy** — unique-solution generator, daily, stars, coins/XP,
  streaks, login cycle, hint economy. Fully unit-tested.
- **Web** — all screens (Home, Difficulty, Level Select, Game, Pause, Victory,
  Themes, Stats, Achievements, Settings) + Splash, Daily-login, Onboarding.
  9 themes, accessibility (colorblind glyphs, high-contrast, large-text,
  reduced-motion, left-hand), board-game SFX + global UI click sounds, gestures
  (draw/erase/pinch-zoom/pan/long-press-lock/double-tap-focus), smart-snap,
  resume, offline service worker, ads + analytics wiring, animations
  (floating bg, star pop, confetti, rect pop, hint glow).
- **Mobile** — same screen set + bottom nav, MMKV persistence, gestures, haptics,
  audio manager (expo-av backend), resume, ads/hint flows.

## Verified
- 24 turbo tasks green; **73 unit tests** pass.
- Web: production build + browser E2E (13/13 core + 6/6 audio/gesture), 0 console errors.
- Mobile: typechecks clean.

## Known gaps (not runtime-verified / external)
- Mobile not run on a device/emulator here (MMKV, pinch math, expo-av unproven on-device).
- No sound asset files (web synthesizes; mobile silent until assets added).
- Ads/analytics use a test/console provider — real AdMob + GA4/Firebase need keys.
- Theme fragments / premium chest pay placeholder coins.
- No ESLint config (only TypeScript typechecking).
