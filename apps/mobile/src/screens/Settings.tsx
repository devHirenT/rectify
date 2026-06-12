import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { defaultProfile, type Settings as SettingsType } from '@shikaku/storage';
import { useApp } from '../ctx';
import { Btn, Card } from '../ui';

export function Settings() {
  const { profile, update, theme, go } = useApp();
  const s = profile.settings;
  const set = <K extends keyof SettingsType>(k: K, v: SettingsType[K]) => update((p) => void (p.settings[k] = v));

  const Toggle = ({ label, value, onToggle }: { label: string; value: boolean; onToggle: () => void }) => (
    <TouchableOpacity style={styles.row} onPress={onToggle}>
      <Text style={{ color: theme.text }}>{label}</Text>
      <View style={{ width: 46, height: 28, borderRadius: 999, backgroundColor: value ? theme.accent : theme.gridLine, justifyContent: 'center' }}>
        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: value ? '#002665' : theme.muted, marginLeft: value ? 21 : 3 }} />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.topbar}>
        <Btn theme={theme} variant="ghost" onPress={() => go({ screen: 'home' })}>‹ Back</Btn>
      </View>
      <Text style={[styles.title, { color: theme.text }]}>Settings</Text>

      <Text style={[styles.section, { color: theme.muted }]}>AUDIO & FEEDBACK</Text>
      <Card theme={theme}>
        <Toggle label="Sound Enabled" value={s.audioEnabled} onToggle={() => set('audioEnabled', !s.audioEnabled)} />
        <Toggle label="Haptics" value={s.hapticsEnabled} onToggle={() => set('hapticsEnabled', !s.hapticsEnabled)} />
      </Card>

      <Text style={[styles.section, { color: theme.muted }]}>ACCESSIBILITY</Text>
      <Card theme={theme}>
        <Toggle label="Colorblind Mode" value={s.colorblindMode} onToggle={() => set('colorblindMode', !s.colorblindMode)} />
        <Toggle label="High Contrast" value={s.highContrast} onToggle={() => set('highContrast', !s.highContrast)} />
        <Toggle label="Large Text" value={s.largeText} onToggle={() => set('largeText', !s.largeText)} />
        <Toggle label="Reduced Motion" value={s.reducedMotion} onToggle={() => set('reducedMotion', !s.reducedMotion)} />
        <Toggle label="Left-Hand Mode" value={s.leftHandMode} onToggle={() => set('leftHandMode', !s.leftHandMode)} />
      </Card>

      <Text style={[styles.section, { color: theme.muted }]}>DATA</Text>
      <Card theme={theme}>
        <Btn theme={theme} variant="danger" onPress={() => update((p) => Object.assign(p, defaultProfile()))}>Reset Progress</Btn>
      </Card>
      <Text style={{ color: theme.muted, textAlign: 'center', marginTop: 18 }}>Shikaku Master v1.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, paddingTop: 56, paddingBottom: 96 },
  topbar: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  section: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: 20, marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
});
