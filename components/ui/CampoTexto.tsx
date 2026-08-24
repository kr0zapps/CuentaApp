import { useMemo } from 'react';
import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, Spacing, Radius, FontSize  } from '@/constants/Colors';

interface Props {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  multiline?: boolean;
  style?: ViewStyle;
  error?: string;
}

export function CampoTexto({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  style,
  error,
}: Props) {
  const Colors = useThemeColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            error ? styles.inputError : null,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          keyboardType={keyboardType}
          returnKeyType="done"
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
        />
        {value.length > 0 && !multiline && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => onChangeText('')}
          >
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}



const makeStyles = (Colors: any) => StyleSheet.create({
  wrapper: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingRight: 40,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    minHeight: 52,
  },
  clearBtn: {
    position: 'absolute',
    right: Spacing.md,
    padding: 4,
  },
  inputMultiline: {
    minHeight: 90,
    paddingRight: Spacing.lg,
    paddingTop: Spacing.md,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: Colors.danger,
  },
  error: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    marginTop: 2,
  },
});
