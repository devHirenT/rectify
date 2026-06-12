import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from './ctx';
import { BottomNav } from './ui';
import { Home } from './screens/Home';
import { LevelSelect } from './screens/LevelSelect';
import { Game } from './screens/Game';
import { Themes } from './screens/Themes';
import { Stats } from './screens/Stats';
import { Achievements } from './screens/Achievements';
import { Settings } from './screens/Settings';

function Router() {
  const { nav, theme } = useApp();
  const showNav = nav.screen !== 'game' && nav.screen !== 'levels';

  let screen: React.ReactNode;
  switch (nav.screen) {
    case 'home':
      screen = <Home />;
      break;
    case 'levels':
      screen = <LevelSelect difficulty={nav.difficulty} />;
      break;
    case 'game':
      screen = <Game mode={nav.mode} level={nav.level} />;
      break;
    case 'themes':
      screen = <Themes />;
      break;
    case 'stats':
      screen = <Stats />;
      break;
    case 'achievements':
      screen = <Achievements />;
      break;
    case 'settings':
      screen = <Settings />;
      break;
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <StatusBar style="auto" />
      {screen}
      {showNav && <BottomNav />}
    </View>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
