'use client';

import Link from 'next/link';
import { useProfile } from '../providers';
import { BottomNav, Icon } from '../../components/ui';
import { THEMES } from '../../lib/themes';
import { track } from '../../lib/services';

const THEME_PRICE = 500;

export default function ThemesPage() {
  const { profile, update } = useProfile();

  function selectOrBuy(id: string, free: boolean) {
    const owned = profile.unlockedThemes.includes(id);
    if (owned) {
      update((p) => void (p.activeTheme = id));
      return;
    }
    if (free) {
      update((p) => {
        p.unlockedThemes.push(id);
        p.activeTheme = id;
      });
      return;
    }
    if (profile.coins >= THEME_PRICE) {
      update((p) => {
        p.coins -= THEME_PRICE;
        p.unlockedThemes.push(id);
        p.activeTheme = id;
      });
      track('theme_unlock', { theme: id, price: THEME_PRICE });
    }
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

        <h1 className="screen-title">THEME STORE</h1>
        <p className="screen-sub">{profile.unlockedThemes.length} / {THEMES.length} unlocked</p>

        <div className="grid-2">
          {THEMES.map((t) => {
            const owned = profile.unlockedThemes.includes(t.id);
            const active = profile.activeTheme === t.id;
            const affordable = profile.coins >= THEME_PRICE;
            return (
              <button
                key={t.id}
                className="card tap"
                onClick={() => selectOrBuy(t.id, t.free)}
                style={{ borderColor: active ? 'var(--accent)' : 'var(--border)' }}
              >
                <div
                  style={{
                    height: 70,
                    borderRadius: 'var(--r-md)',
                    background: t.vars['--bg-grad'],
                    border: `2px solid ${t.vars['--border-strong']}`,
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 5,
                    padding: 8,
                  }}
                >
                  <span style={{ width: 14, height: 14, borderRadius: 4, background: t.vars['--accent'] }} />
                  <span style={{ width: 14, height: 14, borderRadius: 4, background: t.vars['--surface-3'] }} />
                  <span style={{ width: 14, height: 14, borderRadius: 4, background: t.vars['--accent-deep'] }} />
                </div>
                <div className="title" style={{ marginTop: 10 }}>{t.name}</div>
                <div className="sub">
                  {active ? (
                    <span style={{ color: 'var(--accent)' }}>✓ Active</span>
                  ) : owned ? (
                    'Tap to apply'
                  ) : t.free ? (
                    'Free'
                  ) : (
                    <span style={{ color: affordable ? 'var(--gold)' : 'var(--text-faint)' }}>🪙 {THEME_PRICE}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </main>
      <BottomNav />
    </>
  );
}
