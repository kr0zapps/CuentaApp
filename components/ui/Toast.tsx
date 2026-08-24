import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToastStore } from '@/store/useToastStore';
import { useThemeColors, Spacing, Radius, FontSize } from '@/constants/Colors';

export function Toast() {
  const { visible, message, type, hideToast } = useToastStore();
  const Colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const translateY = React.useRef(new Animated.Value(-100)).current;

  // We use a state to unmount after animation
  const [shouldRender, setShouldRender] = React.useState(false);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.spring(translateY, {
        toValue: insets.top + Spacing.md,
        useNativeDriver: true,
        bounciness: 12,
      }).start();

      const timer = setTimeout(() => {
        hideToast();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setShouldRender(false);
      });
    }
  }, [visible]);

  if (!shouldRender) return null;

  const bgColors = {
    success: Colors.success,
    error: Colors.danger,
    info: Colors.primary,
  };

  const icons = {
    success: 'checkmark-circle',
    error: 'alert-circle',
    info: 'information-circle',
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: Colors.bgCardElevated,
          borderColor: bgColors[type],
          transform: [{ translateY }],
        },
      ]}
    >
      <Ionicons name={icons[type] as any} size={24} color={bgColors[type]} />
      <Text style={[styles.message, { color: Colors.textPrimary }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: Spacing.xl,
    right: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    gap: Spacing.md,
    zIndex: 9999,
  },
  message: {
    fontSize: FontSize.md,
    fontWeight: '600',
    flex: 1,
  },
});
