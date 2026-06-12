'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProfile } from '../../providers';
import { BottomNav, Icon, Stars } from '../../../components/ui';
import { LEVELS_PER_BAND } from '../../../lib/levels';

const TITLES: Record<string, string> = {
  easy: 'EASY',
  medium: 'MEDIUM',
  hard: 'HARD',
  expert: 'EXPERT',
  master: 'MASTER',
};

export default function LevelSelect({ params }: { params: { difficulty: string } }) {
  const { difficulty } = params;
  const { profile } = useProfile();
  const router = useRouter();

  // Levels are a linear sequence, so progression is count-based: completing N
  // levels marks 1..N as done and unlocks level N+1. This is robust regardless
  // of how individual completions were keyed.
  const doneCount = profile.completedLevels[difficulty]?.length ?? 0;
  const isCompleted = (n: number) => n <= doneCount;
  const isUnlocked = (n: number) => n <= doneCount + 1;

  return (
    <>
      <main className="app">
        <header className="topbar">
          <Link href="/play" className="icon-btn">
            <Icon name="undo" />
          </Link>
          <div className="grow" style={{ marginLeft: 4 }}>
            <div className="title" style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>
              {TITLES[difficulty] ?? difficulty}
            </div>
            <div className="sub" style={{ letterSpacing: '0.16em', textTransform: 'uppercase', fontSize: '0.66rem' }}>
              Sequence 01
            </div>
          </div>
          <span className="pill">
            <span className="coin">●</span> <span className="num">{profile.coins}</span>
          </span>
        </header>

        <div style={{ margin: '14px 2px 6px' }}>
          <div className="bar">
            <i style={{ width: `${(doneCount / LEVELS_PER_BAND) * 100}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span className="sub num">
              {doneCount} / {LEVELS_PER_BAND} Completed
            </span>
            <span className="sub">Rank {romanRank(doneCount)}</span>
          </div>
        </div>

        <div className="level-grid">
          {Array.from({ length: LEVELS_PER_BAND }, (_, i) => {
            const n = i + 1;
            const id = `${difficulty}-${n}`;
            const completed = isCompleted(n);
            const unlocked = isUnlocked(n);
            const stars = profile.starsByLevel[id] ?? 0;
            const current = unlocked && !completed;
            return (
              <button
                key={n}
                className={
                  'level' +
                  (completed ? ' done' : '') +
                  (current ? ' current' : '') +
                  (!unlocked ? ' locked' : '')
                }
                disabled={!unlocked}
                onClick={() => router.push(`/game?mode=${difficulty}&level=${n}`)}
              >
                <span className="num">{unlocked ? n : <Icon name="lock" size={16} />}</span>
                {stars > 0 && <Stars value={stars} size={9} />}
              </button>
            );
          })}
        </div>
      </main>

      <style>{`
        .level-grid { display:grid; grid-template-columns: repeat(4,1fr); gap:16px; margin-top:18px; }
        .level { position:relative; aspect-ratio:1; border-radius:50%; background:var(--surface-1);
          border:2px solid var(--border-strong); color:var(--text-hi); display:flex; flex-direction:column;
          align-items:center; justify-content:center; gap:3px; font-weight:700; transition:transform var(--dur-fast); }
        .level:active { transform:scale(.94); }
        .level.done { background:var(--good-soft); border-color:var(--good); color:var(--good); }
        .level.locked { background:var(--surface-3); border-color:var(--border); color:var(--text-faint); opacity:.55; }
        .level.current { background:var(--accent-grad); border-color:transparent; color:var(--on-accent);
          box-shadow:var(--glow); }
      `}</style>
      <BottomNav />
    </>
  );
}

function romanRank(done: number): string {
  const r = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  return r[Math.min(r.length - 1, Math.floor(done / 4))]!;
}
