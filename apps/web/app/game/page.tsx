'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { GameScreen } from '../../components/GameScreen';
import type { Difficulty } from '@shikaku/game-engine';

const VALID = new Set<string>(['easy', 'medium', 'hard', 'expert', 'master', 'infinite', 'daily']);

function GameInner() {
  const params = useSearchParams();
  const raw = params.get('mode') ?? 'easy';
  const mode = (VALID.has(raw) ? raw : 'easy') as Difficulty | 'daily';
  const levelRaw = params.get('level');
  const level = levelRaw != null ? Math.max(1, parseInt(levelRaw, 10) || 1) : undefined;
  const resume = params.get('resume') === '1';
  return <GameScreen mode={mode} level={level} resume={resume} />;
}

export default function GamePage() {
  return (
    <Suspense fallback={<main className="app">Loading…</main>}>
      <GameInner />
    </Suspense>
  );
}
