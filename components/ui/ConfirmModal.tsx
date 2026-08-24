import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useConfirmStore } from '@/store/useConfirmStore';
import { useThemeColors, Spacing, Radius, FontSize } from '@/constants/Colors';

export function ConfirmModal() {
  const { visible, title, message, confirmText, cancelText, isDestructive, onConfirm, hideConfirm } = useConfirmStore();
  const Colors = useThemeColors();

  const handleConfirm = () => {
    Haptics.impactAsync(isDestructive ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium);
    onConfirm();
    hideConfirm();
  };

  const handleCancel = () => {
    hideConfirm();
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={handleCancel}
      onSwipeComplete={handleCancel}
      swipeDirection={['down']}
      animationIn="fadeInUp"
      animationOut="fadeOutDown"
      backdropOpacity={0.6}
      style={styles.modal}
    >
      <View style={[styles.container, { backgroundColor: Colors.bgCardElevated }]}>
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, { backgroundColor: isDestructive ? Colors.danger + '20' : Colors.primary + '20' }]}>
            <Ionicons 
              name={isDestructive ? 'warning' : 'help-circle'} 
              size={32} 
              color={isDestructive ? Colors.danger : Colors.primary} 
            />
          </View>
        </View>

        <Text style={[styles.title, { color: Colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.message, { color: Colors.textSecondary }]}>{message}</Text>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.btn, styles.btnCancel, { backgroundColor: Colors.bgInput }]} onPress={handleCancel}>
            <Text style={[styles.btnText, { color: Colors.textPrimary }]}>{cancelText}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.btn, styles.btnConfirm, { backgroundColor: isDestructive ? Colors.danger : Colors.primary }]} 
            onPress={handleConfirm}
          >
            <Text style={[styles.btnText, { color: Colors.bg }]}>{confirmText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  container: {
    width: '100%',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: Spacing.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: FontSize.md,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  btn: {
    flex: 1,
    height: 52,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCancel: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  btnConfirm: {
  },
  btnText: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
