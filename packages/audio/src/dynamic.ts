/**
 * Dynamic music (PRD §8): the soundtrack intensifies as the puzzle nears
 * completion.
 *
 *   0%  completion → Calm
 *   50% completion → More energy
 *   90% completion → Anticipation layer
 *   100% completion → Victory theme
 */

export type MusicStage = 'calm' | 'energy' | 'anticipation' | 'victory';

export const MUSIC_THEMES = [
  'lofi-focus',
  'relaxing-piano',
  'forest-ambient',
  'ocean-ambient',
  'galaxy-synth',
] as const;

export type MusicTheme = (typeof MUSIC_THEMES)[number];

/** Map a completion fraction (0..1) to a music stage. */
export function musicStage(completion: number): MusicStage {
  if (completion >= 1) return 'victory';
  if (completion >= 0.9) return 'anticipation';
  if (completion >= 0.5) return 'energy';
  return 'calm';
}

/** How many music layers are active at a given stage (drives the backend). */
export function activeLayers(stage: MusicStage): number {
  switch (stage) {
    case 'calm':
      return 1;
    case 'energy':
      return 2;
    case 'anticipation':
      return 3;
    case 'victory':
      return 4;
  }
}
