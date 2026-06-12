import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { evaluate, type AchievementCategory, type PlayerMetrics } from '@shikaku/achievements';
import { useApp } from '../ctx';
import { Btn, Card } from '../ui';

const CATS: AchievementCategory[] = ['progress', 'skill', 'streak'];

export function Achievements() {
  const { profile, theme, go } = useApp();
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
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.topbar}>
        <Btn theme={theme} variant="ghost" onPress={() => go({ screen: 'home' })}>‹ Back</Btn>
        <Text style={{ color: theme.muted }}>{unlocked}/{all.length}</Text>
      </View>
      <Text style={[styles.title, { color: theme.text }]}>Achievements</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
        {CATS.map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => setCat(c)}
            style={{ paddingVertical: 6, paddingHorizontal: 14, borderRadius: 999, backgroundColor: cat === c ? theme.accent : theme.surface, borderWidth: 1, borderColor: theme.gridLine }}
          >
            <Text style={{ color: cat === c ? '#002665' : theme.text, fontWeight: '600' }}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {list.map((p) => (
        <Card key={p.achievement.id} theme={theme} style={{ opacity: p.unlocked ? 1 : 0.85 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontWeight: '700' }}>{p.unlocked ? '✓ ' : ''}{p.achievement.title}</Text>
              <Text style={{ color: theme.muted, fontSize: 12 }}>{p.achievement.description}</Text>
            </View>
            {!p.unlocked && <Text style={{ color: theme.muted }}>{p.current}/{p.achievement.threshold}</Text>}
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, paddingTop: 56, paddingBottom: 96 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 10 },
});
