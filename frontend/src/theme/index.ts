import { MD3LightTheme, MD3DarkTheme, adaptNavigationTheme } from 'react-native-paper';
import { DefaultTheme as NavigationLightTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';

// Light theme colors
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2196F3',
    secondary: '#667eea',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#212121',
    onSurface: '#212121',
    onBackground: '#212121',
  },
};

// Dark theme colors
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#2196F3',
    secondary: '#764ba2',
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    onSurface: '#FFFFFF',
    onBackground: '#FFFFFF',
  },
};

// Adapt navigation themes
const { LightTheme: NavigationLight, DarkTheme: NavigationDark } = adaptNavigationTheme({
  reactNavigationLight: NavigationLightTheme,
  reactNavigationDark: NavigationDarkTheme,
});

export { NavigationLight, NavigationDark };

// Default export for backward compatibility
export const theme = lightTheme;
