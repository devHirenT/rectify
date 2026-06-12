'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProfile } from '../providers';
import { BottomNav, Icon, ProgressRing, Stars } from '../../components/ui';
import { formatTime } from '../../components/ui';
import { LEVELS_PER_BAND } from '../../lib/levels';
import type { Difficulty } from '@shikaku/game-engine';

interface Band {
  id: Difficulty;
  label: string;
  size: string;
  unlockLevel: number;
}

const BANDS: Band[] = [
  { id: 'easy', label: 'Easy', size: '6×6 → 7×7', unlockLevel: 1 },
  { id: 'medium', label: 'Medium', size: '8×8 → 9×9', unlockLevel: 1 },
  { id: 'hard', label: 'Hard', size: '10×10 → 12×12', unlockLevel: 1 },
  { id: 'expert', label: 'Expert', size: '14×14 → 16×16', unlockLevel: 15 },
  { id: 'master', label: 'Master', size: '20×20+', unlockLevel: 25 },
];

export default function PlayMenu() {
  const { profile } = useProfile();
  const router = useRouter();

  function bandSummary(id: Difficulty) {
    const done = profile.completedLevels[id]?.length ?? 0;
    const pct = Math.round((done / LEVELS_PER_BAND) * 100);
    const ids = profile.completedLevels[id] ?? [];
    const starsList = ids.map((lid) => profile.starsByLevel[lid] ?? 0);
    const avgStars = starsList.length ? Math.round(starsList.reduce((a, b) => a + b, 0) / starsList.length) : 0;
    const times = ids.map((lid) => profile.bestTimeByLevel[lid]).filter((t): t is number => t != null);
    const best = times.length ? Math.min(...times) : null;
    return { done, pct, avgStars, best };
  }

  return (
    <>
      <main className="app">
        <header className="topbar">
          <Link href="/" className="icon-btn">
            <Icon name="undo" />
          </Link>
          <span className="spacer" />
          <span className="pill">
            <span className="coin">●</span> <span className="num">{profile.coins}</span>
          </span>
        </header>

        <h1 className="screen-title">CHOOSE DIFFICULTY</h1>
        <p className="screen-sub">Refine your logic, conquer the grid.</p>

        <div className="menu">
          {BANDS.map((b) => {
            const s = bandSummary(b.id);
            const locked = profile.level < b.unlockLevel;
            const complete = s.pct >= 100;
            return (
              <button
                key={b.id}
                className="card tap row"
                style={{ opacity: locked ? 0.5 : 1 }}
                disabled={locked}
                onClick={() => !locked && router.push(`/play/${b.id}`)}
              >
                {locked ? (
                  <span className="lead">
                    <Icon name="lock" />
                  </span>
                ) : (
                  <ProgressRing value={s.pct / 100} size={46}>
                    {complete ? <Icon name="check" size={20} /> : `${s.pct}%`}
                  </ProgressRing>
                )}
                <div className="grow">
                  <div className="title">{b.label}</div>
                  <div className="sub">{b.size}</div>
                  <div className="sub" style={{ color: complete ? 'var(--gold)' : 'var(--accent)', marginTop: 2 }}>
                    {locked ? `Reach Level ${b.unlockLevel}` : complete ? '100% Complete' : s.done > 0 ? 'In Progress' : 'Not Started'}
                  </div>
                </div>
                {!locked && (
                  <div style={{ textAlign: 'right' }}>
                    <Stars value={s.avgStars} />
                    <div className="sub num" style={{ marginTop: 4 }}>
                      {s.best != null ? `Best ${formatTime(s.best)}` : '—'}
                    </div>
                  </div>
                )}
              </button>
            );
          })}

          <Link href="/game?mode=infinite" className="card tap row" style={{ borderColor: 'var(--accent)' }}>
            <span className="lead" style={{ color: 'var(--accent)' }}>
              <Icon name="infinity" />
            </span>
            <div className="grow">
              <div className="title">
                Infinite <span className="badge">New</span>
              </div>
              <div className="sub">Procedural Grid · Endless Challenge</div>
            </div>
            <Icon name="play" className="chev" />
          </Link>
        </div>
      </main>
      <BottomNav />
    </>
  );
}
