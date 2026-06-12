# Shikaku Master — Design System (Dark Mode)

> Single source of truth for the **dark** theme. Premium, calm, tactile — a
> "focus game" feel, not a flashy arcade one. When the Figma arrives, map its
> values onto the tokens below; component code should only ever read tokens,
> never hard-coded hex.
>
> Status: **proposed v1** — adjust token values to match Figma, keep the
> structure.

---

## 1. Design principles

1. **Depth over flatness.** Layered surfaces (bg → surface → raised) with soft
   shadows and 1px hairline borders. Nothing sits flat on the background.
2. **One accent, used sparingly.** A single vivid accent for the primary action
   and active state. Everything else is neutral. Accent = signal, not decoration.
3. **Calm motion.** Slow, eased, spring-like. Motion confirms an action; it
   never demands attention. Respect `prefers-reduced-motion`.
4. **Tactile surfaces.** Buttons and cards feel pressable: subtle gradient,
   inner highlight on top edge, press-down scale.
5. **The board is the hero.** Maximum contrast and clarity on the grid; chrome
   recedes around it.

---

## 2. Color tokens (dark)

Neutrals are slightly **blue-cool** (not pure gray) for a premium screen feel.

```css
:root[data-theme="dark"] {
  /* ---- Background layers (back → front) ---- */
  --bg-base:        #0a0d14;   /* app background, deepest */
  --bg-gradient:    radial-gradient(120% 120% at 50% 0%, #141a28 0%, #0a0d14 60%);
  --surface-1:      #12161f;   /* cards, panels */
  --surface-2:      #181d29;   /* raised cards, modals */
  --surface-3:      #ffffff14; /* hover/active wash (white at ~8%) */

  /* ---- Hairlines & dividers ---- */
  --border:         #232b3a;   /* default 1px border */
  --border-strong:  #2f3a4f;   /* emphasized border / focus ring base */

  /* ---- Text ---- */
  --text-hi:        #eef2fb;   /* headings, primary */
  --text:           #c4ccdd;   /* body */
  --text-muted:     #7b859b;   /* captions, secondary */
  --text-faint:     #4d5670;   /* disabled, ambient shapes */

  /* ---- Accent (primary action / active) ---- */
  --accent:         #5b8cff;   /* indigo-blue */
  --accent-hover:   #6f9bff;
  --accent-press:   #4a78e6;
  --accent-soft:    #5b8cff1f; /* 12% tint for fills/glows */
  --accent-text:    #ffffff;   /* text on accent */

  /* ---- Secondary accent (rewards, XP) ---- */
  --gold:           #ffcf4d;
  --gold-soft:      #ffcf4d1f;

  /* ---- Semantic ---- */
  --good:           #2fd6a0;   /* correct rectangle */
  --good-soft:      #2fd6a024;
  --bad:            #ff6b81;   /* wrong / mistake */
  --bad-soft:       #ff6b8124;
  --warn:           #ffb454;

  /* ---- Board-specific ---- */
  --grid-line:      #222b3c;   /* faint grid */
  --grid-line-edge: #313c52;   /* outer board frame */
  --cell:           #0e131d;   /* empty cell fill */
  --clue-bg:        #1c2433;   /* clue chip background */
  --clue-text:      #eef2fb;
}
```

### Accent usage rule
- Primary button, active nav item, selected difficulty, focus ring → `--accent`.
- Never use accent for large fills. Max ~10% of any screen is accent.
- Rewards/coins/XP use `--gold`; correctness uses `--good`/`--bad` only on the board.

---

## 3. Typography

Rounded geometric sans for warmth (matches "relaxing/premium"). Numbers are the
star (clues, coins, timers) → use **tabular**, heavy weights.

```css
--font-display: "Clash Display", "SF Pro Rounded", ui-rounded, system-ui, sans-serif;
--font-ui:      "Inter", "SF Pro Text", system-ui, -apple-system, sans-serif;
--font-num:     "Inter", system-ui;  /* with font-variant-numeric: tabular-nums */
```

| Token            | Size / Line     | Weight | Use                              |
|------------------|-----------------|--------|----------------------------------|
| `--t-hero`       | 34 / 40         | 800    | Logo / screen title              |
| `--t-h1`         | 24 / 30         | 700    | Section headers                  |
| `--t-h2`         | 18 / 24         | 700    | Card titles                      |
| `--t-body`       | 15 / 22         | 500    | Body                             |
| `--t-caption`    | 13 / 18         | 500    | Sub-labels, muted                |
| `--t-num-lg`     | 28 / 30         | 800    | Reward values, timer             |
| `--t-clue`       | 0.42 × cell     | 800    | Clue numbers (scales with grid)  |

Letter-spacing: hero/titles `+0.02em`, all-caps labels `+0.08em`, numbers `0`.

---

## 4. Spacing, radius, elevation

**Spacing scale (4px base):** `4, 8, 12, 16, 20, 24, 32, 40, 56`
→ tokens `--sp-1 … --sp-9`.

**Radius:**
```css
--r-sm: 10px;   /* chips, pills inner */
--r-md: 16px;   /* buttons, cells */
--r-lg: 22px;   /* cards */
--r-xl: 28px;   /* modals, board frame */
--r-full: 999px;
```

**Elevation (dark needs glow + shadow, not just shadow):**
```css
--e-1: 0 1px 0 0 #ffffff08 inset, 0 2px 8px #00000059;   /* cards */
--e-2: 0 1px 0 0 #ffffff0f inset, 0 12px 30px #00000080; /* raised / hover */
--e-3: 0 1px 0 0 #ffffff14 inset, 0 24px 60px #000000a6; /* modal */
--glow-accent: 0 0 0 1px var(--accent), 0 8px 24px #5b8cff44;
```
The `inset` top-highlight (`#ffffffXX`) is what makes surfaces feel raised in
dark mode — keep it on every card/button.

---

## 5. Component specs

### Surface / Card
- Background `--surface-1`, border `1px var(--border)`, radius `--r-lg`,
  shadow `--e-1`, padding `--sp-5`.
- Hover (interactive cards): lift `translateY(-2px)`, shadow `--e-2`,
  border `--border-strong`. Transition `180ms cubic-bezier(.2,.8,.2,1)`.
- Optional top accent strip for "featured" cards: 3px bar in `--accent` at top.

### Button
```
Primary:   bg linear-gradient(180deg, --accent-hover, --accent);
           text --accent-text; shadow --e-1 + soft accent glow;
           radius --r-md; height 52; weight 700; letter-spacing +0.02em.
Secondary: bg --surface-2; border 1px --border; text --text-hi.
Ghost:     transparent; text --text; hover bg --surface-3 (8% white).
Press:     scale(.97); brightness(.95).  Disabled: opacity .4, no shadow.
```
Icon + label gap `--sp-2`. Min touch target 48×48 (accessibility).

### Pill / Stat chip (coins, level, timer, streak)
- `--surface-2`, border `1px --border`, radius `--r-full`, padding `8px 14px`.
- Icon (16px) + tabular number. Coins icon tinted `--gold`, streak `--bad`/flame.

### Difficulty card
- Left: label (`--t-h2`) + size sub (`--t-caption --text-muted`).
- Right: progress ring (stroke `--accent`, track `--border`) + best-time + stars.
- Locked state: 40% opacity, lock glyph, `--surface-1` with no hover lift.

### Modal / Victory
- Backdrop: `#05070caa` + `backdrop-filter: blur(8px)`.
- Panel `--surface-2`, radius `--r-xl`, shadow `--e-3`, padding `--sp-7`.
- Entrance: scale `.9→1` + fade, `260ms` spring. Confetti respects reduced-motion.
- Stars animate in sequentially (stagger 120ms, pop scale `0→1.15→1`).

### Top bar
- Transparent over `--bg-gradient`; chips floated. No hard divider — let the
  radial gradient separate it from content.

---

## 6. The board (most important surface)

```
Frame:        --surface-1, border 2px --grid-line-edge, radius --r-xl,
              shadow --e-2, inner padding 0 (cells flush to frame).
Empty cell:   --cell. Grid lines: 1px --grid-line.
Clue chip:    circle, --clue-bg, 1px --border-strong, text --clue-text,
              size 0.64×cell, number --t-clue. Subtle --e-1 so clues feel
              "placed on" the board.
```

**Rectangle states (drawn by player):**
| State            | Fill                | Border           | Notes                         |
|------------------|---------------------|------------------|-------------------------------|
| In-progress drag | `--accent-soft`     | 2.5px dashed `--accent` | live, animated dash offset |
| Valid (1 clue, area matches) | `--good-soft` | 2.5px solid `--good` | brief glow pulse on commit |
| Invalid          | `--bad-soft`        | 2.5px solid `--bad` | gentle shake (reduced-motion: none) |
| Locked (solved)  | `--good-soft`       | 2px `--good`     | desaturate chrome around it   |

**Live area counter** (during drag): floating chip above the rect.
`--surface-2`, border colored by validity (`--accent` neutral / `--good` match /
`--bad` over), tabular numbers: `Need 12 · Have 10`.

**Completion sweep:** on solve, a soft light sweep crosses the board (skip if
reduced-motion), then the victory modal.

---

## 7. Motion

```css
--ease-out:   cubic-bezier(.2, .8, .2, 1);
--ease-in-out:cubic-bezier(.4, 0, .2, 1);
--ease-spring:cubic-bezier(.34, 1.56, .64, 1);  /* overshoot for pops */
--dur-fast: 120ms;   --dur: 200ms;   --dur-slow: 360ms;
```
- Hover/press: `--dur-fast`. Card lift / page transition: `--dur`.
- Modal / reward pop: `--dur-slow` with `--ease-spring`.
- Ambient: floating background rectangles drift 20–40s linear, very low opacity
  (`--text-faint` at ~6%). Pause under reduced-motion.

---

## 8. Iconography & texture
- Line icons, 1.75px stroke, rounded caps. 20px default.
- Subtle noise/grain overlay on `--bg-base` (1–2% opacity) to avoid banding on
  the gradient — optional, premium touch.
- Coins = filled gold disc; stars = filled; streak = flame.

---

## 9. Accessibility (carry from PRD §20)
- Contrast: body text ≥ 4.5:1 on its surface; large text ≥ 3:1. Verify `--text`
  on `--surface-1`.
- **High-contrast mode:** swap `--text`→`--text-hi`, borders→`--border-strong`,
  thicken board lines to 1.5px.
- **Colorblind:** never rely on red/green alone — valid rects also show a ✓
  glyph, invalid show ✕. Add to clue chips if needed.
- **Reduced motion:** disable shake, sweep, confetti, ambient drift; keep
  opacity fades only.
- **Large text:** scale `--t-*` by 1.15; board chrome unaffected.
- Focus ring: `--glow-accent`, never removed.

---

## 10. Token → CSS variable mapping (implementation note)

When rewriting CSS:
1. Put all section-2 colors + section-4 radius/elevation as CSS custom
   properties on `:root[data-theme="dark"]`.
2. The 9 named themes (PRD §19) each override only the **color** tokens; radius,
   spacing, typography, motion stay global.
3. Components reference `var(--token)` exclusively. A grep for `#` in component
   files should return ~nothing.
4. Web: variables on `<html>`; toggle theme via `data-theme`. Mobile: same
   token names exported from `theme.ts` as a typed object.

---

## 11. Open questions for the Figma
- Exact accent hue (indigo vs teal vs violet)?
- Glassmorphism on cards (blur + translucency) — yes/no? affects performance.
- Board cell style: flat fill vs subtle inner gradient per cell?
- Logo treatment (wordmark vs icon lockup)?
- Reward animation intensity (confetti vs subtle particles)?

> Drop the Figma and I'll lock these values, then rewrite `globals.css`,
> `lib/themes.ts`, and the mobile `theme.ts` against this token set.
```
