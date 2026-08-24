import { useMemo } from 'react';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, Spacing, FontSize  } from '@/constants/Colors';

interface Props {
  icono: keyof typeof Ionicons.glyphMap;
  titulo: string;
  subtitulo: string;
}

export function EstadoVacio({ icono, titulo, subtitulo }: Props) {
  const Colors = useThemeColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  return (
    <View style={styles.container}>
      <Ionicons name={icono} size={52} color={Colors.textSecondary} style={styles.icono} />
      <Text style={styles.titulo}>{titulo}</Text>
      <Text style={styles.subtitulo}>{subtitulo}</Text>
    </View>
  );
}

const makeStyles = (Colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: Spacing.sm,
  },
  icono: {
    marginBottom: Spacing.md,
  },
  titulo: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 22,
  },
});
