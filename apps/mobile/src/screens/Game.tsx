import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, Modal, StyleSheet, useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  generatePuzzle,
  generateDailyChallenge,
  isSolved,
  rectStatus,
  computeStars,
  hashSeed,
  type Difficulty,
  type Rect,
  type GeneratedPuzzle,
} from '@shikaku/game-engine';
import { coinsForSolve, xpForSolve, addXp } from '@shikaku/rewards';
import { saveSavedGame, clearSavedGame, loadSavedGame } from '@shikaku/storage';
import { shouldShowInterstitial, TestAdManager } from '@shikaku/ads';
import { Board, type BoardHandle } from '../Board';
import { getSoundManager, toAudioSettings } from '../audio';
import { useApp } from '../ctx';
import { Btn, Pill, fmtTime } from '../ui';

const SIZE_FOR: Record<Difficulty, [number, number]> = {
  easy: [6, 6], medium: [8, 8], hard: [10, 10], expert: [11, 11], master: [12, 12], infinite: [9, 9],
};
const ads = new TestAdManager();

export function Game({ mode, level }: { mode: Difficulty | 'daily'; level?: number }) {
  const { profile, update, store, theme, go } = useApp();
  const { width } = useWindowDimensions();
  const haptics = profile.settings.hapticsEnabled;
  const sound = useMemo(() => getSoundManager(toAudioSettings(profile.settings)), [profile.settings]);

  const [seedBump, setSeedBump] = useState(0);
  const generated: GeneratedPuzzle = useMemo(() => {
    if (mode === 'daily') return generateDailyChallenge(new Date());
    const [rows, cols] = SIZE_FOR[mode];
    const seed = level != null ? hashSeed(`${mode}-${level}`) : (hashSeed(mode) + seedBump * 104729) >>> 0;
    return generatePuzzle({ rows, cols, seed, difficulty: mode });
  }, [mode, level, seedBump]);
  const { puzzle, solution } = generated;
  const { rows, cols, clues } = puzzle;
  const cell = Math.floor(Math.min(width - 32, 420) / cols);

  const [placed, setPlaced] = useState<Rect[]>([]);
  const [history, setHistory] = useState<Rect[][]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [solvedTime, setSolvedTime] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [adKind, setAdKind] = useState<'double_coins' | 'hint' | null>(null);
  const [adClaimed, setAdClaimed] = useState(false);
  const startRef = useRef(Date.now());
  const rewarded = useRef(false);
  const restored = useRef(false);
  const boardRef = useRef<BoardHandle>(null);

  useEffect(() => {
    setPlaced([]); setHistory([]); setMistakes(0); setHintsUsed(0); setSolvedTime(null);
    setPaused(false); setAdKind(null); setAdClaimed(false);
    startRef.current = Date.now(); rewarded.current = false;
  }, [puzzle.id]);

  useEffect(() => {
    void sound.resume();
    sound.startMusic();
    return () => sound.stopMusic();
  }, [sound]);

  // Restore a saved game (deterministic puzzles only).
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    void loadSavedGame(store).then((sg) => {
      if (!sg || sg.mode !== mode || (sg.level ?? null) !== (level ?? null)) return;
      setPlaced(sg.placed.map((p) => ({ ...p })));
      setMistakes(sg.mistakes);
      setHintsUsed(sg.hintsUsed);
      startRef.current = Date.now() - sg.elapsedSeconds * 1000;
    });
  }, [store, mode, level]);

  const completion = placed.reduce((a, r) => a + r.h * r.w, 0) / (rows * cols);
  useEffect(() => { sound.setCompletion(completion); }, [sound, completion]);

  // Persist in-progress (levels + daily).
  useEffect(() => {
    if (solvedTime != null) return;
    if (mode !== 'daily' && level == null) return;
    if (placed.length === 0 && mistakes === 0 && hintsUsed === 0) return;
    void saveSavedGame(store, {
      mode, level: level ?? null, rows, cols,
      placed: placed.map((p) => ({ r: p.r, c: p.c, h: p.h, w: p.w })),
      mistakes, hintsUsed, elapsedSeconds: Math.floor((Date.now() - startRef.current) / 1000),
      savedAt: Date.now(), label: mode === 'daily' ? 'Daily Challenge' : `${cap(mode)} · Level ${level}`,
    });
  }, [placed, mistakes, hintsUsed, solvedTime, store, mode, level, rows, cols]);

  const solved = isSolved(placed, clues, rows, cols);
  useEffect(() => {
    if (!solved || rewarded.current) return;
    rewarded.current = true;
    const time = Math.floor((Date.now() - startRef.current) / 1000);
    setSolvedTime(time);
    sound.play('complete'); sound.play('coin');
    if (haptics) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    void clearSavedGame(store);
    const stars = computeStars({ mistakes, hintsUsed, timeSeconds: time, parSeconds: rows * cols * 4 });
    const perfect = mistakes === 0 && hintsUsed === 0;
    const c = coinsForSolve({ perfect, usedHint: hintsUsed > 0, isDaily: mode === 'daily' });
    const xp = xpForSolve({ difficultyScore: puzzle.score, stars, perfect });
    const todayKey = puzzle.id.startsWith('daily-') ? puzzle.id.slice('daily-'.length) : null;
    update((p) => {
      p.coins += c.total;
      const res = addXp(p.xp, xp); p.xp = res.totalXp; p.level = res.after.level;
      p.stats.puzzlesSolved += 1;
      if (perfect) p.stats.perfectSolves += 1;
      p.stats.hintsUsed += hintsUsed;
      p.stats.totalTimeSeconds += time;
      p.stats.bestTimeSeconds = p.stats.bestTimeSeconds == null ? time : Math.min(p.stats.bestTimeSeconds, time);
      const levelId = mode !== 'daily' && level != null ? `${mode}-${level}` : puzzle.id;
      p.starsByLevel[levelId] = Math.max(p.starsByLevel[levelId] ?? 0, stars);
      p.bestTimeByLevel[levelId] = p.bestTimeByLevel[levelId] == null ? time : Math.min(p.bestTimeByLevel[levelId]!, time);
      if (mode !== 'daily' && level != null) {
        const arr = (p.completedLevels[mode] ??= []);
        if (!arr.includes(levelId)) arr.push(levelId);
      }
      if (todayKey && p.streak.lastDailyKey !== todayKey) {
        const prev = p.streak.lastDailyKey;
        const consecutive = prev != null && dayGap(prev, todayKey) === 1;
        p.streak.current = consecutive ? p.streak.current + 1 : 1;
        p.streak.longest = Math.max(p.streak.longest, p.streak.current);
        p.streak.lastDailyKey = todayKey;
      }
    });
  }, [solved]); // eslint-disable-line react-hooks/exhaustive-deps

  function commit(next: Rect[], added: Rect | null) {
    setHistory((h) => [...h, placed]);
    setPlaced(next);
    if (added) {
      if (rectStatus(added, clues).valid) {
        sound.play('correct');
        if (haptics) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        setMistakes((m) => m + 1);
        sound.play('wrong');
        if (haptics) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  }
  function undo() {
    setHistory((h) => { if (!h.length) return h; setPlaced(h[h.length - 1]!); return h.slice(0, -1); });
    sound.play('undo');
  }
  function revealHint() {
    const t = solution.find((s) => !placed.some((p) => p.r === s.r && p.c === s.c && p.h === s.h && p.w === s.w));
    if (!t) return;
    const rect: Rect = { r: t.r, c: t.c, h: t.h, w: t.w };
    setHistory((h) => [...h, placed]);
    setPlaced((cur) => [...cur.filter((p) => !overlaps(p, rect)), rect]);
    setHintsUsed((n) => n + 1);
    sound.play('hint');
  }
  function hint() {
    if (solvedTime != null) return;
    if (profile.hints > 0) { update((p) => void (p.hints -= 1)); revealHint(); }
    else setAdKind('hint');
  }
  async function nextLevel() {
    if (shouldShowInterstitial(profile.stats.puzzlesSolved)) await ads.showInterstitial();
    if (level != null) go({ screen: 'game', mode, level: level + 1 });
    else setSeedBump((n) => n + 1);
  }

  const stars = solvedTime != null ? computeStars({ mistakes, hintsUsed, timeSeconds: solvedTime, parSeconds: rows * cols * 4 }) : 0;
  const coinBreakdown = coinsForSolve({ perfect: mistakes === 0 && hintsUsed === 0, usedHint: hintsUsed > 0, isDaily: mode === 'daily' });

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.topbar}>
        <Pill theme={theme}>🪙 {profile.coins}</Pill>
        <Pill theme={theme}>⏱ {fmtTime(solvedTime ?? Math.floor((Date.now() - startRef.current) / 1000))}</Pill>
        <Btn theme={theme} variant="ghost" onPress={() => setPaused(true)}>⏸</Btn>
      </View>

      <Text style={[styles.title, { color: theme.accent }]}>
        {mode === 'daily' ? 'DAILY CHALLENGE' : `${cap(mode)} ${rows}×${cols}`}
      </Text>
      <Text style={{ color: theme.muted, textAlign: 'center' }}>Hints: {profile.hints} · Mistakes: {mistakes}</Text>

      <View style={{ alignItems: 'center', marginVertical: 16 }}>
        <Board
          ref={boardRef}
          {...{ rows, cols, clues, placed, cell, solved, theme }}
          onChange={commit}
          onUi={() => haptics && void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        />
      </View>

      <View style={styles.controls}>
        <Btn theme={theme} onPress={undo} disabled={!history.length || !!solvedTime}>↩ Undo</Btn>
        <Btn theme={theme} onPress={() => { setPlaced([]); sound.play('retry'); }} disabled={!!solvedTime}>⟳ Retry</Btn>
        <Btn theme={theme} variant="primary" onPress={hint} disabled={!!solvedTime}>💡 Hint</Btn>
        <Btn theme={theme} onPress={() => boardRef.current?.cycleZoom()} disabled={!!solvedTime}>🔍 Zoom</Btn>
      </View>

      {/* Pause */}
      <Modal transparent visible={paused} animationType="fade" onRequestClose={() => setPaused(false)}>
        <View style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: theme.surface, borderColor: theme.gridLine }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Game Paused</Text>
            <View style={{ gap: 10, marginTop: 12 }}>
              <Btn theme={theme} variant="primary" onPress={() => setPaused(false)}>▶ Resume</Btn>
              <Btn theme={theme} onPress={() => { setPlaced([]); setPaused(false); }}>⟳ Restart Level</Btn>
              <Btn theme={theme} variant="ghost" onPress={() => go({ screen: 'settings' })}>⚙ Settings</Btn>
              <Btn theme={theme} variant="danger" onPress={() => go({ screen: 'home' })}>⤓ Exit Game</Btn>
            </View>
          </View>
        </View>
      </Modal>

      {/* Victory */}
      <Modal transparent visible={solvedTime != null && !adKind} animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: theme.surface, borderColor: theme.gridLine, alignItems: 'center' }]}>
            <Text style={{ fontSize: 30 }}>
              <Text style={{ color: '#efc140' }}>{'★'.repeat(stars)}</Text>
              <Text style={{ color: theme.gridLine }}>{'★'.repeat(3 - stars)}</Text>
            </Text>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Puzzle Complete!</Text>
            <Text style={{ color: theme.muted }}>
              {fmtTime(solvedTime ?? 0)} · {mistakes} mistakes · {hintsUsed} hints
            </Text>
            <Text style={{ color: theme.accent, fontWeight: '800', marginTop: 8 }}>
              +{adClaimed ? coinBreakdown.total * 2 : coinBreakdown.total} coins
            </Text>
            <View style={{ gap: 10, marginTop: 14, width: '100%' }}>
              {mode !== 'daily' && <Btn theme={theme} variant="primary" onPress={nextLevel}>Next →</Btn>}
              {!adClaimed && <Btn theme={theme} onPress={() => setAdKind('double_coins')}>📺 Double Coins</Btn>}
              <Btn theme={theme} variant="ghost" onPress={() => go({ screen: 'home' })}>Home</Btn>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rewarded ad sheet */}
      <Modal transparent visible={!!adKind} animationType="slide" onRequestClose={() => setAdKind(null)}>
        <View style={[styles.overlay, { justifyContent: 'flex-end' }]}>
          <View style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.gridLine }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {adKind === 'hint' ? 'Out of Hints' : 'Double Your Gold'}
            </Text>
            <Text style={{ color: theme.muted, marginBottom: 12 }}>
              {adKind === 'hint' ? 'Watch a short video to earn a hint.' : `Watch a video for +${coinBreakdown.total} coins.`}
            </Text>
            <View style={{ gap: 10 }}>
              <Btn
                theme={theme}
                variant="primary"
                onPress={async () => {
                  const kind = adKind;
                  const ok = await ads.showRewarded(kind === 'hint' ? 'extra_hint' : 'double_coins');
                  setAdKind(null);
                  if (!ok) return;
                  if (kind === 'double_coins') { update((p) => void (p.coins += coinBreakdown.total)); setAdClaimed(true); }
                  else { update((p) => void (p.hints += 1)); revealHint(); }
                }}
              >
                📺 Watch Ad
              </Btn>
              <Btn theme={theme} variant="ghost" onPress={() => setAdKind(null)}>No Thanks</Btn>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function overlaps(a: Rect, b: Rect) { return a.c < b.c + b.w && a.c + a.w > b.c && a.r < b.r + b.h && a.r + a.h > b.r; }
function cap(s: string) { return s[0]!.toUpperCase() + s.slice(1); }
function dayGap(a: string, b: string) { return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86_400_000); }

const styles = StyleSheet.create({
  page: { padding: 16, paddingTop: 56, paddingBottom: 40 },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '900', textAlign: 'center', marginTop: 8, letterSpacing: 1 },
  controls: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal: { borderRadius: 22, borderWidth: 1, padding: 24, width: '100%', maxWidth: 380 },
  sheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, borderWidth: 1, padding: 22, width: '100%' },
  modalTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginTop: 8 },
});
