'use client';

import Link from 'next/link';
import { useProfile } from '../providers';
import { BottomNav, Icon } from '../../components/ui';
import { defaultProfile, type Settings } from '@shikaku/storage';

export default function SettingsPage() {
  const { profile, update } = useProfile();
  const s = profile.settings;

  const setSetting = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    update((p) => void (p.settings[key] = value));

  return (
    <>
      <main className="app">
        <header className="topbar">
          <Link href="/" className="icon-btn">
            <Icon name="undo" />
          </Link>
          <span className="spacer" />
        </header>

        <h1 className="screen-title">SETTINGS</h1>
        <p className="screen-sub">Audio, haptics & accessibility</p>

        <div className="section-title">Audio</div>
        <div className="card" style={{ display: 'grid', gap: 14 }}>
          <Toggle label="Sound Enabled" checked={s.audioEnabled} onChange={(v) => setSetting('audioEnabled', v)} />
          <Slider label="Music" value={s.musicVolume} onChange={(v) => setSetting('musicVolume', v)} />
          <Slider label="Effects" value={s.effectsVolume} onChange={(v) => setSetting('effectsVolume', v)} />
          <Slider label="UI" value={s.uiVolume} onChange={(v) => setSetting('uiVolume', v)} />
          <Slider label="Ambient" value={s.ambientVolume} onChange={(v) => setSetting('ambientVolume', v)} />
        </div>

        <div className="section-title">Feedback</div>
        <div className="card">
          <Toggle label="Haptics" checked={s.hapticsEnabled} onChange={(v) => setSetting('hapticsEnabled', v)} />
        </div>

        <div className="section-title">Accessibility</div>
        <div className="card" style={{ display: 'grid', gap: 14 }}>
          <Toggle label="Colorblind Mode" checked={s.colorblindMode} onChange={(v) => setSetting('colorblindMode', v)} />
          <Toggle label="High Contrast" checked={s.highContrast} onChange={(v) => setSetting('highContrast', v)} />
          <Toggle label="Large Text" checked={s.largeText} onChange={(v) => setSetting('largeText', v)} />
          <Toggle label="Reduced Motion" checked={s.reducedMotion} onChange={(v) => setSetting('reducedMotion', v)} />
          <Toggle label="Left-Hand Mode" checked={s.leftHandMode} onChange={(v) => setSetting('leftHandMode', v)} />
        </div>

        <div className="section-title">Data</div>
        <div className="card">
          <button
            className="btn danger"
            onClick={() => {
              if (confirm('Reset all progress? This cannot be undone.')) {
                update((p) => Object.assign(p, defaultProfile()));
              }
            }}
          >
            <Icon name="retry" size={16} /> Reset Progress
          </button>
        </div>

        <p className="screen-sub" style={{ textAlign: 'center', marginTop: 18 }}>
          Shikaku Master v1.0
        </p>
      </main>
      <BottomNav />
    </>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button className="row" style={{ width: '100%' }} onClick={() => onChange(!checked)}>
      <span className="grow title" style={{ fontWeight: 500, textAlign: 'left' }}>{label}</span>
      <span
        style={{
          width: 46,
          height: 28,
          borderRadius: 999,
          background: checked ? 'var(--accent)' : 'var(--surface-4)',
          position: 'relative',
          transition: 'background var(--dur)',
          flex: 'none',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 3,
            left: checked ? 21 : 3,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: checked ? 'var(--on-accent)' : 'var(--text-muted)',
            transition: 'left var(--dur) var(--ease-out)',
          }}
        />
      </span>
    </button>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span className="title" style={{ fontWeight: 500 }}>{label}</span>
        <span className="sub num">{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        style={{ width: '100%', accentColor: 'var(--accent)' }}
      />
    </label>
  );
}
