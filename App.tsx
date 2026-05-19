import './src/polyfills';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppProvider }      from './src/context/AppContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider }     from './src/context/AuthContext';
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
      <AuthProvider>
        <AppProvider>
          <ThemedStatusBar />
          <AppNavigator />
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
