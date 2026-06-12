import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { levelFromXp } from '@shikaku/rewards';
import { useApp } from '../ctx';
import { Btn, Card, Pill, fmtTime } from '../ui';

export function Stats() {
  const { profile, theme, go } = useApp();
  const s = profile.stats;
  const lvl = levelFromXp(profile.xp);
  const avg = s.puzzlesSolved > 0 ? Math.round(s.totalTimeSeconds / s.puzzlesSolved) : 0;
  const rows: Array<[string, string]> = [
    ['Puzzles Solved', String(s.puzzlesSolved)],
    ['Perfect Solves', String(s.perfectSolves)],
    ['Hints Used', String(s.hintsUsed)],
    ['Average Time', s.puzzlesSolved ? fmtTime(avg) : '—'],
    ['Best Time', s.bestTimeSeconds == null ? '—' : fmtTime(s.bestTimeSeconds)],
    ['Current Streak', `${profile.streak.current} days`],
    ['Longest Streak', `${profile.streak.longest} days`],
  ];
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.topbar}>
        <Btn theme={theme} variant="ghost" onPress={() => go({ screen: 'home' })}>‹ Back</Btn>
        <Pill theme={theme}>🪙 {profile.coins}</Pill>
      </View>
      <Text style={[styles.title, { color: theme.text }]}>Statistics</Text>
      <Card theme={theme}>
        <Text style={{ color: theme.text, fontWeight: '700', fontSize: 16 }}>Level {lvl.level}</Text>
        <Text style={{ color: theme.muted }}>{lvl.xpIntoLevel} / {lvl.xpForNext} XP</Text>
      </Card>
      {rows.map(([k, v]) => (
        <Card key={k} theme={theme}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: theme.text }}>{k}</Text>
            <Text style={{ color: theme.accent, fontWeight: '800' }}>{v}</Text>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, paddingTop: 56, paddingBottom: 96 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
});
