import { useMemo } from 'react';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeColors, Spacing, Radius, FontSize  } from '@/constants/Colors';

interface StepperProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
}

export function Stepper({ value, onValueChange, min = 1, max = 999, label }: StepperProps) {
  const Colors = useThemeColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const canDecrement = value > min;
  const canIncrement = value < max;

  function decrement() {
    if (!canDecrement) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onValueChange(value - 1);
  }

  function increment() {
    if (!canIncrement) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onValueChange(value + 1);
  }

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.stepper}>
        <TouchableOpacity
          style={[styles.btn, !canDecrement && styles.btnDisabled]}
          onPress={decrement}
          activeOpacity={0.7}
          disabled={!canDecrement}
        >
          <Ionicons name="remove" size={20} color={canDecrement ? '#000' : Colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.valueContainer}>
          <Text style={styles.value}>{value}</Text>
          {max < 999 && <Text style={styles.maxLabel}>/ {max}</Text>}
        </View>

        <TouchableOpacity
          style={[styles.btn, !canIncrement && styles.btnDisabled]}
          onPress={increment}
          activeOpacity={0.7}
          disabled={!canIncrement}
        >
          <Ionicons name="add" size={20} color={canIncrement ? '#000' : Colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (Colors: any) => StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    gap: Spacing.md,
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    backgroundColor: Colors.border,
  },
  valueContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  value: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  maxLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: '600',
  },
});
