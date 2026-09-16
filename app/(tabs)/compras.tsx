import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
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

import { useTheme, Spacing, Radius, FontSize } from '@/constants/Colors';
import { CampoTexto } from '@/components/ui/CampoTexto';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { useComprasStore, useTotalComprasMes } from '@/store/useComprasStore';
import { formatCLP, parseCLP, formatCurrencyInput } from '@/utils/formatCLP';

const DEFAULT_CATEGORIES = ['Cueros', 'Herrajes', 'Hilos', 'Herramientas', 'Empaque', 'Otros'];

interface GroupedCompraSection {
  title: string;
  dateKey: string;
  total: number;
  count: number;
  data: any[];
}

function groupComprasByDate(compras: any[]): GroupedCompraSection[] {
  const groups = new Map<string, { title: string; total: number; count: number; data: any[] }>();

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  for (const item of compras) {
    const itemDate = new Date(item.fecha);
    const dateKey = !isNaN(itemDate.getTime()) ? itemDate.toISOString().split('T')[0] : 'sin_fecha';
    
    let title = '';
    if (dateKey === todayStr) {
      title = 'Hoy';
    } else if (dateKey === yesterdayStr) {
      title = 'Ayer';
    } else if (!isNaN(itemDate.getTime())) {
      title = itemDate.toLocaleDateString('es-CL', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
      title = title.charAt(0).toUpperCase() + title.slice(1);
    } else {
      title = 'Otras fechas';
    }

    if (!groups.has(dateKey)) {
      groups.set(dateKey, {
        title,
        total: 0,
        count: 0,
        data: [],
      });
    }

    const group = groups.get(dateKey)!;
    group.total += item.monto || 0;
    group.count += 1;
    group.data.push(item);
  }

  return Array.from(groups.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([dateKey, val]) => ({
      dateKey,
      title: val.title,
      total: val.total,
      count: val.count,
      data: val.data,
    }));
}

export default function ComprasScreen() {
  const { Colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(Colors, insets, isDark), [Colors, insets, isDark]);
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


  const groupedCompras = useMemo(() => {
    return groupComprasByDate(filteredCompras);
  }, [filteredCompras]);

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={isDark ? ['#08080A', '#0B0B0E'] : [Colors.bgGradientStart, Colors.bgGradientEnd]} 
        style={StyleSheet.absoluteFill} 
      />
      
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

      {/* GROUPED PURCHASES LIST (SectionList) */}
      <SectionList
        sections={groupedCompras}
        keyExtractor={item => item.id}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section: { title, total, count } }) => (
          <View style={styles.sectionHeaderContainer}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="calendar-outline" size={14} color={Colors.primary} />
              <Text style={styles.sectionTitle}>{title}</Text>
              <View style={styles.sectionCountBadge}>
                <Text style={styles.sectionCountText}>{count}</Text>
              </View>
            </View>
            <Text style={styles.sectionTotalText}>-{formatCLP(total)}</Text>
          </View>
        )}
        renderItem={({ item, index, section }) => {
          const isFirst = index === 0;
          const isLast = index === section.data.length - 1;
          const isSingle = section.data.length === 1;

          return (
            <View style={[
              styles.transactionRow,
              isSingle && styles.transactionRowSingle,
              !isSingle && isFirst && styles.transactionRowFirst,
              !isSingle && isLast && styles.transactionRowLast,
              !isLast && styles.transactionRowMiddle,
            ]}>
              <View style={styles.transactionIconContainer}>
                <Ionicons name="cart-outline" size={18} color={Colors.danger} />
              </View>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionTitle}>{item.categoria}</Text>
                <Text style={styles.transactionSubtitle}>
                  {item.proveedor ? `${item.proveedor} • ` : ''}{new Date(item.fecha).toLocaleString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <View style={styles.transactionRight}>
                <Text style={styles.transactionAmount}>-{formatCLP(item.monto)}</Text>
                <View style={styles.transactionActions}>
                  <TouchableOpacity onPress={() => handleDuplicate(item)} style={styles.actionIcon} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="copy-outline" size={15} color={Colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionIcon} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="trash-outline" size={15} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
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

const makeStyles = (Colors: any, insets: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
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
  balanceContainer: {
    marginTop: Spacing.xs,
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    height: 42,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: insets.bottom + 85,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 4,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  sectionCountBadge: {
    backgroundColor: Colors.bgInput,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  sectionCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  sectionTotalText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.danger,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 12,
  },
  transactionRowSingle: {
    borderRadius: 16,
    marginBottom: 8,
  },
  transactionRowFirst: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  transactionRowMiddle: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    borderTopWidth: 0,
    borderRadius: 0,
  },
  transactionRowLast: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderTopWidth: 0,
    marginBottom: 8,
  },
  transactionIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : Colors.dangerMuted,
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
    fontWeight: '700',
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
    fontWeight: '800',
    color: Colors.danger,
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
    bottom: insets.bottom + 85,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
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
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: '#000',
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
    backgroundColor: Colors.pillBg,
    borderWidth: 1,
    borderColor: Colors.pillBorder,
  },
  categoryPillSelected: {
    backgroundColor: Colors.pillActiveBg,
    borderColor: Colors.primary,
  },
  categoryPillText: {
    color: Colors.pillText,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  categoryPillTextSelected: {
    color: Colors.pillActiveText,
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
    color: isDark ? '#000000' : '#FFFFFF',
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
