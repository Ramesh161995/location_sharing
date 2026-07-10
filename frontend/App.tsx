import React from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { lightTheme, darkTheme, NavigationLight, NavigationDark } from './src/theme/index';

function AppContent() {
  const { theme: themeContext } = useTheme();
  const paperTheme = themeContext.isDark ? darkTheme : lightTheme;
  const navigationTheme = themeContext.isDark ? NavigationDark : NavigationLight;

  return (
    <PaperProvider theme={paperTheme}>
      <NavigationContainer theme={navigationTheme}>
        <StatusBar style={themeContext.isDark ? 'light' : 'dark'} />
        <AppNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </Provider>
    </SafeAreaProvider>
  );
}
