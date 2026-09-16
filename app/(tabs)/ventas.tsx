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
  const itemsStock = produccionStore.items.filter((i) => i.enStock !== false && i.cantidad > 0);
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

  const getProductIcon = (nombre: string) => {
    const n = nombre.toLowerCase();
    if (n.includes('billetera') || n.includes('cartera')) return 'wallet-outline';
    if (n.includes('llavero')) return 'key-outline';
    if (n.includes('cinturon') || n.includes('cinturón')) return 'ribbon-outline';
    if (n.includes('tarjetero')) return 'card-outline';
    return 'cash-outline';
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.transactionRow}>
      <View style={styles.transactionIconContainer}>
        <Ionicons name={getProductIcon(item.producto) as any} size={18} color="#10B981" />
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionTitle}>{item.producto}</Text>
        <Text style={styles.transactionSubtitle}>
          {item.cantidad}x {formatCLP(item.precioUnitario)} {item.cliente ? `• ${item.cliente}` : ''}
        </Text>
        <Text style={styles.dateText}>
          {new Date(item.fecha).toLocaleString('es-CL', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      <View style={styles.transactionRight}>
        <Text style={styles.transactionAmount}>+{formatCLP(item.total)}</Text>
        <TouchableOpacity
          onPress={() => handleDelete(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.deleteBtn}
        >
          <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#08080A', '#0B0B0E']} style={StyleSheet.absoluteFill} />

      {/* HEADER SECTION (Stitch) */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ventas</Text>
        <Text style={styles.headerSubtitle}>Total este mes: {formatCLP(totalMes)}</Text>

        {/* SEARCH BAR */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={16} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            placeholder="Buscar por producto o cliente..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* SALES LIST */}
      <FlatList
        data={filteredVentas}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          <EstadoVacio
            icono="cash-outline"
            titulo="No hay ventas registradas"
            subtitulo={searchQuery ? 'No encontramos coincidencias para tu búsqueda.' : 'Toca el botón + para registrar tu primera venta.'}
          />
        }
      />

      {/* FLOATING ACTION BUTTON */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleOpenModal}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#FBBF24', '#E7A83D']}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="#0B0B0E" />
        </LinearGradient>
      </TouchableOpacity>

      {/* NUEVA VENTA MODAL (Stitch exact layout) */}
      <Modal
        isVisible={modalVisible}
        onSwipeComplete={handleCloseModal}
        swipeDirection={['down']}
        style={styles.modal}
        onBackdropPress={handleCloseModal}
        backdropOpacity={0.65}
        animationInTiming={280}
        animationOutTiming={280}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContent}>
              <View style={styles.dragHandle} />

              {/* MODAL HEADER (Stitch) */}
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Nueva venta</Text>
                  <Text style={styles.modalSubtitle}>Selecciona un producto o ingresa un monto</Text>
                </View>
                <TouchableOpacity onPress={handleCloseModal} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.modalScroll}
              >
                {/* AMOUNT INPUT CARD (Stitch) */}
                <View style={styles.amountInputCard}>
                  <View style={styles.amountFieldContainer}>
                    <Text style={styles.currencyPrefix}>$</Text>
                    <TextInput
                      style={styles.amountInput}
                      placeholder="0"
                      placeholderTextColor="#71717A"
                      keyboardType="numeric"
                      value={form.precioUnitario}
                      onChangeText={(t) => setForm({ ...form, precioUnitario: formatCurrencyInput(t) })}
                    />
                  </View>

                  <View style={styles.currencyBadge}>
                    <Text style={styles.flagIcon}>🇨🇱</Text>
                    <Text style={styles.currencyCode}>CLP</Text>
                  </View>
                </View>

                {/* PRODUCTOS RÁPIDOS 2X2 GRID (Stitch Design) */}
                {itemsStock.length > 0 && (
                  <View style={styles.quickProductsSection}>
                    <Text style={styles.quickProductsLabel}>PRODUCTOS RÁPIDOS</Text>
                    <View style={styles.quickGrid}>
                      {itemsStock.slice(0, 4).map((item) => {
                        const isSelected = form.productoId === item.id;
                        return (
                          <TouchableOpacity
                            key={item.id}
                            style={[
                              styles.quickCard,
                              isSelected && styles.quickCardActive
                            ]}
                            onPress={() => handleProductSelect(item)}
                            activeOpacity={0.8}
                          >
                            <View style={styles.quickIconBox}>
                              <Ionicons name={getProductIcon(item.producto) as any} size={18} color="#F59E0B" />
                            </View>
                            <View style={styles.quickTextContainer}>
                              <Text style={styles.quickProductName} numberOfLines={1}>{item.producto}</Text>
                              <Text style={styles.quickProductPrice}>
                                {item.precioVenta ? formatCLP(item.precioVenta) : 'Sin precio'}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* PRODUCT NAME INPUT (if custom) */}
                <View style={styles.fieldSection}>
                  <CampoTexto
                    label="Nombre del producto"
                    placeholder="Ej. Billetera clásica"
                    value={form.producto}
                    onChangeText={(t) => setForm({ ...form, producto: t })}
                  />
                </View>

                {/* QUANTITY STEPPER ROW (Stitch) */}
                <View style={styles.quantityRow}>
                  <Text style={styles.quantityLabel}>Cantidad (Disponible: {stockDisponible})</Text>
                  <View style={styles.stepperWrapper}>
                    <Stepper
                      value={cantidad}
                      onValueChange={setCantidad}
                      min={1}
                      max={stockDisponible}
                    />
                  </View>
                </View>

                {/* CLIENT INPUT */}
                <View style={styles.fieldSection}>
                  <CampoTexto
                    label="Cliente (opcional)"
                    placeholder="Ej. Juan Pérez"
                    value={form.cliente}
                    onChangeText={(t) => setForm({ ...form, cliente: t })}
                  />
                </View>
              </ScrollView>

              {/* BOTTOM CTA BUTTON: CONTINUAR (Stitch) */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.continuarBtn}
                  onPress={handleSave}
                  activeOpacity={0.85}
                >
                  <Text style={styles.continuarBtnText}>Registrar Venta &gt;</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const makeStyles = (Colors: any, insets: any, theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0E',
  },

  // HEADER (Stitch)
  header: {
    paddingTop: insets.top + Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: Spacing.md,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15171E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
  },

  // LIST
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: insets.bottom + 120,
    gap: 10,
  },

  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131317',
    borderWidth: 1,
    borderColor: '#212128',
    borderRadius: 18,
    padding: 12,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(16,185,129,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  transactionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  transactionSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dateText: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10B981',
  },
  deleteBtn: {
    padding: 2,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: Spacing.xl,
    bottom: insets.bottom + 85,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#E7A83D',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // MODAL (Stitch exact layout)
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#131317',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: insets.bottom + 20,
    maxHeight: '88%',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalScroll: {
    gap: 16,
    paddingBottom: Spacing.md,
  },

  // AMOUNT INPUT CARD (Stitch)
  amountInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#14161D',
    borderWidth: 1,
    borderColor: '#212128',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  amountFieldContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyPrefix: {
    fontSize: 24,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    padding: 0,
  },
  currencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E222B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  flagIcon: {
    fontSize: 13,
  },
  currencyCode: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E2E8F0',
  },

  // QUICK PRODUCTS 2X2 GRID (Stitch)
  quickProductsSection: {
    gap: 8,
  },
  quickProductsLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickCard: {
    width: '48.5%',
    backgroundColor: '#14161D',
    borderWidth: 1,
    borderColor: '#212128',
    borderRadius: 16,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickCardActive: {
    borderColor: '#E7A83D',
    backgroundColor: '#1A1814',
  },
  quickIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1E2029',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickTextContainer: {
    flex: 1,
  },
  quickProductName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quickProductPrice: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
    marginTop: 2,
  },

  fieldSection: {
    gap: 6,
  },

  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  quantityLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  stepperWrapper: {
    width: 130,
  },

  modalFooter: {
    paddingTop: Spacing.sm,
  },
  continuarBtn: {
    backgroundColor: '#E7A83D',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continuarBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0B0B0E',
  },
});
