import { create } from 'zustand';
import { Appearance } from 'react-native';

interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: Appearance.getColorScheme() === 'light' ? 'light' : 'dark',
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
}));
