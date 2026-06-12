import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { View, Text, PanResponder, StyleSheet, type GestureResponderEvent } from 'react-native';
import { rectStatus, rectContains, type Clue, type Rect } from '@shikaku/game-engine';
import type { NativeTheme } from './theme';

export interface BoardHandle {
  cycleZoom: () => void;
  resetZoom: () => void;
}

interface Props {
  rows: number;
  cols: number;
  clues: Clue[];
  placed: Rect[];
  cell: number;
  solved: boolean;
  theme: NativeTheme;
  onChange: (next: Rect[], added: Rect | null) => void;
  /** Feedback hook for non-draw gestures (zoom/lock/focus). */
  onUi?: () => void;
}

interface Drag {
  startR: number;
  startC: number;
  curR: number;
  curC: number;
}

const ZOOM_STEPS = [1, 1.5, 2];
const MAX_ZOOM = 3;
const LONG_PRESS_MS = 550;
const DOUBLE_TAP_MS = 300;

const key = (r: Rect) => `${r.r},${r.c},${r.h},${r.w}`;
const overlaps = (a: Rect, b: Rect) => a.c < b.c + b.w && a.c + a.w > b.c && a.r < b.r + b.h && a.r + a.h > b.r;
const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
function rectFromDrag(d: Drag): Rect {
  return {
    r: Math.min(d.startR, d.curR),
    c: Math.min(d.startC, d.curC),
    h: Math.abs(d.startR - d.curR) + 1,
    w: Math.abs(d.startC - d.curC) + 1,
  };
}

export const Board = forwardRef<BoardHandle, Props>(function Board(
  { rows, cols, clues, placed, cell, solved, theme, onChange, onUi },
  ref,
) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [locked, setLocked] = useState<Set<string>>(() => new Set());
  const [focusValue, setFocusValue] = useState<number | null>(null);

  const width = cols * cell;
  const height = rows * cell;
  const cx = width / 2;
  const cy = height / 2;

  // Mutable refs (live values inside the PanResponder closures).
  const containerRef = useRef<View>(null);
  const origin = useRef({ x: 0, y: 0 }); // container position in window
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const placedRef = useRef(placed);
  placedRef.current = placed;
  const lockedRef = useRef(locked);
  lockedRef.current = locked;
  const dragRef = useRef<Drag | null>(null);
  const pinchRef = useRef<{ dist: number; mid: { x: number; y: number }; zoom: number; pan: { x: number; y: number } } | null>(null);
  const longPress = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppress = useRef(false);
  const lastTap = useRef<{ r: number; c: number; t: number } | null>(null);
  const lastTwoFinger = useRef(0);

  const setZoomBoth = (z: number) => {
    zoomRef.current = z;
    setZoom(z);
  };
  const setPanBoth = (p: { x: number; y: number }) => {
    panRef.current = p;
    setPan(p);
  };

  const clampPan = (p: { x: number; y: number }, s: number) => {
    const mx = (width * (s - 1)) / 2;
    const my = (height * (s - 1)) / 2;
    return { x: clamp(p.x, -mx, mx), y: clamp(p.y, -my, my) };
  };

  const applyZoom = (z: number) => {
    const nz = clamp(z, 1, MAX_ZOOM);
    setZoomBoth(nz);
    setPanBoth(clampPan(nz === 1 ? { x: 0, y: 0 } : panRef.current, nz));
  };

  useImperativeHandle(ref, () => ({
    cycleZoom: () => {
      const i = ZOOM_STEPS.findIndex((s) => Math.abs(s - zoomRef.current) < 0.01);
      applyZoom(ZOOM_STEPS[(i + 1) % ZOOM_STEPS.length]!);
      onUi?.();
    },
    resetZoom: () => {
      applyZoom(1);
      onUi?.();
    },
  }));

  /** Window px → grid cell, inverting the center-origin scale + pan. */
  const cellAt = (pageX: number, pageY: number) => {
    const localX = pageX - origin.current.x;
    const localY = pageY - origin.current.y;
    const worldX = cx + (localX - cx - panRef.current.x) / zoomRef.current;
    const worldY = cy + (localY - cy - panRef.current.y) / zoomRef.current;
    return {
      c: clamp(Math.floor(worldX / cell), 0, cols - 1),
      r: clamp(Math.floor(worldY / cell), 0, rows - 1),
    };
  };

  const cancelLong = () => {
    if (longPress.current) {
      clearTimeout(longPress.current);
      longPress.current = null;
    }
  };

  const dist = (a: { pageX: number; pageY: number }, b: { pageX: number; pageY: number }) =>
    Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
  const localMid = (a: { pageX: number; pageY: number }, b: { pageX: number; pageY: number }) => ({
    x: (a.pageX + b.pageX) / 2 - origin.current.x,
    y: (a.pageY + b.pageY) / 2 - origin.current.y,
  });

  const startPinch = (t0: any, t1: any) => {
    cancelLong();
    setDrag(null);
    dragRef.current = null;
    pinchRef.current = { dist: dist(t0, t1), mid: localMid(t0, t1), zoom: zoomRef.current, pan: { ...panRef.current } };
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !solved,
        onMoveShouldSetPanResponder: () => !solved,
        onPanResponderGrant: (e: GestureResponderEvent) => {
          const ts = e.nativeEvent.touches;
          if (ts.length >= 2 && ts[0] && ts[1]) {
            startPinch(ts[0], ts[1]);
            return;
          }
          const { pageX, pageY } = e.nativeEvent;
          const { r, c } = cellAt(pageX, pageY);

          // Double-tap a clue cell → focus that number.
          const now = Date.now();
          const clueHere = clues.find((cl) => cl.r === r && cl.c === c);
          if (clueHere && lastTap.current && now - lastTap.current.t < DOUBLE_TAP_MS && lastTap.current.r === r && lastTap.current.c === c) {
            setFocusValue((v) => (v === clueHere.value ? null : clueHere.value));
            suppress.current = true;
            onUi?.();
            return;
          }

          // Long-press a placed rectangle → toggle lock.
          const hit = placedRef.current.find((p) => rectContains(p, r, c));
          longPress.current = setTimeout(() => {
            if (hit) {
              setLocked((prev) => {
                const next = new Set(prev);
                const k = key(hit);
                next.has(k) ? next.delete(k) : next.add(k);
                return next;
              });
              suppress.current = true;
              onUi?.();
            }
          }, LONG_PRESS_MS);

          const d = { startR: r, startC: c, curR: r, curC: c };
          dragRef.current = d;
          setDrag(d);
        },
        onPanResponderMove: (e: GestureResponderEvent) => {
          const ts = e.nativeEvent.touches;
          if (ts.length >= 2 && ts[0] && ts[1]) {
            const a = ts[0];
            const b = ts[1];
            if (!pinchRef.current) startPinch(a, b);
            else {
              const p = pinchRef.current;
              const nd = dist(a, b);
              const mid = localMid(a, b);
              const nz = clamp((p.zoom * nd) / p.dist, 1, MAX_ZOOM);
              const worldAtStart = { x: cx + (p.mid.x - cx - p.pan.x) / p.zoom, y: cy + (p.mid.y - cy - p.pan.y) / p.zoom };
              const np = clampPan({ x: mid.x - cx - nz * (worldAtStart.x - cx), y: mid.y - cy - nz * (worldAtStart.y - cy) }, nz);
              setZoomBoth(nz);
              setPanBoth(np);
            }
            return;
          }
          if (!dragRef.current) return;
          const { pageX, pageY } = e.nativeEvent;
          const { r, c } = cellAt(pageX, pageY);
          if (r !== dragRef.current.curR || c !== dragRef.current.curC) {
            cancelLong();
            const d = { ...dragRef.current, curR: r, curC: c };
            dragRef.current = d;
            setDrag(d);
          }
        },
        onPanResponderRelease: () => endTouch(),
        onPanResponderTerminate: () => endTouch(),
      }),
    // Recreate when the puzzle geometry or solved state changes.
    [solved, cell, cols, rows, clues], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const isLocked = (p: Rect) => lockedRef.current.has(key(p));

  function endTouch() {
    cancelLong();

    if (pinchRef.current) {
      const was = pinchRef.current;
      pinchRef.current = null;
      // Near-stationary two-finger gesture → double-tap-to-reset.
      if (Math.abs(zoomRef.current - was.zoom) < 0.05) {
        const t = Date.now();
        if (t - lastTwoFinger.current < 400) {
          applyZoom(1);
          onUi?.();
          lastTwoFinger.current = 0;
        } else {
          lastTwoFinger.current = t;
        }
      }
      setDrag(null);
      dragRef.current = null;
      return;
    }

    if (suppress.current) {
      suppress.current = false;
      setDrag(null);
      dragRef.current = null;
      return;
    }

    const d = dragRef.current;
    dragRef.current = null;
    setDrag(null);
    if (!d) return;
    lastTap.current = { r: d.startR, c: d.startC, t: Date.now() };

    const rect = rectFromDrag(d);
    const isTap = rect.h === 1 && rect.w === 1;
    const current = placedRef.current;
    if (isTap) {
      const hit = current.find((p) => rectContains(p, rect.r, rect.c));
      if (hit) {
        if (!isLocked(hit)) onChange(current.filter((p) => p !== hit), null);
        return;
      }
    }
    const survivors = current.filter((p) => isLocked(p) || !overlaps(p, rect));
    onChange([...survivors, rect], rect);
  }

  const preview = drag ? rectFromDrag(drag) : null;

  return (
    <View
      ref={containerRef}
      onLayout={() => containerRef.current?.measureInWindow((x, y) => (origin.current = { x, y }))}
      style={[styles.board, { width, height, backgroundColor: theme.cell, borderColor: theme.gridLine }]}
      {...responder.panHandlers}
    >
      <View style={{ width, height, transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale: zoom }] }}>
        {/* Grid lines */}
        {Array.from({ length: cols - 1 }, (_, i) => (
          <View key={'v' + i} style={{ position: 'absolute', left: (i + 1) * cell, top: 0, width: 1, height, backgroundColor: theme.gridLine }} />
        ))}
        {Array.from({ length: rows - 1 }, (_, i) => (
          <View key={'h' + i} style={{ position: 'absolute', top: (i + 1) * cell, left: 0, height: 1, width, backgroundColor: theme.gridLine }} />
        ))}

        {/* Placed rectangles */}
        {placed.map((p, i) => {
          const valid = rectStatus(p, clues).valid;
          const lock = isLocked(p);
          return (
            <View
              key={i}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: p.c * cell + 2,
                top: p.r * cell + 2,
                width: p.w * cell - 4,
                height: p.h * cell - 4,
                borderRadius: 8,
                borderWidth: 2.5,
                borderStyle: lock ? 'dashed' : 'solid',
                borderColor: lock ? '#efc140' : valid ? theme.good : theme.bad,
                backgroundColor: (valid ? theme.good : theme.bad) + '33',
              }}
            >
              {lock && <Text style={{ position: 'absolute', right: 2, top: 0, fontSize: 10 }}>🔒</Text>}
            </View>
          );
        })}

        {/* Drag preview */}
        {preview && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: preview.c * cell + 1,
              top: preview.r * cell + 1,
              width: preview.w * cell - 2,
              height: preview.h * cell - 2,
              borderRadius: 8,
              borderWidth: 2.5,
              borderColor: theme.accent,
              backgroundColor: theme.accent + '33',
            }}
          />
        )}

        {/* Clues — plain text; focus highlights matching value, dims others */}
        {clues.map((clue, i) => {
          const match = focusValue != null && clue.value === focusValue;
          const dim = focusValue != null && !match;
          return (
            <View
              key={'c' + i}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: clue.c * cell,
                top: clue.r * cell,
                width: cell,
                height: cell,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: dim ? 0.35 : 1,
              }}
            >
              <Text style={{ color: match ? '#efc140' : theme.accent, fontWeight: match ? '800' : '500', fontSize: cell * (match ? 0.54 : 0.46) }}>
                {clue.value}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  board: {
    position: 'relative',
    borderWidth: 2,
    borderRadius: 14,
    overflow: 'hidden',
  },
});
