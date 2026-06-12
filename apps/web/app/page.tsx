'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useProfile } from './providers';
import { BottomNav, Icon, ProgressRing } from '../components/ui';
import { dateKey } from '@shikaku/game-engine';
import { claimLoginReward, LOGIN_CYCLE, levelFromXp, type LoginReward } from '@shikaku/rewards';
import { loadSavedGame, type SavedGame } from '@shikaku/storage';

export default function Home() {
  const { profile, ready, update, store } = useProfile();
  const lvl = levelFromXp(profile.xp);
  const today = dateKey(new Date());
  const dailyDone = profile.streak.lastDailyKey === today;

  const [saved, setSaved] = useState<SavedGame | null>(null);
  useEffect(() => {
    void loadSavedGame(store).then(setSaved);
  }, [store]);
  const continueHref = saved
    ? `/game?mode=${saved.mode}${saved.level != null ? `&level=${saved.level}` : ''}&resume=1`
    : null;

  return (
    <>
      <Floaters />
      <main className="app">
        <header className="topbar">
          <span className="icon-btn">
            <Icon name="menu" />
          </span>
          <span className="spacer" />
          <span className="pill">
            <span className="coin">●</span> <span className="num">{profile.coins}</span>
          </span>
          <span className="pill">
            <span className="flame">🔥</span> <span className="num">{profile.streak.current}</span>
          </span>
        </header>

        <div className="brand">
          <h1>SHIKAKU MASTER</h1>
          <div className="tagline">The Art of Logical Geometry</div>
        </div>

        <div className="menu">
          {continueHref && saved && (
            <Link href={continueHref} className="card tap row" style={{ borderColor: 'var(--accent)' }}>
              <span className="lead" style={{ color: 'var(--accent)' }}>
                <Icon name="play" fill />
              </span>
              <div className="grow">
                <div className="title">Continue</div>
                <div className="sub">{saved.label} · {saved.placed.length} placed</div>
              </div>
              <Icon name="play" className="chev" />
            </Link>
          )}

          <section className="featured">
            <span className="glyph">
              <Icon name="grid" size={26} />
            </span>
            <h2>Start Game</h2>
            <p>Classic, Relax, and Master modes</p>
            <Link href="/play" className="btn primary">
              PLAY NOW
            </Link>
          </section>

          <Link href="/game?mode=daily" className="card tap row">
            <span className="lead">
              <Icon name="calendar" />
            </span>
            <div className="grow">
              <div className="title">
                Daily Challenge{' '}
                {dailyDone ? (
                  <span className="badge" style={{ color: 'var(--good)' }}>
                    ✓ Done
                  </span>
                ) : (
                  <span className="badge">New</span>
                )}
              </div>
              <div className="sub">
                {dailyDone ? `Streak: ${profile.streak.current} days` : 'Win special rewards today'}
              </div>
            </div>
            <Icon name="play" className="chev" />
          </Link>

          <div className="grid-2">
            <Link href="/themes" className="card tap">
              <div className="lead" style={{ marginBottom: 10 }}>
                <Icon name="palette" />
              </div>
              <div className="title">Themes</div>
              <div className="sub">{profile.unlockedThemes.length}/9 unlocked</div>
            </Link>
            <Link href="/stats" className="card tap">
              <div className="lead" style={{ marginBottom: 10 }}>
                <Icon name="chart" />
              </div>
              <div className="title">Statistics</div>
              <div className="sub">View your growth</div>
            </Link>
            <Link href="/achievements" className="card tap">
              <div className="lead" style={{ marginBottom: 10 }}>
                <Icon name="awards" />
              </div>
              <div className="title">Achievements</div>
              <div className="sub">{Object.keys(profile.achievements).length} medals</div>
            </Link>
            <Link href="/settings" className="card tap">
              <div className="lead" style={{ marginBottom: 10 }}>
                <Icon name="settings" />
              </div>
              <div className="title">Settings</div>
              <div className="sub">Preferences</div>
            </Link>
          </div>

          <div className="card row" style={{ marginTop: 4 }}>
            <ProgressRing value={lvl.xpForNext ? lvl.xpIntoLevel / lvl.xpForNext : 0} size={46}>
              {lvl.level}
            </ProgressRing>
            <div className="grow">
              <div className="title">Level {lvl.level}</div>
              <div className="sub num">
                {lvl.xpIntoLevel} / {lvl.xpForNext} XP
              </div>
            </div>
          </div>
        </div>
      </main>

      {ready && !profile.onboarded && <Onboarding onDone={() => update((p) => void (p.onboarded = true))} />}
      {ready && profile.onboarded && <DailyLoginModal today={today} profile={profile} update={update} />}
      <BottomNav />
    </>
  );
}

/** Slowly drifting rectangles behind the Home content (PRD §5). */
function Floaters() {
  const items = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        // Deterministic-ish varied layout (no Math.random dependency on render).
        const size = 40 + ((i * 37) % 90);
        return {
          left: `${(i * 83) % 100}%`,
          size,
          duration: 22 + ((i * 7) % 26),
          delay: -((i * 5) % 30),
        };
      }),
    [],
  );
  return (
    <div className="floaters" aria-hidden>
      {items.map((f, i) => (
        <span
          key={i}
          style={{
            left: f.left,
            width: f.size,
            height: f.size,
            animationDuration: `${f.duration}s`,
            animationDelay: `${f.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

function Onboarding({ onDone }: { onDone: () => void }) {
  const rules = [
    { ic: '🔢', t: 'Every region has one number', d: 'Each rectangle you draw must contain exactly one clue.' },
    { ic: '📐', t: 'The number is the area', d: 'A clue of 6 means its rectangle covers 6 cells (e.g. 2×3 or 1×6).' },
    { ic: '🧩', t: 'Fill the whole grid', d: 'Rectangles must tile the board with no gaps or overlaps.' },
  ];
  return (
    <div className="overlay">
      <div className="modal">
        <h2>How to Play</h2>
        <p className="sub">Shikaku — divide the grid into rectangles</p>
        <div className="menu" style={{ marginTop: 4 }}>
          {rules.map((r) => (
            <div key={r.t} className="card row" style={{ padding: '12px 14px' }}>
              <span className="lead">{r.ic}</span>
              <div className="grow">
                <div className="title" style={{ fontSize: '0.98rem' }}>{r.t}</div>
                <div className="sub">{r.d}</div>
              </div>
            </div>
          ))}
        </div>
        <button className="btn primary" style={{ marginTop: 16 }} onClick={onDone}>
          Got it — Let&apos;s play
        </button>
      </div>
    </div>
  );
}

function rewardLabel(r: LoginReward): { ic: string; r: string } {
  switch (r.kind) {
    case 'coins':
      return { ic: '🪙', r: `${r.amount}c` };
    case 'hint':
      return { ic: '💡', r: 'Hint' };
    case 'themeFragment':
      return { ic: '🧩', r: 'Frag' };
    case 'premiumChest':
      return { ic: '🎁', r: 'Epic' };
  }
}

function DailyLoginModal({
  today,
  profile,
  update,
}: {
  today: string;
  profile: ReturnType<typeof useProfile>['profile'];
  update: ReturnType<typeof useProfile>['update'];
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const res = claimLoginReward(
      { lastLoginRewardKey: profile.streak.lastLoginRewardKey, loginCycleDay: profile.streak.loginCycleDay },
      today,
    );
    if (res.claimable) setOpen(true);
  }, [today, profile.streak.lastLoginRewardKey, profile.streak.loginCycleDay]);

  if (!open) return null;

  const res = claimLoginReward(
    { lastLoginRewardKey: profile.streak.lastLoginRewardKey, loginCycleDay: profile.streak.loginCycleDay },
    today,
  );
  const todayIndex = res.loginCycleDay;

  function claim() {
    update((p) => {
      const r = claimLoginReward(
        { lastLoginRewardKey: p.streak.lastLoginRewardKey, loginCycleDay: p.streak.loginCycleDay },
        today,
      );
      if (!r.claimable || !r.reward) return;
      p.streak.lastLoginRewardKey = r.lastLoginRewardKey;
      p.streak.loginCycleDay = r.loginCycleDay;
      switch (r.reward.kind) {
        case 'coins':
          p.coins += r.reward.amount;
          break;
        case 'hint':
          p.hints += r.reward.amount;
          break;
        case 'themeFragment':
        case 'premiumChest':
          p.coins += 100; // placeholder payout until fragments/chests exist
          break;
      }
    });
    setOpen(false);
  }

  return (
    <div className="overlay" onClick={() => setOpen(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ textAlign: 'center', marginBottom: 6 }}>
          <span className="lead" style={{ margin: '0 auto', display: 'inline-flex' }}>
            <Icon name="calendar" />
          </span>
        </div>
        <h2>Daily Login Reward</h2>
        <p className="sub">Don&apos;t break your streak! Claim today&apos;s bonus.</p>
        <div className="cycle">
          {LOGIN_CYCLE.map((r, i) => {
            const info = rewardLabel(r);
            const cls = i === todayIndex ? 'day today' : i < todayIndex ? 'day claimed' : 'day';
            return (
              <div key={i} className={cls}>
                <div className="d">{i === todayIndex ? 'TODAY' : `DAY ${i + 1}`}</div>
                <div className="ic">{info.ic}</div>
                <div className="r">{info.r}</div>
              </div>
            );
          })}
        </div>
        <button className="btn primary" onClick={claim}>
          CLAIM
        </button>
      </div>
    </div>
  );
}
