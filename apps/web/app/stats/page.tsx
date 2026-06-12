'use client';

import Link from 'next/link';
import { useProfile } from '../providers';
import { BottomNav, Icon, ProgressRing, formatTime } from '../../components/ui';
import { levelFromXp } from '@shikaku/rewards';

export default function StatsPage() {
  const { profile } = useProfile();
  const s = profile.stats;
  const lvl = levelFromXp(profile.xp);
  const avg = s.puzzlesSolved > 0 ? Math.round(s.totalTimeSeconds / s.puzzlesSolved) : 0;

  const rows: Array<[string, string]> = [
    ['Puzzles Solved', String(s.puzzlesSolved)],
    ['Perfect Solves', String(s.perfectSolves)],
    ['Hints Used', String(s.hintsUsed)],
    ['Average Time', s.puzzlesSolved ? formatTime(avg) : '—'],
    ['Best Time', s.bestTimeSeconds == null ? '—' : formatTime(s.bestTimeSeconds)],
    ['Current Streak', `${profile.streak.current} days`],
    ['Longest Streak', `${profile.streak.longest} days`],
  ];

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

        <h1 className="screen-title">STATISTICS</h1>
        <p className="screen-sub">Track your growth</p>

        <div className="card row">
          <ProgressRing value={lvl.xpForNext ? lvl.xpIntoLevel / lvl.xpForNext : 0} size={54}>
            {lvl.level}
          </ProgressRing>
          <div className="grow">
            <div className="title">Level {lvl.level}</div>
            <div className="sub num">{lvl.xpIntoLevel} / {lvl.xpForNext} XP to next</div>
          </div>
        </div>

        {s.puzzlesSolved === 0 ? (
          <div className="card" style={{ textAlign: 'center', marginTop: 14 }}>
            <p className="sub">Solve your first puzzle to start your stats!</p>
          </div>
        ) : (
          <div className="menu">
            {rows.map(([k, v]) => (
              <div key={k} className="card row" style={{ padding: '14px 16px' }}>
                <div className="grow title" style={{ fontWeight: 500 }}>{k}</div>
                <div className="num" style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '1.1rem' }}>{v}</div>
              </div>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </>
  );
}
