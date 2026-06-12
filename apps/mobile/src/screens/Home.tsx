import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Modal, StyleSheet } from 'react-native';
import { dateKey, type Difficulty } from '@shikaku/game-engine';
import { claimLoginReward, LOGIN_CYCLE, levelFromXp } from '@shikaku/rewards';
import { loadSavedGame, type SavedGame } from '@shikaku/storage';
import { useApp } from '../ctx';
import { Btn, Card, Pill } from '../ui';

const DIFFS: Array<{ id: Difficulty; label: string; size: string }> = [
  { id: 'easy', label: 'Easy', size: '6×6 → 7×7' },
  { id: 'medium', label: 'Medium', size: '8×8 → 9×9' },
  { id: 'hard', label: 'Hard', size: '10×10 → 12×12' },
  { id: 'expert', label: 'Expert', size: '14×14+' },
];

export function Home() {
  const { profile, update, store, theme, go } = useApp();
  const lvl = levelFromXp(profile.xp);
  const today = dateKey(new Date());
  const dailyDone = profile.streak.lastDailyKey === today;
  const [saved, setSaved] = useState<SavedGame | null>(null);
  useEffect(() => { void loadSavedGame(store).then(setSaved); }, [store]);

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.topbar}>
        <Pill theme={theme}>🪙 {profile.coins}</Pill>
        <Pill theme={theme}>⭐ Lvl {lvl.level}</Pill>
        <Pill theme={theme}>🔥 {profile.streak.current}</Pill>
      </View>

      <Text style={[styles.brand, { color: theme.accent }]}>SHIKAKU MASTER</Text>
      <Text style={{ color: theme.muted, textAlign: 'center', marginTop: 4 }}>The Art of Logical Geometry</Text>

      {saved && (
        <Card theme={theme} onPress={() => go({ screen: 'game', mode: saved.mode as Difficulty | 'daily', level: saved.level ?? undefined })} style={{ borderColor: theme.accent }}>
          <Text style={[styles.cardLabel, { color: theme.text }]}>▶ Continue</Text>
          <Text style={{ color: theme.muted }}>{saved.label} · {saved.placed.length} placed</Text>
        </Card>
      )}

      <Card theme={theme} onPress={() => go({ screen: 'game', mode: 'daily' })}>
        <Text style={[styles.cardLabel, { color: theme.text }]}>📅 Daily Challenge {dailyDone ? '✓' : ''}</Text>
        <Text style={{ color: theme.muted }}>{dailyDone ? `Streak: ${profile.streak.current} days` : 'Win special rewards today'}</Text>
      </Card>

      <Text style={[styles.section, { color: theme.text }]}>Difficulty</Text>
      {DIFFS.map((d) => (
        <Card key={d.id} theme={theme} onPress={() => go({ screen: 'levels', difficulty: d.id })}>
          <Text style={[styles.cardLabel, { color: theme.text }]}>{d.label}</Text>
          <Text style={{ color: theme.muted }}>{d.size}</Text>
        </Card>
      ))}

      {profile.onboarded ? null : (
        <Modal transparent visible animationType="fade">
          <View style={styles.overlay}>
            <View style={[styles.modal, { backgroundColor: theme.surface, borderColor: theme.gridLine }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>How to Play</Text>
              <Text style={{ color: theme.muted, marginVertical: 10 }}>
                Divide the grid into rectangles. Each rectangle holds exactly one number, and that number equals its area. Fill the whole grid with no overlaps.
              </Text>
              <Btn theme={theme} variant="primary" onPress={() => update((p) => void (p.onboarded = true))}>Got it</Btn>
            </View>
          </View>
        </Modal>
      )}

      {profile.onboarded && <DailyLogin today={today} />}
    </ScrollView>
  );
}

function DailyLogin({ today }: { today: string }) {
  const { profile, update, theme } = useApp();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const r = claimLoginReward({ lastLoginRewardKey: profile.streak.lastLoginRewardKey, loginCycleDay: profile.streak.loginCycleDay }, today);
    if (r.claimable) setOpen(true);
  }, [today, profile.streak.lastLoginRewardKey, profile.streak.loginCycleDay]);
  if (!open) return null;
  function claim() {
    update((p) => {
      const r = claimLoginReward({ lastLoginRewardKey: p.streak.lastLoginRewardKey, loginCycleDay: p.streak.loginCycleDay }, today);
      if (!r.claimable || !r.reward) return;
      p.streak.lastLoginRewardKey = r.lastLoginRewardKey;
      p.streak.loginCycleDay = r.loginCycleDay;
      if (r.reward.kind === 'coins') p.coins += r.reward.amount;
      else if (r.reward.kind === 'hint') p.hints += r.reward.amount;
      else p.coins += 100;
    });
    setOpen(false);
  }
  return (
    <Modal transparent visible animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: theme.surface, borderColor: theme.gridLine }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Daily Login Reward</Text>
          <Text style={{ color: theme.muted, marginVertical: 10 }}>Day {profile.streak.loginCycleDay + 1} of {LOGIN_CYCLE.length} — claim today&apos;s bonus.</Text>
          <Btn theme={theme} variant="primary" onPress={claim}>CLAIM</Btn>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, paddingTop: 56, paddingBottom: 96 },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 12 },
  brand: { fontSize: 28, fontWeight: '900', textAlign: 'center', marginTop: 12, letterSpacing: 1 },
  section: { fontSize: 16, fontWeight: '700', marginTop: 22, marginBottom: 2 },
  cardLabel: { fontSize: 17, fontWeight: '700', marginBottom: 2 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal: { borderRadius: 22, borderWidth: 1, padding: 24, width: '100%', maxWidth: 380 },
  modalTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
});
