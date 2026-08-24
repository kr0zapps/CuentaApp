import { useThemeStore } from '@/store/useThemeStore';

const darkColors = {
  bg: '#050505',
  bgCard: '#111111',
  bgCardElevated: '#181818',
  bgInput: '#141414',
  bgGradientStart: '#050505',
  bgGradientEnd: '#0F0F0F',
  glassBorder: 'rgba(255,255,255,0.08)',
  glassBorderFocus: 'rgba(212,168,67,0.4)',
  primary: '#F2C35B',
  primaryMuted: 'rgba(212,168,67,0.15)',
  primaryDark: '#D4A843',
  primaryContainer: '#D4A843',
  success: '#4EDEA3',
  successMuted: 'rgba(78,222,163,0.15)',
  danger: '#FF8E87',
  dangerMuted: 'rgba(255,142,135,0.15)',
  warning: '#EEC058',
  warningMuted: 'rgba(238,192,88,0.15)',
  textPrimary: '#FFFFFF',
  textSecondary: '#9A8F7D',
  textMuted: 'rgba(255,255,255,0.35)',
  border: 'rgba(255,255,255,0.08)',
  borderFocus: '#D4A843',
  iconGlow: 'rgba(255,255,255,0.1)',
};

const lightColors = {
  bg: '#F8F9FA',
  bgCard: '#FFFFFF',
  bgCardElevated: '#FFFFFF',
  bgInput: '#F0F2F5',
  bgGradientStart: '#F8F9FA',
  bgGradientEnd: '#EEF0F2',
  glassBorder: 'rgba(0,0,0,0.06)',
  glassBorderFocus: 'rgba(212,168,67,0.4)',
  primary: '#D4A843',
  primaryMuted: 'rgba(212,168,67,0.12)',
  primaryDark: '#B8860B',
  primaryContainer: '#FFF8E7',
  success: '#2CA876',
  successMuted: 'rgba(44,168,118,0.12)',
  danger: '#D15850',
  dangerMuted: 'rgba(209,88,80,0.12)',
  warning: '#D4A843',
  warningMuted: 'rgba(212,168,67,0.12)',
  textPrimary: '#1A1A1A',
  textSecondary: '#6C757D',
  textMuted: 'rgba(0,0,0,0.35)',
  border: 'rgba(0,0,0,0.08)',
  borderFocus: '#D4A843',
  iconGlow: 'rgba(0,0,0,0.05)',
};

export function useThemeColors() {
  const theme = useThemeStore((state) => state.theme);
  return theme === 'light' ? lightColors : darkColors;
}

export type ThemeColors = typeof darkColors;

export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };
export const Radius = { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 };
export const FontSize = { xs: 11, sm: 13, md: 15, lg: 18, xl: 22, xxl: 28, hero: 36 };
