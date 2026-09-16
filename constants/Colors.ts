import { useThemeStore } from '@/store/useThemeStore';

const darkColors = {
  bg: '#0B0B0E',
  bgCard: '#131317',
  bgCardElevated: '#171922',
  bgInput: '#15171E',
  bgGradientStart: '#08080A',
  bgGradientEnd: '#0B0B0E',
  glassBorder: 'rgba(255,255,255,0.06)',
  glassBorderFocus: 'rgba(245,158,11,0.5)',
  primary: '#F59E0B',
  primaryLight: '#FBBF24',
  primaryMuted: 'rgba(245,158,11,0.15)',
  primaryDark: '#D97706',
  primaryContainer: '#F59E0B',
  goldCta: '#E7A83D',
  heroCardStart: '#1F1A14',
  heroCardEnd: '#111114',
  heroCardBorder: 'rgba(245,158,11,0.3)',
  success: '#10B981',
  successMuted: 'rgba(16,185,129,0.15)',
  danger: '#EF4444',
  dangerMuted: 'rgba(239,68,68,0.15)',
  warning: '#F59E0B',
  warningMuted: 'rgba(245,158,11,0.15)',
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  border: '#212128',
  borderFocus: '#F59E0B',
  iconGlow: 'rgba(245,158,11,0.2)',
  leather: '#271E18',
  cardThumbnailBg: '#1E2029',
  cardBorder: 'rgba(255,255,255,0.07)',
  pillBg: '#171922',
  pillBorder: 'rgba(255,255,255,0.06)',
  pillText: '#D4D4D8',
  pillActiveBg: '#E7A83D',
  pillActiveText: '#0B0B0E',
};

const lightColors: typeof darkColors = {
  bg: '#F8F9FA',
  bgCard: '#FFFFFF',
  bgCardElevated: '#FFFFFF',
  bgInput: '#F0F2F5',
  bgGradientStart: '#FFFFFF',
  bgGradientEnd: '#F4F5F7',
  glassBorder: 'rgba(0,0,0,0.08)',
  glassBorderFocus: 'rgba(217,119,6,0.4)',
  primary: '#D97706',
  primaryLight: '#F59E0B',
  primaryMuted: 'rgba(217,119,6,0.12)',
  primaryDark: '#92400E',
  primaryContainer: '#FEF3C7',
  goldCta: '#D97706',
  heroCardStart: '#FFFFFF',
  heroCardEnd: '#FDF8F0',
  heroCardBorder: 'rgba(217,119,6,0.25)',
  success: '#059669',
  successMuted: 'rgba(5,150,105,0.12)',
  danger: '#DC2626',
  dangerMuted: 'rgba(220,38,38,0.12)',
  warning: '#D97706',
  warningMuted: 'rgba(217,119,6,0.12)',
  textPrimary: '#09090B',
  textSecondary: '#52525B',
  textMuted: '#71717A',
  border: '#E4E4E7',
  borderFocus: '#D97706',
  iconGlow: 'rgba(217,119,6,0.1)',
  leather: '#F5ECE4',
  cardThumbnailBg: '#F4F4F5',
  cardBorder: 'rgba(0,0,0,0.07)',
  pillBg: '#EDEDF0',
  pillBorder: 'rgba(0,0,0,0.06)',
  pillText: '#52525B',
  pillActiveBg: '#D97706',
  pillActiveText: '#FFFFFF',
};

export function useThemeColors() {
  const theme = useThemeStore((state) => state.theme);
  return theme === 'light' ? lightColors : darkColors;
}

export function useTheme() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const Colors = theme === 'light' ? lightColors : darkColors;
  return { Colors, theme, isDark: theme === 'dark', toggleTheme };
}

export type ThemeColors = typeof darkColors;

export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };
export const Radius = { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 };
export const FontSize = { xs: 11, sm: 13, md: 15, lg: 18, xl: 22, xxl: 28, hero: 36 };
