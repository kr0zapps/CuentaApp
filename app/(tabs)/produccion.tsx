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
  TextInput
} from 'react-native';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors, Spacing, Radius, FontSize } from '@/constants/Colors';
import { CampoTexto } from '@/components/ui/CampoTexto';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Stepper } from '@/components/ui/Stepper';
import { useProduccionStore } from '@/store/useProduccionStore';
import { useVentasStore } from '@/store/useVentasStore';
import { useToastStore } from '@/store/useToastStore';
import { useConfirmStore } from '@/store/useConfirmStore';
import { formatCLP, parseCLP, formatCurrencyInput } from '@/utils/formatCLP';

export default function ProduccionScreen() {
  const Colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(Colors, insets), [Colors, insets]);
  const { items, addItem, updateItem, removeItem, toggleStock, updateStock } = useProduccionStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'todos' | 'en_stock'>('todos');
  
  // Create/Edit Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ producto: '', precioVenta: '' });
  const [cantidad, setCantidad] = useState(1);

  // Sell Modal State
  const [sellModalVisible, setSellModalVisible] = useState(false);
  const [sellItem, setSellItem] = useState<any>(null);
  const [sellCantidad, setSellCantidad] = useState(1);
  const [sellCliente, setSellCliente] = useState('');

  const handleOpenNew = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditId(null);
    setForm({ producto: '', precioVenta: '' });
    setCantidad(1);
    setModalVisible(true);
  };

  const handleClose = () => {
    setModalVisible(false);
    setEditId(null);
  };

  const handleSave = () => {
    if (!form.producto.trim()) {
      useToastStore.getState().showToast('El nombre del producto es obligatorio', 'error');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    const precio = form.precioVenta ? parseCLP(form.precioVenta) : 0;
    
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (editId) {
      const existing = items.find(i => i.id === editId);
      updateItem(editId, {
        producto: form.producto.trim(),
        cantidad: cantidad,
        precioVenta: precio,
        enStock: existing ? existing.enStock : true,
      });
    } else {
      addItem({
        producto: form.producto.trim(),
        cantidad: cantidad,
        precioVenta: precio,
        enStock: true,
      });
    }
    
    useToastStore.getState().showToast('Producto guardado correctamente', 'success');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    handleClose();
  };

  const handleDuplicate = (item: any) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    addItem({
      producto: item.producto,
      cantidad: item.cantidad,
      precioVenta: item.precioVenta,
      enStock: true,
    });
    useToastStore.getState().showToast('Producto duplicado', 'success');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDelete = (id: string) => {
    useConfirmStore.getState().showConfirm({
      title: 'Eliminar Producto',
      message: '¿Estás seguro de que deseas eliminar este producto permanentemente del inventario?',
      confirmText: 'Eliminar',
      isDestructive: true,
      onConfirm: () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        removeItem(id);
      },
    });
  };

  const handleSell = () => {
    if (!sellItem) return;
    const precio = sellItem.precioVenta || 0;
    if (precio <= 0) {
      useToastStore.getState().showToast('Este producto no tiene precio de venta.', 'error');
      return;
    }
    
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    useVentasStore.getState().addVenta({
      productoId: sellItem.id,
      producto: sellItem.producto,
      cantidad: sellCantidad,
      precioUnitario: precio,
      cliente: sellCliente.trim(),
    });
    updateStock(sellItem.id, sellItem.cantidad - sellCantidad);
    
    useToastStore.getState().showToast(`${sellCantidad}x vendido exitosamente`, 'success');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSellModalVisible(false);
    setSellItem(null);
  };

  const filteredItems = useMemo(() => {
    let result = items;
    if (filterMode === 'en_stock') {
      result = result.filter(i => i.enStock);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => i.producto.toLowerCase().includes(q));
    }
    return result;
  }, [items, filterMode, searchQuery]);

  const renderItem = ({ item }: { item: any }) => {
    const isLowStock = item.cantidad <= 2 && item.enStock;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <View>
              <Text style={styles.productName}>{item.producto}</Text>
              <Text style={styles.dateText}>Actualizado: {new Date(item.fecha).toLocaleString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            {isLowStock && (
              <View style={styles.badgeLowStock}>
                <Text style={styles.badgeLowStockText}>Bajo</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={() => {
            setEditId(item.id);
            setForm({
              producto: item.producto,
              precioVenta: item.precioVenta ? item.precioVenta.toString() : '',
            });
            setCantidad(item.cantidad);
            setModalVisible(true);
          }} hitSlop={{top:10,right:10,bottom:10,left:10}}>
            <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.cardMetrics}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>PRECIO</Text>
            <Text style={styles.metricValue}>{item.precioVenta ? formatCLP(item.precioVenta) : '--'}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>STOCK</Text>
            <Text style={[styles.metricValue, { color: item.cantidad === 0 ? Colors.danger : Colors.textPrimary }]}>{item.cantidad}</Text>
          </View>
          <View style={[styles.metricItem, { alignItems: 'flex-end' }]}>
            <Text style={styles.metricLabel}>ESTADO</Text>
            <TouchableOpacity 
              style={[styles.statusToggle, item.enStock ? styles.statusInStock : styles.statusSold]}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                toggleStock(item.id);
              }}>
              <Text style={[styles.statusText, item.enStock ? styles.statusTextInStock : styles.statusTextSold]}>
                {item.enStock ? 'Disponible' : 'Agotado'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardActions}>
          {item.enStock && item.cantidad > 0 ? (
            <TouchableOpacity 
              style={styles.venderBtn}
              onPress={() => {
                setSellItem(item);
                setSellCantidad(1);
                setSellCliente('');
                setSellModalVisible(true);
              }}>
              <Text style={styles.venderBtnText}>Vender Rápidamente</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyActionSpace} />
          )}
          
          <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => handleDuplicate(item)}>
              <Ionicons name="copy-outline" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item.id)}>
              <Ionicons name="trash-outline" size={18} color={Colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.bg, (Colors as any).bgGradientEnd || Colors.bg]} style={StyleSheet.absoluteFill} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Inventario</Text>
        <Text style={styles.subtitle}>{items.length} productos registrados</Text>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar productos..."
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
        <View style={styles.filtersRow}>
          <TouchableOpacity 
            style={[styles.filterPill, filterMode === 'todos' && styles.filterPillActive]}
            onPress={() => setFilterMode('todos')}>
            <Text style={[styles.filterText, filterMode === 'todos' && styles.filterTextActive]}>Todos</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterPill, filterMode === 'en_stock' && styles.filterPillActive]}
            onPress={() => setFilterMode('en_stock')}>
            <Text style={[styles.filterText, filterMode === 'en_stock' && styles.filterTextActive]}>Disponibles</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EstadoVacio 
            titulo="Sin productos"
            subtitulo={searchQuery ? "No se encontraron coincidencias" : "Agrega productos a tu inventario"} 
            icono="cube-outline" 
          />
        }
      />

      <TouchableOpacity style={styles.fab} onPress={handleOpenNew}>
        <Ionicons name="add" size={28} color={Colors.bg} />
      </TouchableOpacity>

      {/* CREATE/EDIT MODAL */}
      <Modal
        isVisible={modalVisible}
        onSwipeComplete={handleClose}
        swipeDirection={['down']}
        style={styles.modal}
        onBackdropPress={handleClose}
        backdropOpacity={0.5}
        animationInTiming={300}
        animationOutTiming={300}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContent}>
              <View style={styles.dragHandle} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editId ? 'Editar Producto' : 'Nuevo Producto'}</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.fieldContainer}>
                  <CampoTexto
                    label="Nombre del Producto"
                    placeholder="Ej. Cartera de Cuero"
                    value={form.producto}
                    onChangeText={(t) => setForm({ ...form, producto: t })}
                  />
                </View>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <CampoTexto
                      label="Precio Venta"
                      placeholder="$0"
                      keyboardType="numeric"
                      value={form.precioVenta}
                      onChangeText={(t) => setForm({ ...form, precioVenta: formatCurrencyInput(t) })}
                    />
                  </View>
                  <View style={{ flex: 1, paddingLeft: Spacing.md }}>
                    <Text style={styles.fieldLabel}>STOCK INICIAL</Text>
                    <View style={styles.stepperWrapper}>
                      <Stepper
                        value={cantidad}
                        onValueChange={setCantidad}
                        min={0}
                      />
                    </View>
                  </View>
                </View>
              </ScrollView>
              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Text style={styles.saveBtnText}>{editId ? 'Guardar Cambios' : 'Crear Producto'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* QUICK SELL MODAL */}
      <Modal
        isVisible={sellModalVisible}
        onSwipeComplete={() => setSellModalVisible(false)}
        swipeDirection={['down']}
        style={styles.modal}
        onBackdropPress={() => setSellModalVisible(false)}
        backdropOpacity={0.5}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContent}>
              <View style={styles.dragHandle} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Venta Rápida</Text>
                <TouchableOpacity onPress={() => setSellModalVisible(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>
              {sellItem && (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                  <View style={styles.sellItemHeader}>
                    <Text style={styles.sellItemName}>{sellItem.producto}</Text>
                    <Text style={styles.sellItemPrice}>{sellItem.precioVenta ? formatCLP(sellItem.precioVenta) : 'Sin precio'}</Text>
                  </View>
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>CANTIDAD A VENDER (Max: {sellItem.cantidad})</Text>
                    <Stepper
                      value={sellCantidad}
                      onValueChange={setSellCantidad}
                      min={1}
                      max={sellItem.cantidad}
                    />
                  </View>
                  <View style={styles.fieldContainer}>
                    <CampoTexto
                      label="Cliente (Opcional)"
                      placeholder="Ej. Juan Pérez"
                      value={sellCliente}
                      onChangeText={setSellCliente}
                    />
                  </View>
                  <View style={styles.sellTotalRow}>
                    <Text style={styles.sellTotalLabel}>Total Venta:</Text>
                    <Text style={styles.sellTotalAmount}>{formatCLP(sellCantidad * (sellItem.precioVenta || 0))}</Text>
                  </View>
                </ScrollView>
              )}
              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSell}>
                  <Text style={styles.saveBtnText}>Confirmar Venta</Text>
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
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: 4,
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
  filtersRow: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  filterPill: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgInput,
  },
  filterPillActive: {
    backgroundColor: Colors.primaryMuted,
  },
  filterText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  filterTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: insets.bottom + 120,
    paddingTop: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.bgCardElevated,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  productName: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  dateText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badgeLowStock: {
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeLowStockText: {
    fontSize: 10,
    color: Colors.warning,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cardMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.bg,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statusToggle: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.bgInput,
  },
  statusInStock: {
    backgroundColor: Colors.success + '20',
  },
  statusSold: {
    backgroundColor: Colors.danger + '20',
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  statusTextInStock: {
    color: Colors.success,
  },
  statusTextSold: {
    color: Colors.danger,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emptyActionSpace: {
    flex: 1,
  },
  venderBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  venderBtnText: {
    color: Colors.bg,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
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
  },
  row: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
  },
  stepperWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  sellItemHeader: {
    backgroundColor: Colors.primaryMuted,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  sellItemName: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sellItemPrice: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 4,
  },
  sellTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  sellTotalLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  sellTotalAmount: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
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
