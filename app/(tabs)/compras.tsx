import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  Alert,
  RefreshControl,
  TextInput
} from 'react-native';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useToastStore } from '@/store/useToastStore';
import { useConfirmStore } from '@/store/useConfirmStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors, Spacing, Radius, FontSize } from '@/constants/Colors';
import { CampoTexto } from '@/components/ui/CampoTexto';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { useComprasStore, useTotalComprasMes } from '@/store/useComprasStore';
import { formatCLP, parseCLP, formatCurrencyInput } from '@/utils/formatCLP';

const DEFAULT_CATEGORIES = ['Cueros', 'Herrajes', 'Hilos', 'Herramientas', 'Empaque', 'Otros'];

export default function ComprasScreen() {
  const Colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(Colors, insets), [Colors, insets]);
  const { compras, addCompra, removeCompra } = useComprasStore();
  const totalMes = useTotalComprasMes();

  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Form State
  const [categoria, setCategoria] = useState('');
  const [customCategoria, setCustomCategoria] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [monto, setMonto] = useState('');

  // Categories system
  const allCategories = useMemo(() => {
    const uniqueFromHistory = Array.from(new Set(compras.map(c => c.categoria)));
    const combined = new Set([...DEFAULT_CATEGORIES, ...uniqueFromHistory]);
    const sorted = Array.from(combined).filter(c => c !== 'Otros').sort();
    return [...sorted, 'Otros'];
  }, [compras]);

  const filteredCompras = useMemo(() => {
    return compras.filter((compra) => {
      const q = searchQuery.toLowerCase();
      return (
        compra.categoria.toLowerCase().includes(q) ||
        (compra.proveedor && compra.proveedor.toLowerCase().includes(q))
      );
    });
  }, [compras, searchQuery]);

  const resetForm = () => {
    setCategoria('');
    setCustomCategoria('');
    setProveedor('');
    setMonto('');
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    resetForm();
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  }, []);

  const handleDuplicate = (item: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCategoria(allCategories.includes(item.categoria) ? item.categoria : 'Otros');
    if (!allCategories.includes(item.categoria)) {
      setCustomCategoria(item.categoria);
    } else {
      setCustomCategoria('');
    }
    setProveedor(item.proveedor || '');
    setMonto(formatCurrencyInput(item.monto.toString()));
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    useConfirmStore.getState().showConfirm({
      title: 'Eliminar Compra',
      message: '¿Estás seguro de que deseas eliminar esta compra? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      isDestructive: true,
      onConfirm: () => removeCompra(id),
    });
  };

  const handleSave = () => {
    const numMonto = parseCLP(monto);
    const finalCategoria = categoria === 'Otros' ? customCategoria.trim() : categoria;

    if (!finalCategoria) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      useToastStore.getState().showToast('Debe seleccionar o ingresar una categoría.', 'error');
      return;
    }

    if (numMonto <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      useToastStore.getState().showToast('El monto debe ser mayor a 0.', 'error');
      return;
    }

    addCompra({
      categoria: finalCategoria,
      proveedor: proveedor.trim(),
      monto: numMonto,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    handleCloseModal();
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.transactionRow}>
      <View style={styles.transactionIconContainer}>
        <Ionicons name="cart" size={20} color={Colors.textPrimary} />
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionTitle}>{item.categoria}</Text>
        <Text style={styles.transactionSubtitle}>
          {item.proveedor ? `${item.proveedor} • ` : ''}{new Date(item.fecha).toLocaleString('es-CL', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      <View style={styles.transactionRight}>
        <Text style={styles.transactionAmount}>-{formatCLP(item.monto)}</Text>
        <View style={styles.transactionActions}>
          <TouchableOpacity onPress={() => handleDuplicate(item)} style={styles.actionIcon}>
            <Ionicons name="copy-outline" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionIcon}>
            <Ionicons name="trash-outline" size={16} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.bg, (Colors as any).bgGradientEnd || Colors.bg]} style={StyleSheet.absoluteFill} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Compras</Text>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Total Mes</Text>
          <Text style={styles.balanceAmount}>{formatCLP(totalMes)}</Text>
        </View>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar transacciones..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{top:10,bottom:10,left:10,right:10}}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredCompras}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          <EstadoVacio 
            titulo="Sin compras"
            subtitulo={searchQuery ? "No hay resultados para tu búsqueda" : "Aquí aparecerán tus gastos y compras de materiales"} 
            icono="receipt-outline" 
          />
        }
      />

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setModalVisible(true);
        }}
      >
        <Ionicons name="add" size={28} color={Colors.bg} />
      </TouchableOpacity>

      <Modal
        isVisible={modalVisible}
        onSwipeComplete={handleCloseModal}
        swipeDirection={['down']}
        style={styles.modal}
        onBackdropPress={handleCloseModal}
        backdropOpacity={0.5}
        animationInTiming={300}
        animationOutTiming={300}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContent}>
              <View style={styles.dragHandle} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nueva Compra</Text>
                <TouchableOpacity onPress={handleCloseModal} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.amountContainer}>
                  <Text style={styles.amountLabel}>MONTO</Text>
                  <TextInput
                    style={styles.amountInput}
                    keyboardType="numeric"
                    placeholder="$0"
                    placeholderTextColor={Colors.textMuted}
                    value={monto}
                    onChangeText={(t) => setMonto(formatCurrencyInput(t))}
                  />
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>PROVEEDOR (OPCIONAL)</Text>
                  <CampoTexto
                    placeholder="Ej. Casa del Cuero"
                    value={proveedor}
                    onChangeText={setProveedor}
                  />
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>CATEGORÍA</Text>
                  <View style={styles.categoryGrid}>
                    {allCategories.map(cat => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categoryPill,
                          categoria === cat && styles.categoryPillSelected
                        ]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setCategoria(cat);
                          if (cat !== 'Otros') setCustomCategoria('');
                        }}
                      >
                        <Text style={[
                          styles.categoryPillText,
                          categoria === cat && styles.categoryPillTextSelected
                        ]}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {categoria === 'Otros' && (
                  <View style={[styles.fieldContainer, { marginTop: Spacing.md }]}>
                    <CampoTexto
                      placeholder="Especificar categoría..."
                      value={customCategoria}
                      onChangeText={setCustomCategoria}
                    />
                  </View>
                )}
              </ScrollView>
              
              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Text style={styles.saveBtnText}>Guardar Transacción</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const makeStyles = (Colors: any, insets: any) => StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: insets.top + Spacing.xl,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  balanceContainer: {
    marginTop: Spacing.md,
  },
  balanceLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  balanceAmount: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.danger,
    marginTop: 2,
  },
  searchSection: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: insets.bottom + 120,
    paddingTop: Spacing.sm,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginLeft: 52, // Align with text
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  transactionInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  transactionTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  transactionSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  transactionRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  transactionAmount: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  transactionActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 4,
  },
  actionIcon: {
    padding: 2,
  },
  fab: {
    position: 'absolute',
    right: Spacing.xl,
    bottom: insets.bottom + 80,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  modal: {
    margin: 16,
    justifyContent: 'flex-end',
    marginBottom: insets.bottom + 16,
  },
  keyboardView: { flex: 1, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.bgCardElevated,
    borderRadius: Radius.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
    maxHeight: '90%',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginTop: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
    backgroundColor: Colors.bgInput,
    borderRadius: 16,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  amountContainer: {
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  amountLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  fieldContainer: {
    marginTop: Spacing.lg,
  },
  fieldLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryPill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryPillSelected: {
    backgroundColor: Colors.primaryMuted,
  },
  categoryPillText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  categoryPillTextSelected: {
    color: Colors.primary,
    fontWeight: '800',
  },
  modalFooter: {
    padding: Spacing.xl,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: Colors.bg,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
