/** Native theme palettes mirroring the web themes (PRD §19). */
export interface NativeTheme {
  id: string;
  name: string;
  free: boolean;
  bg: string;
  surface: string;
  text: string;
  muted: string;
  gridLine: string;
  cell: string;
  accent: string;
  good: string;
  bad: string;
  clue: string;
}

export const THEMES: NativeTheme[] = [
  {
    // Default look — matches the Figma dark design (web globals.css tokens).
    id: 'classic',
    name: 'Classic',
    free: true,
    bg: '#0a0d14',
    surface: '#11131a',
    text: '#c3c6d6',
    muted: '#8d909f',
    gridLine: '#282a31',
    cell: '#0c0e15',
    accent: '#b2c5ff',
    good: '#4caf50',
    bad: '#ffb4ab',
    clue: '#e1e2ec',
  },
  {
    id: 'dark-pro',
    name: 'Dark Pro',
    free: true,
    bg: '#0a0d14',
    surface: '#191b22',
    text: '#e1e2ec',
    muted: '#8d909f',
    gridLine: '#2c3548',
    cell: '#0c0e15',
    accent: '#7aa2ff',
    good: '#4caf50',
    bad: '#ffb4ab',
    clue: '#ffffff',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    free: false,
    bg: '#06283d',
    surface: '#0c4a6e',
    text: '#e0f7ff',
    muted: '#7fc6e0',
    gridLine: '#16688f',
    cell: '#0e5277',
    accent: '#33d6ff',
    good: '#2ef2c0',
    bad: '#ff7a8a',
    clue: '#eafcff',
  },
];

export const THEME_BY_ID: Record<string, NativeTheme> = Object.fromEntries(
  THEMES.map((t) => [t.id, t]),
);
