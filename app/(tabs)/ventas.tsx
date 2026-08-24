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
  LayoutAnimation,
  Alert,
  RefreshControl,
  TextInput
} from 'react-native';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors, Spacing, Radius, FontSize } from '@/constants/Colors';
import { CampoTexto } from '@/components/ui/CampoTexto';
import { Stepper } from '@/components/ui/Stepper';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { useVentasStore, useTotalVentasMes } from '@/store/useVentasStore';
import { useProduccionStore } from '@/store/useProduccionStore';
import { formatCLP, parseCLP, formatCurrencyInput } from '@/utils/formatCLP';
import { useThemeStore } from '@/store/useThemeStore';
import { useToastStore } from '@/store/useToastStore';
import { useConfirmStore } from '@/store/useConfirmStore';

const INITIAL_FORM = {
  productoId: null as string | null,
  producto: '',
  precioUnitario: '',
  cliente: '',
};

export default function VentasScreen() {
  const Colors = useThemeColors();
  const theme = useThemeStore((s) => s.theme);
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(Colors, insets, theme), [Colors, insets, theme]);
  
  const { ventas, addVenta, removeVenta } = useVentasStore();
  const produccionStore = useProduccionStore();
  const itemsStock = produccionStore.items.filter((i) => i.enStock);
  const totalMes = useTotalVentasMes();

  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [cantidad, setCantidad] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  }, []);

  const stockDisponible = useMemo(() => {
    if (!form.productoId) return 999;
    const item = itemsStock.find((i) => i.id === form.productoId);
    return item ? item.cantidad : 999;
  }, [form.productoId, itemsStock]);

  const handleOpenModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setForm(INITIAL_FORM);
    setCantidad(1);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setForm(INITIAL_FORM);
    setCantidad(1);
  };

  const handleProductSelect = (item: any) => {
    Haptics.selectionAsync();
    setForm((prev) => ({
      ...prev,
      producto: item.producto,
      productoId: item.id,
      precioUnitario: item.precioVenta ? formatCurrencyInput(item.precioVenta.toString()) : '',
    }));
    setCantidad(1);
  };

  const handleSave = () => {
    if (!form.producto || !form.precioUnitario) {
      useToastStore.getState().showToast('Debes ingresar el producto y el precio.', 'error');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    const precioNumerico = parseCLP(form.precioUnitario);
    if (precioNumerico <= 0) {
      useToastStore.getState().showToast('El precio debe ser mayor a 0.', 'error');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const nuevaVenta = {
      productoId: form.productoId || undefined,
      producto: form.producto.trim(),
      cantidad: cantidad,
      precioUnitario: precioNumerico,
      cliente: form.cliente.trim(),
    };

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    addVenta(nuevaVenta);
    
    if (form.productoId) {
      produccionStore.deductStock(form.productoId, cantidad);
    }
    
    useToastStore.getState().showToast('Venta registrada', 'success');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    handleCloseModal();
  };

  const handleDelete = (venta: any) => {
    useConfirmStore.getState().showConfirm({
      title: 'Eliminar Venta',
      message: `¿Estás seguro de que deseas eliminar la venta de ${venta.producto}? El stock regresará a tu inventario si aplica.`,
      confirmText: 'Eliminar',
      isDestructive: true,
      onConfirm: () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        removeVenta(venta.id);
        
        if (venta.productoId) {
          const items = produccionStore.items;
          const originalItem = items.find(i => i.id === venta.productoId);
          if (originalItem) {
            produccionStore.updateStock(venta.productoId, originalItem.cantidad + venta.cantidad);
          }
        }
      },
    });
  };

  const filteredVentas = ventas.filter((v) => {
    const q = searchQuery.toLowerCase();
    return v.producto.toLowerCase().includes(q) || (v.cliente && v.cliente.toLowerCase().includes(q));
  });

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.transactionRow}>
      <View style={styles.transactionIconContainer}>
        <Ionicons name="cash" size={20} color={Colors.bg} />
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionTitle}>{item.producto}</Text>
        <Text style={styles.transactionSubtitle}>
          {item.cantidad} x {formatCLP(item.precioUnitario)} {item.cliente ? `• ${item.cliente}` : ''}
        </Text>
        <Text style={styles.dateText}>
          {new Date(item.fecha).toLocaleString('es-CL', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      <View style={styles.transactionRight}>
        <Text style={styles.transactionAmount}>+{formatCLP(item.total)}</Text>
        <View style={styles.transactionActions}>
          <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionIcon}>
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
        <Text style={styles.title}>Ventas</Text>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Ingresos del Mes</Text>
          <Text style={styles.balanceAmount}>{formatCLP(totalMes)}</Text>
        </View>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por producto o cliente..."
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
        data={filteredVentas}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          <EstadoVacio 
            titulo="Sin ventas"
            subtitulo={searchQuery ? "No se encontraron resultados" : "Registra tu primera venta para verla aquí"} 
            icono="cash-outline" 
          />
        }
      />

      <TouchableOpacity 
        style={styles.fab}
        onPress={handleOpenModal}
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
                <Text style={styles.modalTitle}>Nueva Venta</Text>
                <TouchableOpacity onPress={handleCloseModal} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                {itemsStock.length > 0 && (
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>SELECCIONAR DEL INVENTARIO</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stockScroll}>
                      {itemsStock.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.stockCard,
                            form.productoId === item.id && styles.stockCardSelected
                          ]}
                          onPress={() => handleProductSelect(item)}
                        >
                          <Text style={[
                            styles.stockCardTitle,
                            form.productoId === item.id && styles.stockCardTitleSelected
                          ]}>{item.producto}</Text>
                          <Text style={styles.stockCardSubtitle}>{item.cantidad} disp.</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                <View style={styles.fieldContainer}>
                  <CampoTexto
                    label="Producto"
                    placeholder="Ej. Bolso de Cuero"
                    value={form.producto}
                    onChangeText={(t) => setForm({ ...form, producto: t, productoId: null })}
                  />
                </View>

                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <CampoTexto
                      label="Precio Unitario"
                      placeholder="$0"
                      keyboardType="numeric"
                      value={form.precioUnitario}
                      onChangeText={(t) => setForm({ ...form, precioUnitario: formatCurrencyInput(t) })}
                    />
                  </View>
                  <View style={{ flex: 1, paddingLeft: Spacing.md }}>
                    <Text style={styles.fieldLabel}>CANTIDAD</Text>
                    <Stepper
                      value={cantidad}
                      onValueChange={setCantidad}
                      min={1}
                      max={stockDisponible}
                    />
                    {form.productoId && (
                      <Text style={styles.stockInfo}>Max: {stockDisponible}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.fieldContainer}>
                  <CampoTexto
                    label="Cliente (Opcional)"
                    placeholder="Ej. Juan Pérez"
                    value={form.cliente}
                    onChangeText={(t) => setForm({ ...form, cliente: t })}
                  />
                </View>
              </ScrollView>
              
              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Text style={styles.saveBtnText}>Registrar Venta</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const makeStyles = (Colors: any, insets: any, theme: string) => StyleSheet.create({
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
    color: Colors.success,
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
    marginLeft: 52,
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
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
    marginBottom: 2,
  },
  dateText: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
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
  fieldContainer: {
    marginTop: Spacing.lg,
  },
  fieldLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
  },
  stockScroll: {
    marginHorizontal: -Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  stockCard: {
    backgroundColor: Colors.bgInput,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: 120,
  },
  stockCardSelected: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  stockCardTitle: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  stockCardTitleSelected: {
    color: Colors.primary,
  },
  stockCardSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  stockInfo: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
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
