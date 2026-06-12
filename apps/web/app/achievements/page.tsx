'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useProfile } from '../providers';
import { BottomNav, Icon } from '../../components/ui';
import { evaluate, type AchievementCategory, type PlayerMetrics } from '@shikaku/achievements';

const CATS: Array<{ id: AchievementCategory; label: string }> = [
  { id: 'progress', label: 'Progress' },
  { id: 'skill', label: 'Skill' },
  { id: 'streak', label: 'Streak' },
];

export default function AchievementsPage() {
  const { profile } = useProfile();
  const [cat, setCat] = useState<AchievementCategory>('progress');

  const metrics: PlayerMetrics = useMemo(
    () => ({
      puzzlesSolved: profile.stats.puzzlesSolved,
      perfectSolves: profile.stats.perfectSolves,
      noHintSolves: 0,
      fastSolves: 0,
      longestStreak: profile.streak.longest,
    }),
    [profile.stats, profile.streak.longest],
  );

  const all = evaluate(metrics);
  const list = all.filter((p) => p.achievement.category === cat);
  const unlocked = all.filter((p) => p.unlocked).length;

  return (
    <>
      <main className="app">
        <header className="topbar">
          <Link href="/" className="icon-btn">
            <Icon name="undo" />
          </Link>
          <span className="spacer" />
          <span className="pill">
            <Icon name="awards" size={14} /> <span className="num">{unlocked}/{all.length}</span>
          </span>
        </header>

        <h1 className="screen-title">ACHIEVEMENTS</h1>
        <p className="screen-sub">{unlocked} of {all.length} medals earned</p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {CATS.map((c) => (
            <button
              key={c.id}
              className={'pill' + (cat === c.id ? '' : ' ghost')}
              style={cat === c.id ? { background: 'var(--accent-grad)', color: 'var(--on-accent)', borderColor: 'transparent' } : {}}
              onClick={() => setCat(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="menu">
          {list.map((p) => (
            <div key={p.achievement.id} className="card row" style={{ opacity: p.unlocked ? 1 : 0.85 }}>
              <span
                className="lead"
                style={{
                  background: p.unlocked ? 'var(--gold-soft)' : 'var(--surface-3)',
                  color: p.unlocked ? 'var(--gold)' : 'var(--text-muted)',
                }}
              >
                {p.unlocked ? <Icon name="check" /> : <Icon name="awards" />}
              </span>
              <div className="grow">
                <div className="title">{p.achievement.title}</div>
                <div className="sub">{p.achievement.description}</div>
                {!p.unlocked && (
                  <div className="bar" style={{ marginTop: 8, height: 6 }}>
                    <i style={{ width: `${Math.round(p.ratio * 100)}%` }} />
                  </div>
                )}
              </div>
              {!p.unlocked && (
                <div className="sub num" style={{ flex: 'none' }}>
                  {p.current}/{p.achievement.threshold}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
      <BottomNav />
    </>
  );
}
