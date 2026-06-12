# Shikaku Master — Screen Specification

> Screen-by-screen spec for both apps (web Next.js + mobile Expo). Pairs with
> [DESIGN.md](DESIGN.md) for visual tokens and [readme.md](readme.md) for the
> PRD. Every screen lists: **purpose · layout · components · data · interactions
> · states · navigation · wiring**. Components read design tokens only — no
> hard-coded styling.

## Conventions used below
- **Wiring** = which `@shikaku/*` package + which profile fields a screen reads/writes.
- **States** = loading / empty / error / solved etc. where relevant.
- Tokens like `--accent`, `--surface-1`, `--t-h1` are defined in DESIGN.md.
- Gestures follow PRD §6.

## Screen map / navigation graph

```
Splash
  └─► Home ──┬─► Play (Difficulty Select) ─► Level Select ─► Game ─► Victory ─┐
             │                                                 ▲              │
             │                                                 └── Pause ─────┤
             ├─► Daily Challenge ─────────────► Game ─► Victory               │
             ├─► Themes (Theme Store)                                         │
             ├─► Achievements                          Next Level / Replay ◄──┘
             ├─► Statistics
             └─► Settings
  Daily Login Reward = modal shown over Home on first open of a new day.
```

---

## 1. Splash Screen  (PRD §5 · Splash)

- **Purpose.** Brand moment + cover the initial profile load from storage.
- **Duration.** ~2s, or until `useProfile().ready` is true (whichever is longer,
  capped at 2.5s so a fast load still shows the animation).
- **Layout.** Full-bleed `--bg-gradient`. Centered logo lockup. Loading progress
  (thin determinate bar or pulsing dots) near bottom. Animated grid of faint
  rectangles drifting behind the logo.
- **Components.** `Logo`, `ProgressBar`, `AnimatedGridBackdrop`.
- **Data.** None visible. Triggers profile hydration + daily-login check.
- **Interactions.** None (non-interactive). Tap does nothing.
- **Motion.** Logo: scale `.92→1` + fade, `--ease-spring`. Grid rectangles draw
  in with staggered stroke-dashoffset. Skip animation under reduced-motion → show
  static logo for 1s.
- **States.** Always shows; on storage error still proceeds with default profile.
- **Navigation.** Auto-advance → **Home** (replace, no back).
- **Wiring.** `loadProfile()` from `@shikaku/storage`; `claimLoginReward()` /
  daily-challenge availability check from `@shikaku/rewards`.

---

## 2. Home Screen  (PRD §5 · Home)

- **Purpose.** Hub. Route to every mode/section; surface progress + streak.
- **Layout (top→bottom).**
  1. **Top bar** — stat pills: 🪙 coins · ⭐ Level (with mini XP ring) · 🔥 streak.
  2. **Brand** — logo wordmark + tagline.
  3. **Continue** card (only if a game is in progress) — resumes last puzzle.
  4. **Play** (primary, full-width featured card with accent top strip).
  5. **Daily Challenge** card — shows ✓ if today's already solved, else "New".
  6. 2-col grid: **Themes**, **Statistics**.
  7. 2-col grid: **Achievements**, **Settings**.
  8. Animated background: floating rectangles (PRD §5), `--text-faint` ~6%.
- **Components.** `StatPill`, `FeaturedCard`, `MenuCard`, `XPRing`, `FloatingShapes`.
- **Data shown.** `profile.coins`, `profile.level` + XP progress, `streak.current`,
  themes unlocked count, `stats.puzzlesSolved`, daily-solved flag.
- **Interactions.** Tap card → navigate. Cards lift on hover/press (DESIGN §5).
  Long-press Daily → preview tooltip (optional).
- **States.**
  - *No progress:* hide Continue card.
  - *Daily done:* Daily card shows ✓ + streak count, tapping replays (no reward).
  - *Level-up pending:* a small toast/badge on the Level pill.
- **Navigation.** → Play, Daily(Game), Themes, Stats, Achievements, Settings.
- **Wiring.** Reads whole `profile`. Daily flag = `streak.lastDailyKey === todayKey`.

---

## 3. Difficulty Select  (PRD §5 · Difficulty · §10)

- **Purpose.** Choose a difficulty band before playing.
- **Layout.** Back pill + coins in top bar. Title "Choose Difficulty". Vertical
  list of difficulty cards: **Easy, Medium, Hard, Expert, Master, Infinite**.
- **Each card (PRD §5).**
  - Left: name (`--t-h2`) + grid-size range (`--t-caption`, e.g. "6×6 – 7×7").
  - Right: **Completion %**, **stars earned**, **best time** for that band.
  - Progress ring (stroke `--accent`) around the completion %.
  - **Locked** bands (if gating by progression): 40% opacity + lock glyph;
    sublabel "Reach Level N".
- **Components.** `DifficultyCard`, `ProgressRing`, `StarRow`, `LockBadge`.
- **Data.** Per-band: completed count vs total, aggregate stars, best time —
  derived from `profile.completedLevels[difficulty]`, `starsByLevel`,
  `bestTimeByLevel`.
- **Interactions.** Tap unlocked card → Level Select (or straight to Game for
  Infinite, which has no discrete levels).
- **States.** Locked / unlocked / fully-completed (gold check on the card).
- **Navigation.** → Level Select (Easy…Master) or → Game (Infinite). Back → Home.
- **Wiring.** `DIFFICULTY_SIZES` from `@shikaku/game-engine`; completion from `profile`.

---

er rewarded ad for a fragment (PRD §22).
- **States.** owned / active / affordable / unaffordable / fragment-gated.
- **Navigation.** Back → Home. Applying stays on screen.
- **Wiring.** Theme list from `lib/themes.ts` (web) / `theme.ts` (mobile);
  persists to `profile.unlockedThemes` + `activeTheme`.

---

## 9. Achievements Screen  (PRD §5 · Achievement · §15)

- **Purpose.** Track achievement progress across categories.
- **Layout.** Top bar (back). Category tabs/segments: **Progress · Skill ·
  Collection · Streak**. Under each, a list of achievement rows.
- **Each achievement row.** Icon, title, description, progress bar
  (`current/threshold`), unlocked check + date, or % toward unlock. Locked-but-
  close items can be highlighted.
- **Components.** `CategoryTabs`, `AchievementRow`, `ProgressBar`, `UnlockBadge`.
- **Data.** `evaluate(metrics)` → list of `{achievement, current, unlocked, ratio}`
  where metrics derive from `profile.stats` + streak.
- **Interactions.** Switch category tab. Tap row → detail popover (reward, tips).
  Newly-unlocked items get a one-time celebration on entry.
- **States.** locked / in-progress / unlocked. Empty category → "No achievements
  here yet."
- **Navigation.** Back → Home.
- **Wiring.** `@shikaku/achievements` `evaluate()` + `ACHIEVEMENTS`; reads
  `profile.stats`, `profile.streak.longest`, `profile.achievements`.

---

## 10. Statistics Screen  (PRD §5 · Statistics)

- **Purpose.** Show lifetime performance.
- **Layout.** Top bar (back). Header: Level + XP bar. Grid/list of stat rows
  (PRD §5): **Puzzles Solved · Average Time · Best Time · Perfect Solves · Hints
  Used · Current Streak · Longest Streak**. Optional small charts (solves/day,
  stars distribution) as a future enhancement.
- **Components.** `StatRow`, `XPBar`, `MiniChart` (future).
- **Data.** `profile.stats.*`, `profile.streak.*`, `levelFromXp(profile.xp)`.
- **Interactions.** Mostly read-only. Pull-to-refresh recomputes (mobile).
- **States.** Fresh account → zeros with friendly copy ("Solve your first
  puzzle to start your stats!").
- **Navigation.** Back → Home.
- **Wiring.** Reads `profile`; `levelFromXp` from `@shikaku/rewards`.

---

## 11. Settings Screen  (implied; PRD §8 audio · §20 accessibility)

- **Purpose.** Audio, haptics, accessibility, account/data controls.
- **Layout.** Grouped sections:
  1. **Audio (PRD §8):** independent sliders — Music · Effects · UI · Ambient;
     master Audio toggle; music theme picker (LoFi Focus, Relaxing Piano, Forest,
     Ocean, Galaxy Synth).
  2. **Haptics:** on/off toggle (PRD §7/§20).
  3. **Accessibility (PRD §20):** Colorblind mode · High contrast · Large text ·
     Reduced motion · Left-hand mode.
  4. **Data:** Restore purchases, Cloud backup (future), Reset progress (confirm).
  5. **About:** version, links.
- **Compon## 4. Level Selection  (PRD §5 · Level Selection)

- **Purpose.** Pick a specific level within a difficulty band.
- **Layout.** Top bar (back + coins). Scrollable grid of **level cards** (e.g.
  4-up). Each shows level number, star result (0–3), lock state. A subtle path/
  progress indicator connects unlocked levels.
- **Each level card.**
  - **Unlocked, unplayed:** number, `--surface-1`, accent border.
  - **Completed:** number + earned stars (gold), faint check.
  - **Locked:** lock glyph, 40% opacity; unlocked when previous level solved.
- **Components.** `LevelCard`, `StarRow`, `LockBadge`, `ProgressTrail`.
- **Data.** Level ids `${difficulty}-${n}`; `starsByLevel[id]`, completion set.
- **Interactions.** Tap unlocked level → Game with that level's seed. Locked →
  shake + "Complete level N-1 first".
- **States.** loading (generating thumbnails optional) / locked / done.
- **Navigation.** → Game. Back → Difficulty Select.
- **Wiring.** Level seed is deterministic: `seed = hashSeed(`${difficulty}-${n}`)`
  so a level is always the same puzzle. `@shikaku/game-engine`.
- **Note.** **Infinite** mode skips this screen — it generates endless levels on
  the fly and increments size/score over time.

---

## 5. Game Screen  (PRD §5 · Game · §6 gestures · §7 haptics)

- **Purpose.** The core play surface.
- **Layout.**
  - **Top bar:** Coins · XP/Level · Hints remaining · ⏱ timer · Pause button.
  - **Center:** the **board** (DESIGN §6) — the hero. Auto-sized to viewport.
  - **Bottom action bar:** **Undo · Retry · Hint · Zoom** (PRD §5). Left-hand
    mode (PRD §20) mirrors this bar to the left / flips primary hand.
  - Hint banner under board: "Drag to draw · tap to remove · mistakes: N".
- **Components.** `TopBar`, `Board`, `ActionBar`, `AreaCounter`, `HintBadge`.
- **Data.** Current `puzzle` (rows, cols, clues), player `placed[]` rects,
  `mistakes`, `hintsUsed`, elapsed time, coins/level (live).
- **Gestures (PRD §6).**
  | Gesture | Action |
  |---|---|
  | Single tap (empty) | select cell / start point |
  | Tap on a rectangle | remove it |
  | Double tap | focus a clue (highlight its region candidates) |
  | Long press | lock a completed rectangle |
  | Drag | create rectangle (live preview + area counter) |
  | Pinch | zoom board |
  | Pan | move board when zoomed |
  | Two-finger double tap | reset zoom |
- **Smart snap (PRD §6).** Drawn rect snaps to grid cells; if it contains exactly
  one clue and is one row/col off the required area, offer a snap to the matching
  dimension.
- **Haptics (PRD §7).** Correct placement → light tap. Wrong → double-tap buzz.
  Hint → soft pulse. (Gated by `settings.hapticsEnabled`.)
- **Feedback.** Valid rect glows `--good`; invalid shakes + `--bad`. Live area
  counter recolors (neutral/good/bad).
- **Interactions / controls.**
  - **Undo** — pop last placement (history stack). Disabled when empty/solved.
  - **Retry** — clear all placements (keeps timer/mistakes? → resets placements only).
  - **Hint** — reveal one correct rectangle; `hintsUsed++`; costs a hint token or
    a rewarded ad if out (PRD §22).
  - **Zoom** — toggle/step zoom; also via pinch.
  - **Pause** — open Pause overlay (timer pauses).
- **States.** playing / paused / solved (→ Victory) / out-of-hints (offer ad).
- **Win detection.** `isSolved(placed, clues, rows, cols)` from `@shikaku/game-engine`.
- **Navigation.** → Pause (overlay), → Victory (on solve), Back = Pause→Exit.
- **Wiring.** `generatePuzzle` / `generateDailyChallenge`, `isSolved`,
  `rectStatus`, `computeStars` (engine); rewards granted on solve via
  `coinsForSolve` + `xpForSolve` + `addXp` (`@shikaku/rewards`), persisted to
  `profile`.

---

## 6. Pause Screen  (PRD §5 · Pause)

- **Purpose.** Pause play; quick settings + exit.
- **Layout.** Modal overlay (backdrop blur, DESIGN §5 Modal) over a frozen board.
  Buttons stacked: **Resume (primary) · Restart · Settings · Exit**.
- **Components.** `Modal`, `Button` ×4.
- **Data.** Current puzzle title, elapsed (frozen).
- **Interactions.** Resume → close, resume timer. Restart → confirm → reset
  placements + timer. Settings → opens Settings (returns to pause). Exit →
  confirm (progress lost) → Home.
- **States.** Always modal; confirm sub-dialogs for Restart/Exit.
- **Navigation.** Resume → Game; Exit → Home; Settings → Settings.
- **Wiring.** Local game state only; no persistence beyond optional "in progress".

---

## 7. Victory Screen  (PRD §5 · Victory · §12–14 rewards)

- **Purpose.** Celebrate the solve and pay out rewards.
- **Layout.** Modal/full overlay. Top: **confetti** (reduced-motion → none).
  **Stars** (1–3, animate in sequentially). Title "Puzzle Complete!". Stats row:
  time · mistakes · hints · "Perfect!" badge if applicable. **Reward row:**
  +coins (🪙, breakdown on tap) and +XP with an XP bar fill animation; level-up
  burst if it crossed a level. Buttons: **Next Level (primary) · Replay**;
  secondary **Home**. Optional **"Double coins — Watch Ad"** (PRD §22).
- **Components.** `Confetti`, `StarBurst`, `RewardRow`, `XPBar`, `Button`,
  `RewardedAdButton`.
- **Data.** `stars`, coin breakdown (`coinsForSolve`), xp gained (`xpForSolve`),
  before/after level (`addXp`), time, mistakes, hints, perfect flag, daily bonus.
- **Interactions.** Next → next level/new seed. Replay → same puzzle reset.
  Double-coins ad → multiply via `applyCoinMultiplier`. Tap reward → breakdown.
- **States.** standard / perfect (extra flourish) / daily (shows +100 + streak
  increment + multiplier) / level-up.
- **Navigation.** Next → Game; Replay → Game; Home → Home.
- **Wiring.** Reward calc from `@shikaku/rewards`; persists coins/xp/level/stats/
  stars/streak to `profile`; fires `newlyUnlocked()` (`@shikaku/achievements`)
  and queues achievement toasts.

---

## 8. Theme Store  (PRD §5 · Theme Store · §19)

- **Purpose.** Preview, unlock, and apply themes.
- **Layout.** Top bar (back + coins). Grid (2-col) of **theme swatch cards** for
  all 9 themes (Classic, Dark Pro, Ocean, Forest, Cyberpunk, Galaxy, Candy,
  Minimal, Golden). Each card = live preview swatch (mini board/gradient) +
  name + state label.
- **Each card states.** Active ("✓ Active") · Owned ("Tap to apply") · Free ·
  Locked ("🪙 500" or "Theme Fragments ×N"). Tapping applies instantly (live
  re-theme of the whole app).
- **Components.** `ThemeSwatch`, `MiniBoardPreview`, `PriceTag`, `OwnedBadge`.
- **Data.** `profile.unlockedThemes`, `profile.activeTheme`, `profile.coins`,
  theme fragments balance (future).
- **Interactions.** Tap owned → set `activeTheme`. Tap locked + enough coins →
  confirm purchase → unlock + apply. Not enough → shake + "Earn more coins" /
  offents.** `Slider`, `Toggle`, `SegmentedPicker`, `ListRow`, `DangerButton`.
- **Data.** `profile.settings.*`. All changes apply live and persist immediately.
- **Interactions.** Slider drag → live volume; toggles flip body classes / theme
  flags (e.g. `reduced-motion`, `large-text`) instantly.
- **States.** Cloud backup signed-in/out (future). Reset = destructive confirm.
- **Navigation.** Back → Home (or returns to Pause if opened from there).
- **Wiring.** Writes `profile.settings`; audio package consumes volumes; layout
  applies accessibility classes (see web `Providers`).

---

## 12. Daily Challenge  (PRD §5 implied · §16)

- **Purpose.** One deterministic puzzle per calendar day, shared by all players.
- **Entry.** Home → Daily card → **Game Screen** in `mode='daily'`.
- **Differences from a normal game.**
  - Puzzle = `generateDailyChallenge(new Date())` → id `daily-YYYY-MM-DD`, same
    for everyone, fully offline.
  - Completion bonus +100 coins (PRD §12) and advances the **streak** (PRD §17),
    applying the streak multiplier to rewards.
  - Once solved today, replays give no reward (Victory shows "Already claimed").
- **Wiring.** `generateDailyChallenge` (engine), `registerDailyCompletion`
  (`@shikaku/rewards`) writes `streak.*` + `lastDailyKey`.

---

## 13. Daily Login Reward  (PRD §18) — modal over Home

- **Purpose.** Reward returning players on the first open of a new day.
- **Layout.** Modal over Home. A row of 7 day-tiles showing the cycle (50c, 100c,
  150c, Hint, 250c, Theme Fragment, Premium Chest). Today's tile highlighted +
  "Claim" button. Past tiles checked, future tiles dimmed.
- **Components.** `LoginCycleStrip`, `DayTile`, `Button`, reward burst on claim.
- **Data.** `claimLoginReward(input, todayKey)` → `{claimable, reward, cycleDay}`.
- **Interactions.** Claim → grant reward (coins/hint/fragment/chest), animate,
  persist, close. Already claimed → not shown.
- **States.** claimable / already-claimed-today (skip) / cycle wrap (day 7 →
  back to day 1).
- **Navigation.** Closes to Home.
- **Wiring.** `@shikaku/rewards` `claimLoginReward` + `LOGIN_CYCLE`; writes
  `streak.lastLoginRewardKey`, `streak.loginCycleDay`, and `profile.coins` etc.

---

## 14. Cross-cutting overlays & systems

- **Achievement toast.** Slide-in chip (top) when `newlyUnlocked()` returns
  items after a solve; tap → Achievements. Celebration haptic + sound (PRD §7/§8).
- **Rewarded-ad sheet (PRD §22).** Reused by Hint-when-empty, Double-coins, and
  Theme-fragment. Bottom sheet: reward preview + Watch / Cancel. Never interrupts
  active gameplay.
- **Interstitial ad (PRD §22).** Shown between levels every 4 completions — i.e.
  on Victory → Next transition, never during the board.
- **Banner ad (PRD §22).** Home screen only; never on Game.
- **Toasts / confirms.** Generic `Toast` (info) and `ConfirmDialog` (destructive:
  Restart, Exit, Reset progress).
- **Offline indicator.** Tiny chip if a network-only action (ad/backup) is
  attempted offline; gameplay itself never blocks (PRD §4).

---

## Per-screen build checklist (for the rewrite pass)

| # | Screen            | Web route            | Mobile screen | Status (current) |
|---|-------------------|----------------------|---------------|------------------|
| 1 | Splash            | (in layout/loader)   | App boot      | ❌ to build       |
| 2 | Home              | `/`                  | `Home`        | ✅ basic          |
| 3 | Difficulty Select | `/play`              | inline list   | ✅ basic          |
| 4 | Level Select      | `/play/[difficulty]` | —             | ❌ to build       |
| 5 | Game              | `/game?mode=`        | `Game`        | ✅ playable       |
| 6 | Pause             | overlay              | overlay       | ❌ to build       |
| 7 | Victory           | overlay (in Game)    | overlay       | ✅ basic          |
| 8 | Theme Store       | `/themes`            | —             | ✅ web only       |
| 9 | Achievements      | `/achievements`      | —             | ❌ to build       |
| 10| Statistics        | `/stats`             | —             | ✅ web only       |
| 11| Settings          | `/settings`          | —             | ❌ to build       |
| 12| Daily Challenge   | `/game?mode=daily`   | `Game` daily  | ✅ playable       |
| 13| Daily Login       | modal over `/`       | modal         | ❌ to build       |

Legend: ✅ exists · ❌ not yet. The rewrite (post-Figma) brings every screen to
the DESIGN.md system and fills the ❌ gaps.
```
