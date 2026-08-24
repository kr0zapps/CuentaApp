import { useMemo } from 'react';
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, Spacing, Radius, FontSize  } from '@/constants/Colors';
import { formatCLP } from '@/utils/formatCLP';

interface Props {
  titulo: string;
  monto: number;
  icono: keyof typeof Ionicons.glyphMap;
  color?: string;
  style?: ViewStyle;
  oculto?: boolean;
}

export function TarjetaMonto({ titulo, monto, icono, color, style, oculto }: Props) {
  const Colors = useThemeColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const esPositivo = monto >= 0;
  const colorMonto = color ?? (esPositivo ? Colors.success : Colors.danger);

  return (
    <View style={[styles.card, style]}>
      <View style={[styles.iconoWrapper, { backgroundColor: colorMonto + '22' }]}>
        <Ionicons name={icono} size={20} color={colorMonto} style={styles.icono} />
      </View>
      <Text style={styles.titulo} numberOfLines={1}>{titulo}</Text>
      <Text style={[styles.monto, { color: colorMonto }]}>
        {oculto ? '••••••••' : formatCLP(monto)}
      </Text>
    </View>
  );
}

const makeStyles = (Colors: any) => StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  iconoWrapper: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icono: {},
  titulo: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  monto: {
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
});
