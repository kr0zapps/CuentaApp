import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useThemeColors } from '@/constants/Colors';
import { useThemeStore } from '@/store/useThemeStore';
import { Platform, UIManager, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Toast } from '@/components/ui/Toast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function RootLayout() {
  const Colors = useThemeColors();
  const theme = useThemeStore((s) => s.theme);

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: Colors.bg }}>
        <StatusBar style={theme === 'light' ? 'dark' : 'light'} backgroundColor="transparent" translucent />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }} />
        <Toast />
        <ConfirmModal />
      </View>
    </SafeAreaProvider>
  );
}
