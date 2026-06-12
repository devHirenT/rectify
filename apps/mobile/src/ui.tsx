import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useApp, type Nav } from './ctx';
import { getSoundManager, toAudioSettings } from './audio';
import type { NativeTheme } from './theme';

/** Soft click + light haptic for any tappable UI element. */
function useUiFeedback() {
  const { profile } = useApp();
  return () => {
    getSoundManager(toAudioSettings(profile.settings)).play('uiTap');
    if (profile.settings.hapticsEnabled) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
}

export function Pill({ theme, children }: { theme: NativeTheme; children: React.ReactNode }) {
  return (
    <View style={[styles.pill, { backgroundColor: theme.surface, borderColor: theme.gridLine }]}>
      <Text style={{ color: theme.text, fontWeight: '600' }}>{children}</Text>
    </View>
  );
}

export function Btn({
  theme,
  children,
  onPress,
  disabled,
  variant = 'secondary',
}: {
  theme: NativeTheme;
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}) {
  const feedback = useUiFeedback();
  const bg =
    variant === 'primary' ? theme.accent : variant === 'secondary' ? theme.surface : 'transparent';
  const color =
    variant === 'primary' ? '#002665' : variant === 'danger' ? theme.bad : theme.text;
  const border = variant === 'danger' ? theme.bad : variant === 'ghost' ? 'transparent' : theme.gridLine;
  return (
    <TouchableOpacity
      onPress={() => {
        feedback();
        onPress();
      }}
      disabled={disabled}
      style={[styles.btn, { backgroundColor: bg, borderColor: border, opacity: disabled ? 0.4 : 1 }]}
    >
      <Text style={{ color, fontWeight: '700' }}>{children}</Text>
    </TouchableOpacity>
  );
}

export function Card({
  theme,
  children,
  onPress,
  style,
}: {
  theme: NativeTheme;
  children: React.ReactNode;
  onPress?: () => void;
  style?: object;
}) {
  const feedback = useUiFeedback();
  const inner = (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.gridLine }, style]}>{children}</View>
  );
  return onPress ? (
    <TouchableOpacity
      onPress={() => {
        feedback();
        onPress();
      }}
    >
      {inner}
    </TouchableOpacity>
  ) : inner;
}

export function Stars({ value, theme, size = 14 }: { value: number; theme: NativeTheme; size?: number }) {
  return (
    <Text style={{ fontSize: size, letterSpacing: 2 }}>
      <Text style={{ color: '#efc140' }}>{'★'.repeat(value)}</Text>
      <Text style={{ color: theme.gridLine }}>{'★'.repeat(Math.max(0, 3 - value))}</Text>
    </Text>
  );
}

const NAV: Array<{ label: string; icon: string; nav: Nav }> = [
  { label: 'Play', icon: '▶', nav: { screen: 'home' } },
  { label: 'Store', icon: '🛍', nav: { screen: 'themes' } },
  { label: 'Awards', icon: '🏅', nav: { screen: 'achievements' } },
  { label: 'Settings', icon: '⚙', nav: { screen: 'settings' } },
];

export function BottomNav() {
  const { theme, nav, go } = useApp();
  const feedback = useUiFeedback();
  const isActive = (n: Nav) =>
    n.screen === 'home'
      ? nav.screen === 'home' || nav.screen === 'levels' || nav.screen === 'game'
      : nav.screen === n.screen;
  return (
    <View style={[styles.bottomnav, { backgroundColor: theme.surface, borderTopColor: theme.gridLine }]}>
      {NAV.map((n) => {
        const active = isActive(n.nav);
        return (
          <TouchableOpacity key={n.label} style={styles.navitem} onPress={() => { feedback(); go(n.nav); }}>
            <Text style={{ fontSize: 18, color: active ? theme.accent : theme.muted }}>{n.icon}</Text>
            <Text style={{ fontSize: 11, color: active ? theme.accent : theme.muted }}>{n.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function fmtTime(s: number): string {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  pill: { borderRadius: 999, borderWidth: 1, paddingVertical: 8, paddingHorizontal: 14 },
  btn: { borderRadius: 14, borderWidth: 1, paddingVertical: 13, paddingHorizontal: 18, alignItems: 'center', width: '100%' },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 12 },
  bottomnav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingBottom: 22,
    borderTopWidth: 1,
  },
  navitem: { alignItems: 'center', gap: 2, paddingHorizontal: 12 },
});
