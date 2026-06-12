import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import type { Difficulty } from '@shikaku/game-engine';
import { useApp } from '../ctx';
import { Btn, Pill, Stars } from '../ui';

const LEVELS_PER_BAND = 28;

export function LevelSelect({ difficulty }: { difficulty: Difficulty }) {
  const { profile, theme, go } = useApp();
  const doneCount = profile.completedLevels[difficulty]?.length ?? 0;

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.topbar}>
        <Btn theme={theme} variant="ghost" onPress={() => go({ screen: 'home' })}>‹ Back</Btn>
        <Text style={[styles.title, { color: theme.text }]}>{difficulty.toUpperCase()}</Text>
        <Pill theme={theme}>🪙 {profile.coins}</Pill>
      </View>
      <Text style={{ color: theme.muted, marginBottom: 12 }}>{doneCount} / {LEVELS_PER_BAND} Completed</Text>

      <View style={styles.grid}>
        {Array.from({ length: LEVELS_PER_BAND }, (_, i) => {
          const n = i + 1;
          const completed = n <= doneCount;
          const unlocked = n <= doneCount + 1;
          const stars = profile.starsByLevel[`${difficulty}-${n}`] ?? 0;
          const current = unlocked && !completed;
          return (
            <TouchableOpacity
              key={n}
              disabled={!unlocked}
              onPress={() => go({ screen: 'game', mode: difficulty, level: n })}
              style={[
                styles.node,
                {
                  backgroundColor: completed ? theme.good + '22' : current ? theme.accent : theme.surface,
                  borderColor: completed ? theme.good : current ? theme.accent : theme.gridLine,
                  opacity: unlocked ? 1 : 0.45,
                },
              ]}
            >
              <Text style={{ color: completed ? theme.good : current ? '#002665' : theme.text, fontWeight: '800' }}>
                {unlocked ? n : '🔒'}
              </Text>
              {completed && stars > 0 && <Stars value={stars} theme={theme} size={9} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, paddingTop: 56, paddingBottom: 96 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  node: { width: '21%', aspectRatio: 1, borderRadius: 999, borderWidth: 2, alignItems: 'center', justifyContent: 'center', gap: 2 },
});
