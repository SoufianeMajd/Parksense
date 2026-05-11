import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppProvider }      from './src/context/AppContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AppNavigator }     from './src/navigation/AppNavigator';

const ThemedStatusBar = () => {
  const { mode, colors } = useTheme();
  return (
    <StatusBar
      style={mode === 'dark' ? 'light' : 'dark'}
      backgroundColor={colors.bg}
    />
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <ThemedStatusBar />
        <AppNavigator />
      </AppProvider>
    </ThemeProvider>
  );
}
