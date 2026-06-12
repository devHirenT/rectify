import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useApp } from '../ctx';
import { Btn, Pill } from '../ui';
import { THEMES } from '../theme';

const PRICE = 500;

export function Themes() {
  const { profile, update, theme, go } = useApp();
  function selectOrBuy(id: string, free: boolean) {
    const owned = profile.unlockedThemes.includes(id);
    if (owned) { update((p) => void (p.activeTheme = id)); return; }
    if (free) { update((p) => { p.unlockedThemes.push(id); p.activeTheme = id; }); return; }
    if (profile.coins >= PRICE) update((p) => { p.coins -= PRICE; p.unlockedThemes.push(id); p.activeTheme = id; });
  }
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.topbar}>
        <Btn theme={theme} variant="ghost" onPress={() => go({ screen: 'home' })}>‹ Back</Btn>
        <Pill theme={theme}>🪙 {profile.coins}</Pill>
      </View>
      <Text style={[styles.title, { color: theme.text }]}>Theme Store</Text>
      <View style={styles.grid}>
        {THEMES.map((t) => {
          const owned = profile.unlockedThemes.includes(t.id);
          const active = profile.activeTheme === t.id;
          return (
            <TouchableOpacity key={t.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: active ? theme.accent : theme.gridLine }]} onPress={() => selectOrBuy(t.id, t.free)}>
              <View style={{ height: 50, borderRadius: 10, backgroundColor: t.bg, borderWidth: 2, borderColor: t.accent, flexDirection: 'row', alignItems: 'flex-end', padding: 6, gap: 4 }}>
                <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: t.accent }} />
                <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: t.good }} />
              </View>
              <Text style={{ color: theme.text, fontWeight: '700', marginTop: 8 }}>{t.name}</Text>
              <Text style={{ color: theme.muted, fontSize: 12 }}>
                {active ? '✓ Active' : owned ? 'Tap to apply' : t.free ? 'Free' : `🪙 ${PRICE}`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, paddingTop: 56, paddingBottom: 96 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  card: { width: '47%', borderRadius: 16, borderWidth: 1, padding: 12 },
});
