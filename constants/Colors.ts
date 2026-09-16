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
