'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/* ---------------- Icons (1.75px stroke line set) ---------------- */

const PATHS: Record<string, React.ReactNode> = {
  play: <path d="M6 4l14 8-14 8V4z" />,
  store: (
    <>
      <path d="M4 7h16l-1 3H5L4 7z" />
      <path d="M5 10v9h14v-9" />
      <path d="M9 19v-5h6v5" />
    </>
  ),
  awards: (
    <>
      <circle cx="12" cy="9" r="5" />
      <path d="M9 13l-2 7 5-3 5 3-2-7" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 00-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 00-2-1.2L14 1h-4l-.5 2.6a7 7 0 00-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1a7 7 0 002 1.2L10 23h4l.5-2.6a7 7 0 002-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z" />
    </>
  ),
  menu: (
    <>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </>
  ),
  undo: (
    <>
      <path d="M9 7L4 12l5 5" />
      <path d="M4 12h11a5 5 0 015 5v0" />
    </>
  ),
  retry: (
    <>
      <path d="M21 12a9 9 0 11-3-6.7" />
      <path d="M21 3v5h-5" />
    </>
  ),
  bulb: (
    <>
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 00-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0012 3z" />
    </>
  ),
  zoom: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4-4M11 8v6M8 11h6" />
    </>
  ),
  pause: (
    <>
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </>
  ),
  check: <path d="M5 13l4 4L19 7" />,
  infinity: (
    <path d="M8 12c0-2 1.5-3.5 3-3.5S16 12 16 12s1.5 3.5 3 3.5 3-1.5 3-3.5-1.5-3.5-3-3.5S16 12 16 12s-1.5 3.5-3 3.5S8 14 8 12z" />
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M4 9h16M9 3v4M15 3v4" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />
    </>
  ),
  palette: (
    <>
      <path d="M12 3a9 9 0 100 18c1 0 1.5-1 1-2-.5-1.2.5-2 1.5-2H18a3 3 0 003-3c0-5-4-9-9-9z" />
      <circle cx="7.5" cy="11" r="1" />
      <circle cx="12" cy="8" r="1" />
      <circle cx="16" cy="11" r="1" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1" />
      <rect x="13" y="4" width="7" height="7" rx="1" />
      <rect x="4" y="13" width="7" height="7" rx="1" />
      <rect x="13" y="13" width="7" height="7" rx="1" />
    </>
  ),
  exit: (
    <>
      <path d="M14 4h4a2 2 0 012 2v12a2 2 0 01-2 2h-4" />
      <path d="M10 12H3M6 8l-4 4 4 4" />
    </>
  ),
};

export function Icon({
  name,
  size = 20,
  fill = false,
  className,
}: {
  name: keyof typeof PATHS | string;
  size?: number;
  fill?: boolean;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ? 'currentColor' : 'none'}
      stroke={fill ? 'none' : 'currentColor'}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {PATHS[name] ?? null}
    </svg>
  );
}

/* ---------------- Bottom navigation ---------------- */

const NAV = [
  { href: '/', label: 'Play', icon: 'play', fill: true },
  { href: '/themes', label: 'Store', icon: 'store' },
  { href: '/achievements', label: 'Awards', icon: 'awards' },
  { href: '/settings', label: 'Settings', icon: 'settings' },
] as const;

export function BottomNav() {
  const path = usePathname();
  const isActive = (href: string) =>
    href === '/' ? path === '/' || path.startsWith('/play') || path.startsWith('/game') : path === href;

  return (
    <nav className="bottomnav">
      {NAV.map((n) => (
        <Link key={n.href} href={n.href} className={'navitem' + (isActive(n.href) ? ' active' : '')}>
          <span className="navicon">
            <Icon name={n.icon} size={20} fill={'fill' in n && n.fill ? isActive(n.href) : false} />
          </span>
          {n.label}
        </Link>
      ))}
    </nav>
  );
}

/* ---------------- Progress ring ---------------- */

export function ProgressRing({
  value,
  size = 44,
  stroke = 4,
  children,
}: {
  value: number; // 0..1
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border-strong)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent-deep)"
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - Math.max(0, Math.min(1, value)))}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 400ms var(--ease-out)' }}
        />
      </svg>
      {children != null && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: size * 0.3,
            fontWeight: 700,
            color: 'var(--text-hi)',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/* ---------------- Stars ---------------- */

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="stars" style={{ fontSize: size }}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={i < value ? 'on' : 'off'}>
          ★
        </span>
      ))}
    </span>
  );
}

export function formatTime(s: number): string {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

/** Falling confetti burst for the victory modal. */
export function Confetti({ count = 36 }: { count?: number }) {
  const colors = ['var(--accent)', 'var(--gold)', 'var(--good)', 'var(--accent-deep)'];
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: `${(i * 53) % 100}%`,
        delay: ((i * 17) % 100) / 100,
        duration: 1.6 + (((i * 13) % 70) / 100),
        color: colors[i % colors.length]!,
        rotate: (i * 47) % 360,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count],
  );
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((p, i) => (
        <i
          key={i}
          style={{
            left: p.left,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}
