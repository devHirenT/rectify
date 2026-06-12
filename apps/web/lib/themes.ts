/**
 * Theme palettes (PRD §19). Values map to the design tokens defined in
 * globals.css. The default look matches the Figma dark design; alternate themes
 * override color tokens only — radii, shadows, type and motion stay global.
 *
 * A theme supplies a subset of color vars; anything omitted falls back to the
 * :root defaults in globals.css.
 */
export interface Theme {
  id: string;
  name: string;
  free: boolean;
  vars: Record<string, string>;
}

/** Shared dark base (the Figma palette) reused by the default themes. */
const FIGMA_DARK: Record<string, string> = {
  '--bg-base': '#0a0d14',
  '--bg-grad': 'radial-gradient(135% 105% at 50% -10%, #1d2a4a 0%, #0c0e15 55%)',
  '--surface-1': '#11131a',
  '--surface-2': '#191b22',
  '--surface-3': '#1d1f26',
  '--surface-4': '#282a31',
  '--surface-grad': 'linear-gradient(180deg, #181d29 0%, #12161f 100%)',
  '--border': '#282a31',
  '--border-strong': '#434653',
  '--text-hi': '#e1e2ec',
  '--text': '#c3c6d6',
  '--text-muted': '#8d909f',
  '--accent': '#b2c5ff',
  '--accent-deep': '#5b8cff',
  '--accent-grad': 'linear-gradient(180deg, #b2c5ff 0%, #5b8cff 100%)',
  '--on-accent': '#002665',
  '--accent-soft': 'rgba(178,197,255,0.10)',
  '--accent-ring': '#5b8cff',
  '--cell': '#0c0e15',
  '--grid-line': '#282a31',
  '--grid-line-edge': '#434653',
  '--clue-text': '#e1e2ec',
};

/** Helper: build a theme by overriding accent + a few surfaces on the dark base. */
function variant(
  id: string,
  name: string,
  over: Record<string, string>,
  free = false,
): Theme {
  return { id, name, free, vars: { ...FIGMA_DARK, ...over } };
}

export const THEMES: Theme[] = [
  variant('classic', 'Classic', {}, true),
  variant(
    'dark-pro',
    'Dark Pro',
    {
      '--bg-grad': 'radial-gradient(135% 105% at 50% -10%, #161b27 0%, #0a0d14 55%)',
      '--accent': '#7aa2ff',
      '--accent-grad': 'linear-gradient(180deg, #7aa2ff 0%, #4a78e6 100%)',
    },
    true,
  ),
  variant('ocean', 'Ocean', {
    '--bg-base': '#06283d',
    '--bg-grad': 'radial-gradient(135% 105% at 50% -10%, #0a4a6e 0%, #05202f 55%)',
    '--surface-1': '#0a3b54',
    '--surface-2': '#0e4a6b',
    '--surface-3': '#0c4259',
    '--surface-4': '#135a7d',
    '--border': '#13567a',
    '--border-strong': '#1d77a0',
    '--accent': '#7ff0ff',
    '--accent-deep': '#33d6ff',
    '--accent-grad': 'linear-gradient(180deg, #7ff0ff 0%, #33d6ff 100%)',
    '--on-accent': '#012b3a',
    '--cell': '#05202f',
    '--grid-line': '#13567a',
    '--grid-line-edge': '#1d77a0',
    '--clue-text': '#eafcff',
    '--text': '#cfeefb',
    '--text-muted': '#7fb8d0',
  }),
  variant('forest', 'Forest', {
    '--bg-base': '#0f2117',
    '--bg-grad': 'radial-gradient(135% 105% at 50% -10%, #1d3a28 0%, #0c1c13 55%)',
    '--surface-1': '#16301f',
    '--surface-2': '#1d3b29',
    '--surface-3': '#1a3624',
    '--surface-4': '#274a33',
    '--border': '#2a4a35',
    '--border-strong': '#3a6047',
    '--accent': '#a6f0b0',
    '--accent-deep': '#5fdc7a',
    '--accent-grad': 'linear-gradient(180deg, #a6f0b0 0%, #5fdc7a 100%)',
    '--on-accent': '#0a2a14',
    '--cell': '#0c1c13',
    '--grid-line': '#2a4a35',
    '--grid-line-edge': '#3a6047',
    '--clue-text': '#f1fbf2',
    '--text': '#d6ecd9',
    '--text-muted': '#8fb89a',
  }),
  variant('cyberpunk', 'Cyberpunk', {
    '--bg-base': '#0b0014',
    '--bg-grad': 'radial-gradient(135% 105% at 50% -10%, #2a004f 0%, #0b0014 55%)',
    '--surface-1': '#1a0a2e',
    '--surface-2': '#220d3a',
    '--surface-3': '#1f0c33',
    '--surface-4': '#311452',
    '--border': '#3a1466',
    '--border-strong': '#5a1f99',
    '--accent': '#ff7ae6',
    '--accent-deep': '#ff2bd6',
    '--accent-grad': 'linear-gradient(180deg, #ff7ae6 0%, #ff2bd6 100%)',
    '--on-accent': '#2a0033',
    '--cell': '#0b0014',
    '--grid-line': '#3a1466',
    '--grid-line-edge': '#5a1f99',
    '--clue-text': '#ffe9fb',
    '--text': '#ecd6f5',
    '--text-muted': '#a87fc0',
  }),
  variant('galaxy', 'Galaxy', {
    '--bg-base': '#080b1f',
    '--bg-grad': 'radial-gradient(135% 105% at 50% -10%, #1b1b4d 0%, #06081a 55%)',
    '--surface-1': '#161a40',
    '--surface-2': '#1c2150',
    '--surface-3': '#191e48',
    '--surface-4': '#272d66',
    '--border': '#2e347a',
    '--accent': '#b69bff',
    '--accent-deep': '#9b6bff',
    '--accent-grad': 'linear-gradient(180deg, #b69bff 0%, #9b6bff 100%)',
    '--on-accent': '#160a33',
  }),
  variant('candy', 'Candy', {
    '--bg-base': '#2a0d1c',
    '--bg-grad': 'radial-gradient(135% 105% at 50% -10%, #5b1f3d 0%, #1f0a16 55%)',
    '--surface-1': '#36132450',
    '--surface-2': '#3d1628',
    '--surface-3': '#341324',
    '--surface-4': '#4a1c33',
    '--border': '#5b2342',
    '--accent': '#ff8fc0',
    '--accent-deep': '#ff5fa2',
    '--accent-grad': 'linear-gradient(180deg, #ff8fc0 0%, #ff5fa2 100%)',
    '--on-accent': '#3a0a22',
    '--clue-text': '#ffe0ec',
  }),
  variant('minimal', 'Minimal', {
    '--bg-base': '#0e0e0f',
    '--bg-grad': 'radial-gradient(135% 105% at 50% -10%, #1a1a1c 0%, #0a0a0b 55%)',
    '--surface-1': '#161618',
    '--surface-2': '#1d1d20',
    '--surface-3': '#1a1a1d',
    '--surface-4': '#262629',
    '--border': '#2a2a2e',
    '--border-strong': '#3a3a3f',
    '--accent': '#e8e8ea',
    '--accent-deep': '#bcbcc0',
    '--accent-grad': 'linear-gradient(180deg, #f2f2f4 0%, #cfcfd2 100%)',
    '--on-accent': '#111113',
    '--clue-text': '#f2f2f4',
  }),
  variant('golden', 'Golden', {
    '--bg-base': '#16110a',
    '--bg-grad': 'radial-gradient(135% 105% at 50% -10%, #2e2408 0%, #120d05 55%)',
    '--surface-1': '#221a0c',
    '--surface-2': '#2c2210',
    '--surface-3': '#261d0d',
    '--surface-4': '#3a2e14',
    '--border': '#4a3a18',
    '--border-strong': '#6b541f',
    '--accent': '#ffdf95',
    '--accent-deep': '#ffcf4d',
    '--accent-grad': 'linear-gradient(180deg, #ffe7a8 0%, #ffcf4d 100%)',
    '--on-accent': '#3a2a00',
    '--clue-text': '#fff7e0',
  }),
];

export const THEME_BY_ID: Record<string, Theme> = Object.fromEntries(
  THEMES.map((t) => [t.id, t]),
);
