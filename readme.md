# SHIKAKU MASTER

## Offline-First Mobile & Web Puzzle Game

### Product Requirements Document (PRD) + Technical Architecture + UX Specification + Monetization Blueprint

Version: 1.0

---

# 1. PROJECT OVERVIEW

Shikaku Master is a premium offline-first logic puzzle game inspired by the Japanese Shikaku puzzle.

The game must provide:

* Beautiful modern UI
* Smooth gestures
* Relaxing audio
* Offline gameplay
* Infinite puzzles
* Daily challenges
* Achievement systems
* Progression systems
* Theme customization
* AdMob monetization
* Cross-platform support

Platforms:

* Android (React Native)
* iOS (React Native)
* Mobile Web (Next.js PWA)
* Desktop Web

Target Rating:
4.5+

Target Session Time:
10–20 Minutes

Target Retention:
D1 > 40%
D7 > 15%

---

# 2. GAME PILLARS

1. Easy To Learn
2. Difficult To Master
3. Relaxing Experience
4. Offline Friendly
5. Long-Term Progression
6. Premium Feel
7. Fair Monetization

---

# 3. TECHNOLOGY STACK

## Monorepo

TurboRepo

Structure:

apps/
├── mobile
├── web

packages/
├── game-engine
├── ui
├── achievements
├── rewards
├── storage
├── audio
├── analytics

---

## Mobile

React Native
Expo
TypeScript

Libraries:

* React Navigation
* Zustand
* React Query
* MMKV
* Reanimated
* Gesture Handler
* Skia
* Expo Haptics
* Expo AV

---

## Web

Next.js
TypeScript
Tailwind CSS
Framer Motion
Howler.js
IndexedDB

---

# 4. OFFLINE-FIRST ARCHITECTURE

Gameplay must work completely offline.

Internet only required for:

* AdMob
* Purchases
* Analytics
* Cloud Backup

No backend required for puzzle solving.

All puzzle generation occurs locally.

---

# 5. SCREENS

## Splash Screen

Logo Animation
Loading Progress
Animated Grid

Duration:
2 Seconds

---

## Home Screen

Continue
Play
Daily Challenge
Achievements
Themes
Statistics
Settings

Animated Background

Floating Rectangles

---

## Difficulty Screen

Easy
Medium
Hard
Expert
Master
Infinite

Each Card:

Completion %
Stars
Best Time

---

## Level Selection

Level Cards

Locked Levels
Unlocked Levels

Progress Indicators

---

## Game Screen

Top Bar:

Coins
XP
Hints
Pause

Center:

Puzzle Grid

Bottom:

Undo
Retry
Hint
Zoom

---

## Pause Screen

Resume
Restart
Settings
Exit

---

## Victory Screen

Confetti
Stars
Rewards
Statistics

Buttons:

Next Level
Replay

---

## Theme Store

Unlock Themes

Preview Themes

---

## Achievement Screen

Progress
Skill
Collection
Streak

---

## Statistics Screen

Puzzles Solved
Average Time
Best Time
Perfect Solves
Hints Used
Streaks

---

# 6. GESTURE SYSTEM

Single Tap

Select Cell

Double Tap

Focus Number

Long Press

Lock Rectangle

Drag

Create Rectangle

Pinch

Zoom Board

Pan

Move Board

Double Two-Finger Tap

Reset Zoom

---

## Smart Snap

Rectangle automatically snaps to nearest valid rectangle dimensions.

---

## Rectangle Preview

Live Preview

Area Counter

Need: 12
Current: 10

Displayed During Drag

---

# 7. HAPTICS

Correct Placement

Light Tap

Wrong Placement

Double Tap Vibration

Hint Used

Soft Pulse

Puzzle Complete

Success Pattern

Achievement Unlock

Celebration Pattern

---

# 8. AUDIO SYSTEM

## Categories

Music
Effects
UI
Ambient

Independent Volume Controls

---

## Music Themes

LoFi Focus
Relaxing Piano
Forest Ambient
Ocean Ambient
Galaxy Synth

---

## Dynamic Music

0% Completion
Calm

50% Completion
More Energy

90% Completion
Anticipation Layer

100% Completion
Victory Theme

---

## Sound Effects

Cell Select
Rectangle Drag
Correct Placement
Wrong Placement
Undo
Retry
Hint
Coin Reward
XP Reward
Achievement
Puzzle Complete

---

# 9. PUZZLE ENGINE

Steps:

1. Generate Rectangle Solution
2. Place Clue Numbers
3. Remove Redundant Clues
4. Validate Unique Solution
5. Score Difficulty

Guarantees:

* Solvable
* Unique Solution
* Difficulty Rated

---

# 10. DIFFICULTY SYSTEM

Easy
4x4
5x5

Medium
6x6
7x7

Hard
8x8
9x9

Expert
10x10
11x11

Master
12x12+

Infinite
Unlimited Generated Levels

---

# 11. GAME MODES

Classic

Relaxed

Challenge

Daily Challenge

Infinite Mode

---

# 12. REWARD SYSTEM

Coins
XP
Stars
Achievements

---

## Puzzle Completion

20 Coins

---

## Perfect Solve

50 Coins

---

## No Hint Bonus

30 Coins

---

## Daily Challenge

100 Coins

---

# 13. STAR SYSTEM

3 Stars

No Mistakes
No Hints
Fast Solve

2 Stars

Minor Mistakes

1 Star

Many Mistakes

---

# 14. XP SYSTEM

Level Progression

Level 1
0 XP

Level 2
100 XP

Level 3
250 XP

Level 4
500 XP

Rewards:

Themes
Titles
Badges

---

# 15. ACHIEVEMENTS

First Puzzle

10 Puzzles

50 Puzzles

100 Puzzles

500 Puzzles

1000 Puzzles

Perfect Solve

100 Perfect Solves

No Hint Master

Speed Runner

7 Day Streak

30 Day Streak

100 Day Streak

---

# 16. DAILY CHALLENGE

Generated Using Date Seed

Example:

2026-06-12

All Players Receive Same Puzzle

Works Offline

---

# 17. STREAK SYSTEM

Day 1

x1 Reward

Day 7

x2 Reward

Day 30

x5 Reward

---

# 18. DAILY LOGIN REWARDS

Day 1
50 Coins

Day 2
100 Coins

Day 3
150 Coins

Day 4
Hint

Day 5
250 Coins

Day 6
Theme Fragment

Day 7
Premium Chest

---

# 19. THEME SYSTEM

Classic

Dark Pro

Ocean

Forest

Cyberpunk

Galaxy

Candy

Minimal

Golden

---

# 20. ACCESSIBILITY

Colorblind Mode

High Contrast

Large Text

Reduced Motion

Left-Hand Mode

Haptic Toggle

Audio Toggle

---

# 21. LOCAL STORAGE

React Native:

MMKV

Stores:

Progress
Coins
XP
Themes
Achievements
Settings

---

Web:

IndexedDB

Stores:

Progress
Themes
Statistics
Settings

---

# 22. ADMOB STRATEGY

Rewarded Ads

Double Coins

Extra Hint

Extra Reward

Theme Fragment

---

Interstitial Ads

Every 4 Completed Levels

Never During Gameplay

---

Banner Ads

Home Screen Only

Never On Puzzle Screen

---

# 23. PERFORMANCE TARGETS

60 FPS

<2s Launch

<100ms Input Response

Smooth Zoom

Instant Undo

Offline Loading

---

# 24. ANALYTICS EVENTS

app_open

puzzle_start

puzzle_complete

hint_used

achievement_unlock

theme_unlock

reward_claimed

ad_watched

session_end

---

# 25. FUTURE FEATURES

Cloud Sync

Leaderboards

Puzzle Sharing

Multiplayer Challenges

Custom Puzzle Creator

Seasonal Events

Guilds

---

# 26. MVP V1

Must Have:

✔ Offline Puzzle Generator
✔ React Native App
✔ Next.js PWA
✔ Shared Game Engine
✔ Gestures
✔ Haptics
✔ Audio System
✔ Themes
✔ Coins
✔ XP
✔ Achievements
✔ Daily Challenge
✔ Statistics
✔ AdMob
✔ Local Storage
✔ Accessibility

---

# 27. SUCCESS METRICS

4.5+ Play Store Rating

100k Downloads

10+ Minute Average Session

40% D1 Retention

15% D7 Retention

AdMob Revenue Positive

---

END OF DOCUMENT
