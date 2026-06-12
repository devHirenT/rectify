'use client';

import React, { forwardRef, useImperativeHandle, useRef, useState, useCallback } from 'react';
import { rectStatus, rectContains, factorPairs, clueCountInside, type Clue, type Rect } from '@shikaku/game-engine';

export interface BoardHandle {
  /** Cycle zoom 1× → 1.5× → 2× → 1× (the Zoom control button). */
  cycleZoom: () => void;
  resetZoom: () => void;
}

interface BoardProps {
  rows: number;
  cols: number;
  clues: Clue[];
  placed: Rect[];
  cell: number;
  solved: boolean;
  /** Commit a new full placement set; `added` is the rect just drawn (if any). */
  onChange: (next: Rect[], added: Rect | null) => void;
  /** Optional feedback hook for non-draw gestures (zoom/lock/focus). */
  onUi?: () => void;
  /** Show ✓/✕ glyphs on rectangles for colorblind accessibility (PRD §20). */
  colorblind?: boolean;
  /** Transient glow on a just-revealed hint rectangle (id forces replay). */
  flash?: { rect: Rect; id: number } | null;
}

interface DragState {
  startR: number;
  startC: number;
  curR: number;
  curC: number;
}

const ZOOM_STEPS = [1, 1.5, 2];
const MAX_ZOOM = 3;
const LONG_PRESS_MS = 550;
const DOUBLE_TAP_MS = 300;

function rectKey(r: Rect): string {
  return `${r.r},${r.c},${r.h},${r.w}`;
}
function overlaps(a: Rect, b: Rect): boolean {
  return a.c < b.c + b.w && a.c + a.w > b.c && a.r < b.r + b.h && a.r + a.h > b.r;
}
function rectFromCells(d: DragState): Rect {
  return {
    r: Math.min(d.startR, d.curR),
    c: Math.min(d.startC, d.curC),
    h: Math.abs(d.startR - d.curR) + 1,
    w: Math.abs(d.startC - d.curC) + 1,
  };
}
function neededFor(rect: Rect, clues: Clue[]): number | null {
  const inside = clues.filter((c) => rectContains(rect, c.r, c.c));
  return inside.length === 1 ? inside[0]!.value : null;
}

/**
 * Smart-snap (PRD §6): if a drawn rectangle holds exactly one clue but its area
 * is wrong, nudge it to the nearest valid rectangle for that clue's number —
 * but only when the player's drawing was already close (so it feels helpful,
 * not teleporting).
 */
function smartSnap(rect: Rect, clues: Clue[], rows: number, cols: number): Rect {
  const inside = clues.filter((c) => rectContains(rect, c.r, c.c));
  if (inside.length !== 1) return rect;
  const clue = inside[0]!;
  if (rect.h * rect.w === clue.value) return rect; // already correct area

  let best: Rect | null = null;
  let bestScore = Infinity;
  for (const [h, w] of factorPairs(clue.value)) {
    const r0min = Math.max(0, clue.r - h + 1);
    const r0max = Math.min(clue.r, rows - h);
    const c0min = Math.max(0, clue.c - w + 1);
    const c0max = Math.min(clue.c, cols - w);
    for (let r0 = r0min; r0 <= r0max; r0++) {
      for (let c0 = c0min; c0 <= c0max; c0++) {
        const cand: Rect = { r: r0, c: c0, h, w };
        if (clueCountInside(cand, clues) !== 1) continue;
        const score =
          Math.abs(cand.r - rect.r) + Math.abs(cand.c - rect.c) + Math.abs(cand.h - rect.h) + Math.abs(cand.w - rect.w);
        if (score < bestScore) {
          bestScore = score;
          best = cand;
        }
      }
    }
  }
  return best && bestScore <= 3 ? best : rect;
}

export const Board = forwardRef<BoardHandle, BoardProps>(function Board(
  { rows, cols, clues, placed, cell, solved, onChange, onUi, colorblind, flash },
  ref,
) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [locked, setLocked] = useState<Set<string>>(() => new Set());
  const [focusValue, setFocusValue] = useState<number | null>(null);

  const width = cols * cell;
  const height = rows * cell;

  // Active pointers (for multi-touch pinch/pan) and gesture bookkeeping.
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinch = useRef<{ dist: number; mid: { x: number; y: number }; zoom: number; pan: { x: number; y: number } } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressCommit = useRef(false);
  const lastTap = useRef<{ r: number; c: number; t: number } | null>(null);
  const lastTwoFingerTap = useRef(0);

  const clampPan = useCallback(
    (p: { x: number; y: number }, z: number) => {
      const minX = -(width * z - width);
      const minY = -(height * z - height);
      return { x: Math.min(0, Math.max(minX, p.x)), y: Math.min(0, Math.max(minY, p.y)) };
    },
    [width, height],
  );

  const applyZoom = useCallback(
    (z: number) => {
      const nz = Math.max(1, Math.min(MAX_ZOOM, z));
      setZoom(nz);
      setPan((p) => clampPan(nz === 1 ? { x: 0, y: 0 } : p, nz));
    },
    [clampPan],
  );

  useImperativeHandle(ref, () => ({
    cycleZoom: () => {
      const i = ZOOM_STEPS.findIndex((s) => Math.abs(s - zoom) < 0.01);
      const next = ZOOM_STEPS[(i + 1) % ZOOM_STEPS.length]!;
      applyZoom(next);
      onUi?.();
    },
    resetZoom: () => {
      applyZoom(1);
      onUi?.();
    },
  }));

  /** Screen px (relative to the svg) → grid cell, inverting pan+zoom. */
  const cellAt = useCallback(
    (e: { clientX: number; clientY: number }): { r: number; c: number } => {
      const box = svgRef.current!.getBoundingClientRect();
      const rawX = e.clientX - box.left;
      const rawY = e.clientY - box.top;
      const worldX = (rawX - pan.x) / zoom;
      const worldY = (rawY - pan.y) / zoom;
      const c = Math.min(cols - 1, Math.max(0, Math.floor(worldX / cell)));
      const r = Math.min(rows - 1, Math.max(0, Math.floor(worldY / cell)));
      return { r, c };
    },
    [cell, cols, rows, pan, zoom],
  );

  const midOf = (a: { x: number; y: number }, b: { x: number; y: number }) => ({
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  });
  const distOf = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.hypot(a.x - b.x, a.y - b.y);

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (solved) return;
      e.preventDefault();
      (e.target as Element).setPointerCapture?.(e.pointerId);
      const box = svgRef.current!.getBoundingClientRect();
      pointers.current.set(e.pointerId, { x: e.clientX - box.left, y: e.clientY - box.top });

      // Two fingers → start pinch/pan, abandon any draw.
      if (pointers.current.size === 2) {
        cancelLongPress();
        setDrag(null);
        const [p1, p2] = [...pointers.current.values()];
        pinch.current = { dist: distOf(p1!, p2!), mid: midOf(p1!, p2!), zoom, pan: { ...pan } };
        return;
      }
      if (pointers.current.size > 2) return;

      const { r, c } = cellAt(e);

      // Double-tap on a clue cell → focus that number.
      const now = Date.now();
      const clueHere = clues.find((cl) => cl.r === r && cl.c === c);
      if (clueHere && lastTap.current && now - lastTap.current.t < DOUBLE_TAP_MS && lastTap.current.r === r && lastTap.current.c === c) {
        setFocusValue((v) => (v === clueHere.value ? null : clueHere.value));
        suppressCommit.current = true;
        onUi?.();
        return;
      }

      // Long-press on a placed rectangle → toggle lock.
      const hit = placed.find((p) => rectContains(p, r, c));
      longPressTimer.current = setTimeout(() => {
        if (hit) {
          setLocked((prev) => {
            const next = new Set(prev);
            const k = rectKey(hit);
            next.has(k) ? next.delete(k) : next.add(k);
            return next;
          });
          suppressCommit.current = true;
          onUi?.();
        }
      }, LONG_PRESS_MS);

      setDrag({ startR: r, startC: c, curR: r, curC: c });
    },
    [cellAt, clues, pan, placed, solved, zoom, onUi],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const box = svgRef.current!.getBoundingClientRect();
      const pos = { x: e.clientX - box.left, y: e.clientY - box.top };
      if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, pos);

      // Pinch / two-finger pan.
      if (pointers.current.size >= 2 && pinch.current) {
        const [p1, p2] = [...pointers.current.values()];
        const dist = distOf(p1!, p2!);
        const mid = midOf(p1!, p2!);
        const nz = Math.max(1, Math.min(MAX_ZOOM, (pinch.current.zoom * dist) / pinch.current.dist));
        // Keep the world point under the start midpoint anchored to the live midpoint.
        const worldAtStart = {
          x: (pinch.current.mid.x - pinch.current.pan.x) / pinch.current.zoom,
          y: (pinch.current.mid.y - pinch.current.pan.y) / pinch.current.zoom,
        };
        const np = clampPan({ x: mid.x - worldAtStart.x * nz, y: mid.y - worldAtStart.y * nz }, nz);
        setZoom(nz);
        setPan(np);
        return;
      }

      if (!drag) return;
      const { r, c } = cellAt(e);
      if (r !== drag.curR || c !== drag.curC) {
        cancelLongPress(); // movement = a draw, not a long press
        setDrag({ ...drag, curR: r, curC: c });
      }
    },
    [cellAt, clampPan, drag],
  );

  const isLocked = useCallback((p: Rect) => locked.has(rectKey(p)), [locked]);

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      pointers.current.delete(e.pointerId);
      cancelLongPress();

      // End of a (near-stationary) two-finger gesture → treat as reset-zoom tap.
      if (pinch.current && pointers.current.size < 2) {
        const wasPinch = pinch.current;
        pinch.current = null;
        const movedZoom = Math.abs(zoom - wasPinch.zoom) > 0.05;
        if (!movedZoom) {
          const t = Date.now();
          if (t - lastTwoFingerTap.current < 400) {
            applyZoom(1);
            onUi?.();
            lastTwoFingerTap.current = 0;
          } else {
            lastTwoFingerTap.current = t;
          }
        }
        setDrag(null);
        return;
      }

      if (suppressCommit.current) {
        suppressCommit.current = false;
        setDrag(null);
        return;
      }

      if (!drag) return;
      lastTap.current = { r: drag.startR, c: drag.startC, t: Date.now() };
      const drawn = rectFromCells(drag);
      const isTap = drawn.h === 1 && drawn.w === 1;

      if (isTap) {
        const hit = placed.find((p) => rectContains(p, drawn.r, drawn.c));
        if (hit) {
          if (!isLocked(hit)) onChange(placed.filter((p) => p !== hit), null); // locked rects resist erase
          setDrag(null);
          return;
        }
      }

      // Smart-snap to the clue's valid dimensions, then place.
      const newRect = isTap ? drawn : smartSnap(drawn, clues, rows, cols);
      const survivors = placed.filter((p) => isLocked(p) || !overlaps(p, newRect));
      onChange([...survivors, newRect], newRect);
      setDrag(null);
    },
    [drag, isLocked, onChange, placed, zoom, applyZoom, onUi, clues, rows, cols],
  );

  const onPointerCancel = useCallback((e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    cancelLongPress();
    pinch.current = null;
    setDrag(null);
  }, []);

  const preview = drag ? rectFromCells(drag) : null;
  const previewStatus = preview ? rectStatus(preview, clues) : null;

  // Area counter, positioned in screen space (accounts for pan + zoom).
  const counter =
    drag && preview
      ? {
          x: pan.x + (preview.c + preview.w / 2) * cell * zoom,
          y: pan.y + preview.r * cell * zoom,
          need: neededFor(preview, clues),
          have: preview.h * preview.w,
          good: previewStatus?.valid ?? false,
        }
      : null;

  const transform = `translate(${pan.x} ${pan.y}) scale(${zoom})`;

  return (
    <div style={{ position: 'relative', width, height }}>
      {counter && (
        <div
          className={'area-counter ' + (counter.need == null ? '' : counter.good ? 'good' : 'bad')}
          style={{ left: counter.x, top: counter.y }}
        >
          {counter.need == null ? `Area ${counter.have}` : `Need ${counter.need} · Have ${counter.have}`}
        </div>
      )}
      <svg
        ref={svgRef}
        className="board"
        width={width}
        height={height}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        <g transform={transform}>
          {/* Placed rectangles */}
          {placed.map((p, i) => {
            const st = rectStatus(p, clues);
            const lockedRect = isLocked(p);
            const fill = st.valid
              ? 'color-mix(in srgb, var(--good) 22%, transparent)'
              : 'color-mix(in srgb, var(--bad) 20%, transparent)';
            const stroke = lockedRect ? 'var(--gold)' : st.valid ? 'var(--good)' : 'var(--bad)';
            return (
              <g key={i}>
                <rect
                  className="placed"
                  x={p.c * cell + 2}
                  y={p.r * cell + 2}
                  width={p.w * cell - 4}
                  height={p.h * cell - 4}
                  rx={8}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={2.5}
                  strokeDasharray={lockedRect ? '5 3' : undefined}
                />
                {lockedRect && (
                  <text x={p.c * cell + p.w * cell - 12} y={p.r * cell + 14} fontSize={11} fill="var(--gold)">
                    🔒
                  </text>
                )}
                {colorblind && (
                  <text
                    x={p.c * cell + (p.w * cell) / 2}
                    y={p.r * cell + (p.h * cell) / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={Math.min(cell * 0.5, 20)}
                    fontWeight={800}
                    fill={st.valid ? 'var(--good)' : 'var(--bad)'}
                    opacity={0.85}
                  >
                    {st.valid ? '✓' : '✕'}
                  </text>
                )}
              </g>
            );
          })}

          {/* Hint glow — pulses once on the just-revealed rectangle */}
          {flash && (
            <rect
              key={'flash' + flash.id}
              className="hint-glow"
              x={flash.rect.c * cell}
              y={flash.rect.r * cell}
              width={flash.rect.w * cell}
              height={flash.rect.h * cell}
              rx={8}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={4}
            />
          )}

          {/* Grid lines */}
          {Array.from({ length: cols + 1 }, (_, c) => (
            <line key={'v' + c} x1={c * cell} y1={0} x2={c * cell} y2={height} stroke="var(--grid-line)" strokeWidth={1} />
          ))}
          {Array.from({ length: rows + 1 }, (_, r) => (
            <line key={'h' + r} x1={0} y1={r * cell} x2={width} y2={r * cell} stroke="var(--grid-line)" strokeWidth={1} />
          ))}

          {/* Drag preview */}
          {preview && (
            <rect
              x={preview.c * cell + 1}
              y={preview.r * cell + 1}
              width={preview.w * cell - 2}
              height={preview.h * cell - 2}
              rx={8}
              fill={previewStatus?.valid ? 'color-mix(in srgb, var(--good) 28%, transparent)' : 'color-mix(in srgb, var(--accent) 22%, transparent)'}
              stroke={previewStatus?.valid ? 'var(--good)' : 'var(--accent)'}
              strokeWidth={2.5}
              strokeDasharray="6 4"
            />
          )}

          {/* Clue numbers — plain text; focus dims non-matching, highlights matches */}
          {clues.map((clue, i) => {
            const isMatch = focusValue != null && clue.value === focusValue;
            const dim = focusValue != null && !isMatch;
            return (
              <text
                key={'clue' + i}
                x={clue.c * cell + cell / 2}
                y={clue.r * cell + cell / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={cell * (isMatch ? 0.54 : 0.46)}
                fontWeight={isMatch ? 800 : 500}
                fill={isMatch ? 'var(--gold)' : 'var(--accent)'}
                opacity={dim ? 0.35 : 1}
                style={{ fontFamily: 'var(--font-ui)', transition: 'opacity 0.2s' }}
              >
                {clue.value}
              </text>
            );
          })}
        </g>
      </svg>
    </div>
  );
});
