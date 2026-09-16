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
  TextInput
} from 'react-native';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, Spacing, Radius, FontSize } from '@/constants/Colors';
import { CampoTexto } from '@/components/ui/CampoTexto';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Stepper } from '@/components/ui/Stepper';
import { useProduccionStore } from '@/store/useProduccionStore';
import { useVentasStore } from '@/store/useVentasStore';
import { useToastStore } from '@/store/useToastStore';
import { useConfirmStore } from '@/store/useConfirmStore';
import { formatCLP, parseCLP, formatCurrencyInput } from '@/utils/formatCLP';

const STOP_WORDS = new Set(['de', 'con', 'para', 'el', 'la', 'los', 'las', 'un', 'una', 'y', 'en', 'a', 'del', 'al', 'por', 'o']);

function extractCategoryRoot(nombre: string): string {
  const words = nombre.trim().split(/\s+/).filter(w => !STOP_WORDS.has(w.toLowerCase()));
  if (words.length === 0) return 'Otros';
  let root = words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase();
  if (root.toLowerCase() === 'cinturones') root = 'Cinturón';
  else if (root.toLowerCase() === 'tarjeteros') root = 'Tarjetero';
  else if (root.endsWith('es') && root.length > 4) root = root.slice(0, -2);
  else if (root.endsWith('s') && root.length > 3 && !root.endsWith('is')) root = root.slice(0, -1);
  return root;
}

export default function ProduccionScreen() {
  const { Colors, isDark, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(Colors, insets, isDark), [Colors, insets, isDark]);
  const { items, addItem, updateItem, removeItem, toggleStock, updateStock } = useProduccionStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('Todos');

  // Dynamic reactive categories extracted from current items in inventory
  const dynamicCategorias = useMemo(() => {
    if (items.length === 0) return ['Todos'];
    const frequencyMap = new Map<string, number>();
    for (const item of items) {
      const root = extractCategoryRoot(item.producto);
      frequencyMap.set(root, (frequencyMap.get(root) || 0) + 1);
    }
    const sorted = Array.from(frequencyMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);
    return ['Todos', ...sorted];
  }, [items]);
  
  // Create/Edit Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ producto: '', precioVenta: '', categoria: 'Billeteras' });
  const [cantidad, setCantidad] = useState(1);

  // Quick Sell Modal State
  const [sellModalVisible, setSellModalVisible] = useState(false);
  const [sellItem, setSellItem] = useState<any>(null);
  const [sellCantidad, setSellCantidad] = useState(1);
  const [sellCliente, setSellCliente] = useState('');

  const handleOpenNew = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditId(null);
    setForm({ producto: '', precioVenta: '', categoria: 'Billeteras' });
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
      updateItem(editId, {
        producto: form.producto.trim(),
        cantidad: cantidad,
        precioVenta: precio,
        enStock: cantidad > 0,
      });
    } else {
      addItem({
        producto: form.producto.trim(),
        cantidad: cantidad,
        precioVenta: precio,
        enStock: cantidad > 0,
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
      enStock: item.cantidad > 0,
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
    if (selectedCategoria !== 'Todos') {
      const target = selectedCategoria.toLowerCase();
      result = result.filter(i => {
        const root = extractCategoryRoot(i.producto).toLowerCase();
        return root === target || i.producto.toLowerCase().includes(target);
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => i.producto.toLowerCase().includes(q));
    }
    return result;
  }, [items, selectedCategoria, searchQuery]);

  // Helper to pick a craft icon based on product name
  const getProductIcon = (nombre: string) => {
    const n = nombre.toLowerCase();
    if (n.includes('billetera') || n.includes('cartera')) return 'wallet-outline';
    if (n.includes('llavero')) return 'key-outline';
    if (n.includes('cinturon') || n.includes('cinturón')) return 'ribbon-outline';
    if (n.includes('tarjetero')) return 'card-outline';
    if (n.includes('banano')) return 'bag-handle-outline';
    return 'hammer-outline';
  };

  const renderItem = ({ item }: { item: any }) => {
    const isAgotado = item.cantidad <= 0;
    const isDisponible = !isAgotado && item.enStock !== false;
    const iconName = getProductIcon(item.producto);

    return (
      <View style={styles.card}>
        {/* Left: Craft Icon Box (Stitch Design) */}
        <View style={styles.cardThumbnail}>
          <Ionicons name={iconName as any} size={24} color={Colors.primary} />
        </View>

        {/* Center: Info Column */}
        <View style={styles.cardCenter}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.productName} numberOfLines={1}>{item.producto}</Text>
            
            {/* Status Pill Badge */}
            <TouchableOpacity 
              style={[
                styles.statusBadge,
                isAgotado 
                  ? styles.statusBadgeSold 
                  : (isDisponible ? styles.statusBadgeInStock : styles.statusBadgePaused)
              ]}
              onPress={() => {
                if (isAgotado) {
                  useToastStore.getState().showToast('Producto con 0 stock. Usa el "+" para agregar unidades.', 'error');
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  return;
                }
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                toggleStock(item.id);
              }}
            >
              {!isAgotado && !isDisponible && <View style={styles.pausedDot} />}
              <Text style={[
                styles.statusBadgeText,
                isAgotado 
                  ? styles.statusTextSold 
                  : (isDisponible ? styles.statusTextInStock : styles.statusTextPaused)
              ]}>
                {isAgotado ? 'Agotado' : (isDisponible ? 'Disponible' : 'Pausado')}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.productSubtitle} numberOfLines={1}>
            Cuero vacuno • Hecho a mano
          </Text>

          {/* Bottom Row: Price + Stepper + Quick Sell Button */}
          <View style={styles.cardBottomRow}>
            <Text style={styles.productPrice}>
              {item.precioVenta ? formatCLP(item.precioVenta) : 'Sin precio'}
            </Text>

            <View style={styles.cardActionsRight}>
              {/* Stepper directly on card */}
              <View style={styles.inlineStepper}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => {
                    if (item.cantidad > 0) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      updateStock(item.id, item.cantidad - 1);
                    }
                  }}
                >
                  <Ionicons name="remove" size={14} color={item.cantidad === 0 ? Colors.textMuted : Colors.textPrimary} />
                </TouchableOpacity>

                <Text style={[styles.stepperValue, { color: isAgotado ? Colors.danger : Colors.textPrimary }]}>
                  {item.cantidad}
                </Text>

                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    updateStock(item.id, item.cantidad + 1);
                  }}
                >
                  <Ionicons name="add" size={14} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Quick Sell Button on each product card */}
              <TouchableOpacity
                style={[
                  styles.cardQuickSellBtn,
                  isAgotado && styles.cardQuickSellBtnDisabled
                ]}
                activeOpacity={0.8}
                disabled={isAgotado}
                onPress={() => {
                  if (isAgotado) {
                    useToastStore.getState().showToast('Producto sin stock disponible.', 'error');
                    return;
                  }
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setSellItem(item);
                  setSellCantidad(1);
                  setSellCliente('');
                  setSellModalVisible(true);
                }}
              >
                <Ionicons name="flash" size={13} color={isAgotado ? Colors.textMuted : (isDark ? '#0B0B0E' : '#FFFFFF')} />
                <Text style={[styles.cardQuickSellText, isAgotado && styles.cardQuickSellTextDisabled]}>
                  Vender
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Action Menu (Edit / Delete) */}
        <TouchableOpacity
          style={styles.editBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          onPress={() => {
            setEditId(item.id);
            setForm({
              producto: item.producto,
              precioVenta: item.precioVenta ? item.precioVenta.toString() : '',
              categoria: 'Billeteras',
            });
            setCantidad(item.cantidad);
            setModalVisible(true);
          }}
        >
          <Ionicons name="ellipsis-vertical" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={isDark ? ['#08080A', '#0B0B0E'] : [Colors.bgGradientStart, Colors.bgGradientEnd]} 
        style={StyleSheet.absoluteFill} 
      />
      
      {/* HEADER (Stitch Design) */}
      <View style={styles.header}>
        <Text style={styles.title}>Inventario</Text>
        <Text style={styles.subtitle}>Gestiona tu stock de productos</Text>

        {/* SEARCH AND FILTER BAR */}
        <View style={styles.searchBarRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar producto..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.filterIconButton} activeOpacity={0.8} onPress={handleOpenNew}>
            <Ionicons name="add" size={20} color={isDark ? '#FFFFFF' : Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* DYNAMIC REACTIVE CATEGORY TABS */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.categoryScroll}
        >
          {dynamicCategorias.map((cat) => {
            const isSelected = selectedCategoria === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryPill,
                  isSelected && styles.categoryPillActive
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedCategoria(cat);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.categoryText, isSelected && styles.categoryTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* PRODUCT LIST */}
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

      {/* CREATE / EDIT PRODUCT MODAL */}
      <Modal
        isVisible={modalVisible}
        onSwipeComplete={handleClose}
        swipeDirection={['down']}
        style={styles.modal}
        onBackdropPress={handleClose}
        backdropOpacity={0.6}
        animationInTiming={280}
        animationOutTiming={280}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContent}>
              <View style={styles.dragHandle} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editId ? 'Editar Producto' : 'Nuevo Producto'}</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.fieldContainer}>
                  <CampoTexto
                    label="Nombre del Producto"
                    placeholder="Ej. Billetera clásica"
                    value={form.producto}
                    onChangeText={(t) => setForm({ ...form, producto: t })}
                  />
                </View>

                <View style={styles.fieldContainer}>
                  <CampoTexto
                    label="Precio de Venta"
                    placeholder="$0"
                    keyboardType="numeric"
                    value={form.precioVenta}
                    onChangeText={(t) => setForm({ ...form, precioVenta: formatCurrencyInput(t) })}
                  />
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>STOCK INICIAL</Text>
                  <Stepper
                    value={cantidad}
                    onValueChange={setCantidad}
                    min={0}
                  />
                </View>

                {editId && (
                  <View style={styles.dangerZone}>
                    <TouchableOpacity style={styles.deleteProductBtn} onPress={() => { handleClose(); handleDelete(editId); }}>
                      <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                      <Text style={styles.deleteProductText}>Eliminar producto</Text>
                    </TouchableOpacity>
                  </View>
                )}
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
        backdropOpacity={0.6}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContent}>
              <View style={styles.dragHandle} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Venta Rápida</Text>
                <TouchableOpacity onPress={() => setSellModalVisible(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {sellItem && (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                  <View style={styles.sellItemBox}>
                    <Text style={styles.sellItemName}>{sellItem.producto}</Text>
                    <Text style={styles.sellItemPrice}>
                      {sellItem.precioVenta ? formatCLP(sellItem.precioVenta) : 'Sin precio'}
                    </Text>
                  </View>

                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>CANTIDAD A VENDER (Stock: {sellItem.cantidad})</Text>
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

                  <View style={styles.sellTotalCard}>
                    <Text style={styles.sellTotalLabel}>Total a cobrar:</Text>
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

const makeStyles = (Colors: any, insets: any, isDark: boolean) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.bg,
  },

  // HEADER (Stitch)
  header: {
    paddingTop: insets.top + Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: Spacing.md,
  },

  // SEARCH AND FILTER ROW (Stitch)
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  filterIconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // CATEGORY TABS (Stitch)
  categoryScroll: {
    gap: 8,
    paddingVertical: 6,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 9999,
    backgroundColor: Colors.pillBg,
    borderWidth: 1,
    borderColor: Colors.pillBorder,
  },
  categoryPillActive: {
    backgroundColor: Colors.pillActiveBg,
    borderColor: Colors.pillActiveBg,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.pillText,
  },
  categoryTextActive: {
    color: Colors.pillActiveText,
    fontWeight: '800',
  },

  // LIST CONTENT
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: insets.bottom + 85,
    gap: 10,
  },

  // PRODUCT CARD (Stitch exact layout)
  card: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 20,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardThumbnail: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.cardThumbnailBg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardCenter: {
    flex: 1,
    minWidth: 0,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  productSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 6,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
  cardActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardQuickSellBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: isDark ? Colors.goldCta : Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  cardQuickSellBtnDisabled: {
    backgroundColor: Colors.bgInput,
    opacity: 0.5,
  },
  cardQuickSellText: {
    fontSize: 11,
    fontWeight: '800',
    color: isDark ? '#0B0B0E' : '#FFFFFF',
  },
  cardQuickSellTextDisabled: {
    color: Colors.textMuted,
  },

  // STATUS BADGE (Stitch)
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    borderWidth: 1,
  },
  statusBadgeInStock: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderColor: 'rgba(16,185,129,0.3)',
  },
  statusBadgePaused: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderColor: 'rgba(245,158,11,0.3)',
  },
  statusBadgeSold: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderColor: 'rgba(239,68,68,0.3)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusTextInStock: {
    color: Colors.success,
  },
  statusTextPaused: {
    color: Colors.warning,
  },
  statusTextSold: {
    color: Colors.danger,
  },
  pausedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.warning,
    marginRight: 4,
  },

  // INLINE STEPPER ON CARD (Stitch)
  inlineStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#1E2029' : Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  stepperBtn: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperValue: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
  },

  editBtn: {
    padding: 4,
  },

  // MODALS
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: isDark ? '#131317' : Colors.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: insets.bottom + 24,
    maxHeight: '85%',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    gap: 16,
    paddingBottom: Spacing.lg,
  },
  fieldContainer: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  dangerZone: {
    marginTop: 8,
    alignItems: 'center',
  },
  deleteProductBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  deleteProductText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  modalFooter: {
    paddingTop: Spacing.md,
  },
  saveBtn: {
    backgroundColor: Colors.goldCta,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: isDark ? '#0B0B0E' : '#FFFFFF',
  },

  // SELL MODAL
  sellItemBox: {
    backgroundColor: isDark ? '#1C1917' : Colors.bgInput,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(245,158,11,0.2)' : Colors.border,
  },
  sellItemName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sellItemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 4,
  },
  sellTotalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: isDark ? '#1E2029' : Colors.bgInput,
    borderRadius: 14,
    padding: 16,
  },
  sellTotalLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  sellTotalAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.success,
  },
});
