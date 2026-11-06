import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, Spacing, Radius, FontSize } from '@/constants/Colors';
import { useComprasStore } from '@/store/useComprasStore';
import { useVentasStore } from '@/store/useVentasStore';
import { useToastStore } from '@/store/useToastStore';
import { formatCLP } from '@/utils/formatCLP';
import { exportarReporteExcel, ReporteMetrics } from '@/utils/exportExcel';
import { DatePickerModal } from '@/components/ui/DatePickerModal';
import { EstadoVacio } from '@/components/ui/EstadoVacio';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function BarraComparativa({ label, valor, maximo, color, styles }: any) {
  const porcentaje = maximo > 0 ? (valor / maximo) * 100 : 0;
  return (
    <View style={styles.barraWrapper}>
      <View style={styles.barraHeader}>
        <Text style={styles.barraLabel}>{label}</Text>
        <Text style={[styles.barraValor, { color }]}>{formatCLP(valor)}</Text>
      </View>
      <View style={styles.barraFondo}>
        <View style={[styles.barraRelleno, { width: `${porcentaje}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export default function ReportesScreen() {
  const { Colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(Colors, isDark), [Colors, isDark]);
  const insets = useSafeAreaInsets();
  const showToast = useToastStore((s) => s.showToast);

  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'resumen' | 'ventas' | 'gastos'>('resumen');

  // Fechas de filtro interactivo
  const now = new Date();
  const [fechaInicio, setFechaInicio] = useState<Date>(
    () => new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
  );
  const [fechaFin, setFechaFin] = useState<Date>(
    () => new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  );
  const [periodoLabel, setPeriodoLabel] = useState<string>(
    () => `${MESES[now.getMonth()]} ${now.getFullYear()}`
  );

  // Modal selector de fechas
  const [modalVisible, setModalVisible] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState<'mes' | 'rango'>('mes');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  }, []);

  const todasCompras = useComprasStore((s) => s.compras);
  const todasVentas = useVentasStore((s) => s.ventas);

  // Filtrado reactivo por rango de fechas
  const comprasFiltradas = useMemo(() => {
    return todasCompras
      .filter((c) => {
        const d = new Date(c.fecha);
        return d >= fechaInicio && d <= fechaFin;
      })
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [todasCompras, fechaInicio, fechaFin]);

  const ventasFiltradas = useMemo(() => {
    return todasVentas
      .filter((v) => {
        const d = new Date(v.fecha);
        return d >= fechaInicio && d <= fechaFin;
      })
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [todasVentas, fechaInicio, fechaFin]);

  // Métricas financieras del periodo
  const totalCompras = comprasFiltradas.reduce((s, c) => s + c.monto, 0);
  const totalVentas = ventasFiltradas.reduce((s, v) => s + v.total, 0);
  const balance = totalVentas - totalCompras;
  const margenPromedio = totalVentas > 0 ? Math.round((balance / totalVentas) * 100) : 0;
  const totalUnidades = ventasFiltradas.reduce((s, v) => s + (v.cantidad || 1), 0);
  const ticketPromedio = ventasFiltradas.length > 0 ? Math.round(totalVentas / ventasFiltradas.length) : 0;

  const metricas: ReporteMetrics = {
    totalVentas,
    totalCompras,
    balance,
    margenPromedio,
    cantidadVentas: ventasFiltradas.length,
    cantidadCompras: comprasFiltradas.length,
    totalUnidades,
    ticketPromedio,
  };

  // Navegación rápida mes a mes (< Mes Actual >)
  const handlePrevMonth = () => {
    Haptics.selectionAsync();
    const prev = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth() - 1, 1);
    const end = new Date(prev.getFullYear(), prev.getMonth() + 1, 0, 23, 59, 59, 999);
    setFechaInicio(prev);
    setFechaFin(end);
    setPeriodoLabel(`${MESES[prev.getMonth()]} ${prev.getFullYear()}`);
  };

  const handleNextMonth = () => {
    Haptics.selectionAsync();
    const next = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth() + 1, 1);
    const end = new Date(next.getFullYear(), next.getMonth() + 1, 0, 23, 59, 59, 999);
    setFechaInicio(next);
    setFechaFin(end);
    setPeriodoLabel(`${MESES[next.getMonth()]} ${next.getFullYear()}`);
  };

  const handleApplyRangeFromModal = (start: Date, end: Date, label: string) => {
    setFechaInicio(start);
    setFechaFin(end);
    setPeriodoLabel(label);
  };

  // Exportar a Excel
  const handleExportExcel = async () => {
    if (exporting) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setExporting(true);

      const result = await exportarReporteExcel(
        ventasFiltradas,
        comprasFiltradas,
        periodoLabel,
        metricas
      );

      if (result.success) {
        showToast(result.message || 'Reporte Excel generado correctamente', 'success');
      } else {
        showToast(result.message || 'Error al exportar reporte', 'error');
      }
    } catch (e: any) {
      showToast(e?.message || 'Error al exportar reporte', 'error');
    } finally {
      setExporting(false);
    }
  };

  // Gastos por categoría
  const porCategoria: Record<string, number> = {};
  comprasFiltradas.forEach((c) => {
    const cat = c.categoria || 'Otros';
    porCategoria[cat] = (porCategoria[cat] ?? 0) + c.monto;
  });
  const categorias = Object.entries(porCategoria).sort((a, b) => b[1] - a[1]);
  const totalCategorias = categorias.reduce((s, [, v]) => s + v, 0);

  // Top productos vendidos
  const ventasPorProducto = ventasFiltradas.reduce<Record<string, { cantidad: number; total: number }>>((acc, v) => {
    const p = v.producto || 'Sin producto';
    if (!acc[p]) acc[p] = { cantidad: 0, total: 0 };
    acc[p].cantidad += v.cantidad || 1;
    acc[p].total += v.total || 0;
    return acc;
  }, {});
  const productosTop = Object.entries(ventasPorProducto)
    .sort((a, b) => b[1].cantidad - a[1].cantidad)
    .slice(0, 5);
  const medallas = ['🥇', '🥈', '🥉'];

  // Comparativa global para la barra visual (ventas vs compras)
  const maxComp = Math.max(totalVentas, totalCompras, 1);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? ['#08080A', '#0B0B0E'] : [Colors.bgGradientStart, Colors.bgGradientEnd]}
        style={StyleSheet.absoluteFill}
      />

      {/* HEADER PRINCIPAL */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + Spacing.md }]}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.screenTitle}>Reportes</Text>
            <Text style={styles.screenSubtitle}>Resumen financiero y auditoría</Text>
          </View>

          {/* BOTÓN EXPORTAR EXCEL */}
          <TouchableOpacity
            style={[styles.exportBtn, { backgroundColor: Colors.successMuted, borderColor: Colors.success }]}
            onPress={handleExportExcel}
            activeOpacity={0.8}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator size="small" color={Colors.success} />
            ) : (
              <>
                <Ionicons name="document-text-outline" size={17} color={Colors.success} />
                <Text style={[styles.exportBtnText, { color: Colors.success }]}>Excel</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* SELECTOR INTERACTIVO DE MES Y FECHA */}
        <View style={[styles.dateNavigatorCard, { backgroundColor: Colors.bgCard, borderColor: Colors.cardBorder }]}>
          <TouchableOpacity
            style={[styles.navArrowBtn, { backgroundColor: Colors.bgInput }]}
            onPress={handlePrevMonth}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={18} color={Colors.textPrimary} />
          </TouchableOpacity>

          {/* Selector central clickeable (abre selector de mes) */}
          <TouchableOpacity
            style={styles.periodCenterBtn}
            onPress={() => {
              Haptics.selectionAsync();
              setModalInitialTab('mes');
              setModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar" size={15} color={Colors.primary} />
            <Text style={styles.periodLabel} numberOfLines={1}>{periodoLabel}</Text>
            <Ionicons name="chevron-down" size={14} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navArrowBtn, { backgroundColor: Colors.bgInput }]}
            onPress={handleNextMonth}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-forward" size={18} color={Colors.textPrimary} />
          </TouchableOpacity>

          {/* Botón selector de rango personalizado */}
          <TouchableOpacity
            style={[styles.rangePickerBtn, { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary }]}
            onPress={() => {
              Haptics.selectionAsync();
              setModalInitialTab('rango');
              setModalVisible(true);
            }}
          >
            <Ionicons name="options-outline" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* PESTAÑAS SEGMENTADAS: RESUMEN / VENTAS / GASTOS */}
        <View style={[styles.segmentContainer, { backgroundColor: Colors.bgInput }]}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'resumen' && [styles.segmentBtnActive, { backgroundColor: Colors.bgCard }]]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab('resumen');
            }}
          >
            <Ionicons
              name="pie-chart-outline"
              size={15}
              color={activeTab === 'resumen' ? Colors.primary : Colors.textSecondary}
            />
            <Text style={[styles.segmentText, activeTab === 'resumen' && [styles.segmentTextActive, { color: Colors.primary }]]}>
              Resumen
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'ventas' && [styles.segmentBtnActive, { backgroundColor: Colors.bgCard }]]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab('ventas');
            }}
          >
            <Ionicons
              name="cash-outline"
              size={15}
              color={activeTab === 'ventas' ? Colors.success : Colors.textSecondary}
            />
            <Text style={[styles.segmentText, activeTab === 'ventas' && [styles.segmentTextActive, { color: Colors.success }]]}>
              Ventas ({ventasFiltradas.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'gastos' && [styles.segmentBtnActive, { backgroundColor: Colors.bgCard }]]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab('gastos');
            }}
          >
            <Ionicons
              name="bag-outline"
              size={15}
              color={activeTab === 'gastos' ? Colors.danger : Colors.textSecondary}
            />
            <Text style={[styles.segmentText, activeTab === 'gastos' && [styles.segmentTextActive, { color: Colors.danger }]]}>
              Gastos ({comprasFiltradas.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CONTENIDO PRINCIPAL SCROLLEABLE */}
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 95 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* KPI CARDS FINANCIEROS (Siempre visibles para referencia rápida) */}
        <View style={styles.kpiGrid}>
          {/* TOTAL VENTAS */}
          <View style={[styles.kpiCard, { backgroundColor: Colors.bgCard, borderColor: Colors.cardBorder }]}>
            <View style={styles.kpiHeader}>
              <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : Colors.successMuted }]}>
                <Ionicons name="trending-up" size={18} color={Colors.success} />
              </View>
              <Text style={styles.kpiBadge}>{ventasFiltradas.length} vtas</Text>
            </View>
            <Text style={styles.kpiLabel}>Total Vendido</Text>
            <Text style={[styles.kpiValor, { color: Colors.success }]} numberOfLines={1} adjustsFontSizeToFit>
              {formatCLP(totalVentas)}
            </Text>
            <Text style={styles.kpiSubinfo}>{totalUnidades} unidades vendidas</Text>
          </View>

          {/* TOTAL GASTOS */}
          <View style={[styles.kpiCard, { backgroundColor: Colors.bgCard, borderColor: Colors.cardBorder }]}>
            <View style={styles.kpiHeader}>
              <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : Colors.dangerMuted }]}>
                <Ionicons name="trending-down" size={18} color={Colors.danger} />
              </View>
              <Text style={styles.kpiBadge}>{comprasFiltradas.length} compras</Text>
            </View>
            <Text style={styles.kpiLabel}>Total Gastado</Text>
            <Text style={[styles.kpiValor, { color: Colors.danger }]} numberOfLines={1} adjustsFontSizeToFit>
              {formatCLP(totalCompras)}
            </Text>
            <Text style={styles.kpiSubinfo}>{categorias.length} categorías</Text>
          </View>

          {/* BALANCE NETO */}
          <View style={[styles.kpiCard, { backgroundColor: Colors.bgCard, borderColor: Colors.cardBorder }]}>
            <View style={styles.kpiHeader}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: balance >= 0 ? (isDark ? 'rgba(16,185,129,0.15)' : Colors.successMuted) : (isDark ? 'rgba(239,68,68,0.15)' : Colors.dangerMuted) },
                ]}
              >
                <Ionicons name="wallet-outline" size={18} color={balance >= 0 ? Colors.success : Colors.danger} />
              </View>
              <Text style={[styles.kpiBadge, { color: balance >= 0 ? Colors.success : Colors.danger }]}>
                {margenPromedio}% margen
              </Text>
            </View>
            <Text style={styles.kpiLabel}>Balance Neto</Text>
            <Text
              style={[styles.kpiValor, { color: balance >= 0 ? Colors.success : Colors.danger }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatCLP(balance)}
            </Text>
            <Text style={styles.kpiSubinfo}>
              {balance >= 0 ? 'Superávit / Ganancia' : 'Déficit del período'}
            </Text>
          </View>

          {/* TICKET PROMEDIO */}
          <View style={[styles.kpiCard, { backgroundColor: Colors.bgCard, borderColor: Colors.cardBorder }]}>
            <View style={styles.kpiHeader}>
              <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : Colors.warningMuted }]}>
                <Ionicons name="pricetag-outline" size={18} color={Colors.warning} />
              </View>
            </View>
            <Text style={styles.kpiLabel}>Ticket Promedio</Text>
            <Text style={[styles.kpiValor, { color: Colors.warning }]} numberOfLines={1} adjustsFontSizeToFit>
              {formatCLP(ticketPromedio)}
            </Text>
            <Text style={styles.kpiSubinfo}>Por cada venta realizada</Text>
          </View>
        </View>

        {/* ===================== TAB 1: RESUMEN GENERAL ===================== */}
        {activeTab === 'resumen' && (
          <View style={styles.tabContentSection}>
            {/* COMPARATIVA VENTAS VS COMPRAS */}
            <View style={[styles.card, { backgroundColor: Colors.bgCard, borderColor: Colors.cardBorder }]}>
              <Text style={styles.cardHeaderTitle}>Ingresos vs Egresos</Text>
              
              <View style={styles.compBarItem}>
                <View style={styles.compBarLabels}>
                  <Text style={styles.compBarName}>Ventas (Ingresos)</Text>
                  <Text style={[styles.compBarVal, { color: Colors.success }]}>{formatCLP(totalVentas)}</Text>
                </View>
                <View style={styles.compBarTrack}>
                  <View
                    style={[
                      styles.compBarFill,
                      { width: `${(totalVentas / maxComp) * 100}%`, backgroundColor: Colors.success },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.compBarItem}>
                <View style={styles.compBarLabels}>
                  <Text style={styles.compBarName}>Compras (Gastos)</Text>
                  <Text style={[styles.compBarVal, { color: Colors.danger }]}>{formatCLP(totalCompras)}</Text>
                </View>
                <View style={styles.compBarTrack}>
                  <View
                    style={[
                      styles.compBarFill,
                      { width: `${(totalCompras / maxComp) * 100}%`, backgroundColor: Colors.danger },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* GASTOS POR CATEGORÍA */}
            {categorias.length > 0 && (
              <View style={[styles.card, { backgroundColor: Colors.bgCard, borderColor: Colors.cardBorder }]}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardHeaderTitle}>Gastos por Categoría</Text>
                  <Text style={styles.cardHeaderBadge}>{formatCLP(totalCompras)}</Text>
                </View>
                {categorias.map(([cat, valor]) => (
                  <BarraComparativa
                    key={cat}
                    label={cat}
                    valor={valor}
                    maximo={totalCategorias}
                    color={Colors.danger}
                    styles={styles}
                  />
                ))}
              </View>
            )}

            {/* PRODUCTOS MÁS VENDIDOS */}
            {productosTop.length > 0 && (
              <View style={[styles.card, { backgroundColor: Colors.bgCard, borderColor: Colors.cardBorder }]}>
                <Text style={styles.cardHeaderTitle}>Top Productos Vendidos</Text>
                {productosTop.map(([producto, data], i) => (
                  <View key={producto} style={styles.rankingItem}>
                    <Text style={styles.rankingNum}>{i < 3 ? medallas[i] : `#${i + 1}`}</Text>
                    <View style={styles.rankingInfo}>
                      <Text style={styles.rankingProducto}>{producto}</Text>
                      <Text style={styles.rankingCantidad}>{data.cantidad} unidades vendidas</Text>
                    </View>
                    <Text style={styles.rankingTotal}>{formatCLP(data.total)}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* BOTÓN INVITACIÓN A EXPORTAR EXCEL */}
            <TouchableOpacity
              style={[styles.bigExportBtn, { backgroundColor: Colors.bgCard, borderColor: Colors.success }]}
              onPress={handleExportExcel}
              disabled={exporting}
            >
              <View style={[styles.bigExportIconCircle, { backgroundColor: Colors.successMuted }]}>
                <Ionicons name="download" size={22} color={Colors.success} />
              </View>
              <View style={styles.bigExportInfo}>
                <Text style={styles.bigExportTitle}>Descargar Reporte en Excel</Text>
                <Text style={styles.bigExportSubtitle}>
                  Incluye Resumen, Ventas y Gastos con detalle completo de {periodoLabel}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>

            {totalCompras === 0 && totalVentas === 0 && (
              <EstadoVacio
                titulo="Sin movimientos en este periodo"
                subtitulo={`No se registraron ventas ni compras entre el ${fechaInicio.toLocaleDateString('es-CL')} y el ${fechaFin.toLocaleDateString('es-CL')}.`}
                icono="calendar-outline"
              />
            )}
          </View>
        )}

        {/* ===================== TAB 2: DETALLE DE VENTAS ===================== */}
        {activeTab === 'ventas' && (
          <View style={styles.tabContentSection}>
            <View style={styles.detailHeaderRow}>
              <Text style={styles.detailTitle}>Listado de Ventas</Text>
              <Text style={styles.detailCountText}>
                {ventasFiltradas.length} transacciones • {formatCLP(totalVentas)}
              </Text>
            </View>

            {ventasFiltradas.length === 0 ? (
              <EstadoVacio
                titulo="Sin ventas registradas"
                subtitulo="No hay ventas registradas en las fechas seleccionadas."
                icono="cash-outline"
              />
            ) : (
              ventasFiltradas.map((item, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === ventasFiltradas.length - 1;
                const isSingle = ventasFiltradas.length === 1;
                const d = new Date(item.fecha);

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.transactionRow,
                      { backgroundColor: Colors.bgCard, borderColor: Colors.cardBorder },
                      isSingle && styles.transactionRowSingle,
                      !isSingle && isFirst && styles.transactionRowFirst,
                      !isSingle && isLast && styles.transactionRowLast,
                      !isLast && styles.transactionRowMiddle,
                    ]}
                  >
                    <View style={[styles.transactionIconContainer, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : Colors.successMuted }]}>
                      <Ionicons name="pricetag-outline" size={16} color={Colors.success} />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionTitle}>{item.producto}</Text>
                      <Text style={styles.transactionSubtitle}>
                        {item.cantidad} x {formatCLP(item.precioUnitario || Math.round(item.total / item.cantidad))}
                        {item.cliente ? ` • ${item.cliente}` : ''}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })} • {d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <Text style={[styles.transactionAmount, { color: Colors.success }]}>
                      +{formatCLP(item.total)}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ===================== TAB 3: DETALLE DE GASTOS ===================== */}
        {activeTab === 'gastos' && (
          <View style={styles.tabContentSection}>
            <View style={styles.detailHeaderRow}>
              <Text style={styles.detailTitle}>Listado de Gastos y Compras</Text>
              <Text style={styles.detailCountText}>
                {comprasFiltradas.length} transacciones • -{formatCLP(totalCompras)}
              </Text>
            </View>

            {comprasFiltradas.length === 0 ? (
              <EstadoVacio
                titulo="Sin gastos registrados"
                subtitulo="No hay compras ni gastos registrados en las fechas seleccionadas."
                icono="cart-outline"
              />
            ) : (
              comprasFiltradas.map((item, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === comprasFiltradas.length - 1;
                const isSingle = comprasFiltradas.length === 1;
                const d = new Date(item.fecha);

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.transactionRow,
                      { backgroundColor: Colors.bgCard, borderColor: Colors.cardBorder },
                      isSingle && styles.transactionRowSingle,
                      !isSingle && isFirst && styles.transactionRowFirst,
                      !isSingle && isLast && styles.transactionRowLast,
                      !isLast && styles.transactionRowMiddle,
                    ]}
                  >
                    <View style={[styles.transactionIconContainer, { backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : Colors.dangerMuted }]}>
                      <Ionicons name="cart-outline" size={16} color={Colors.danger} />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionTitle}>{item.categoria}</Text>
                      <Text style={styles.transactionSubtitle}>
                        {item.proveedor ? item.proveedor : 'Gasto general'}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })} • {d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <Text style={[styles.transactionAmount, { color: Colors.danger }]}>
                      -{formatCLP(item.monto)}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* MODAL SELECTOR DE FECHAS Y MES */}
      <DatePickerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        startDate={fechaInicio}
        endDate={fechaFin}
        onApplyRange={handleApplyRangeFromModal}
        initialTab={modalInitialTab}
      />
    </View>
  );
}

const makeStyles = (Colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.bg,
    },
    headerContainer: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.sm,
      backgroundColor: Colors.bg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: Colors.border,
      gap: Spacing.sm,
    },
    headerTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    screenTitle: {
      fontSize: 26,
      fontWeight: '900',
      color: Colors.textPrimary,
      letterSpacing: -0.5,
    },
    screenSubtitle: {
      fontSize: 12,
      fontWeight: '500',
      color: Colors.textSecondary,
      marginTop: 1,
    },
    exportBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: Radius.full,
      borderWidth: 1,
    },
    exportBtnText: {
      fontSize: 13,
      fontWeight: '800',
    },

    // Date navigator card
    dateNavigatorCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 6,
      borderRadius: 14,
      borderWidth: 1,
    },
    navArrowBtn: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    periodCenterBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingHorizontal: 8,
    },
    periodLabel: {
      fontSize: 14,
      fontWeight: '800',
      color: Colors.textPrimary,
      textTransform: 'capitalize',
    },
    rangePickerBtn: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      marginLeft: 4,
    },

    // Segmented tabs
    segmentContainer: {
      flexDirection: 'row',
      borderRadius: 12,
      padding: 3,
      marginTop: 2,
    },
    segmentBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      paddingVertical: 8,
      borderRadius: 10,
    },
    segmentBtnActive: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    segmentText: {
      fontSize: 12,
      fontWeight: '600',
      color: Colors.textSecondary,
    },
    segmentTextActive: {
      fontWeight: '800',
    },

    // Scroll content
    content: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      gap: Spacing.lg,
    },

    // KPI Cards
    kpiGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    kpiCard: {
      flex: 1,
      minWidth: '47%',
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    kpiHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    iconCircle: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    kpiBadge: {
      fontSize: 10,
      fontWeight: '700',
      color: Colors.textSecondary,
    },
    kpiLabel: {
      fontSize: 10,
      color: Colors.textSecondary,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    kpiValor: {
      fontSize: 18,
      fontWeight: '900',
      marginTop: 2,
    },
    kpiSubinfo: {
      fontSize: 10,
      color: Colors.textMuted,
      marginTop: 4,
      fontWeight: '500',
    },

    tabContentSection: {
      gap: Spacing.md,
    },

    // Card style
    card: {
      borderRadius: 18,
      padding: Spacing.lg,
      borderWidth: 1,
      gap: Spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    cardHeaderTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: Colors.textPrimary,
      letterSpacing: -0.2,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardHeaderBadge: {
      fontSize: 13,
      fontWeight: '800',
      color: Colors.danger,
    },

    // Comp bars
    compBarItem: {
      gap: 6,
    },
    compBarLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    compBarName: {
      fontSize: 12,
      fontWeight: '600',
      color: Colors.textSecondary,
    },
    compBarVal: {
      fontSize: 13,
      fontWeight: '800',
    },
    compBarTrack: {
      height: 10,
      backgroundColor: Colors.bgInput,
      borderRadius: 5,
      overflow: 'hidden',
    },
    compBarFill: {
      height: '100%',
      borderRadius: 5,
    },

    // Categorias comparativas
    barraWrapper: {
      gap: 6,
    },
    barraHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    barraLabel: {
      fontSize: 13,
      color: Colors.textPrimary,
      fontWeight: '600',
    },
    barraValor: {
      fontSize: 13,
      fontWeight: '700',
    },
    barraFondo: {
      height: 8,
      backgroundColor: Colors.bgInput,
      borderRadius: 4,
      overflow: 'hidden',
    },
    barraRelleno: {
      height: '100%',
      borderRadius: 4,
    },

    // Ranking
    rankingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      paddingVertical: Spacing.xs,
    },
    rankingNum: {
      fontSize: 16,
      fontWeight: '800',
      width: 28,
      textAlign: 'center',
      color: Colors.textMuted,
    },
    rankingInfo: {
      flex: 1,
      gap: 1,
    },
    rankingProducto: {
      fontSize: 13,
      color: Colors.textPrimary,
      fontWeight: '700',
    },
    rankingCantidad: {
      fontSize: 11,
      color: Colors.textSecondary,
      fontWeight: '500',
    },
    rankingTotal: {
      fontSize: 13,
      color: Colors.success,
      fontWeight: '800',
    },

    // Big export button card
    bigExportBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.lg,
      borderRadius: 18,
      borderWidth: 1.5,
      gap: Spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    bigExportIconCircle: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bigExportInfo: {
      flex: 1,
      gap: 2,
    },
    bigExportTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: Colors.textPrimary,
    },
    bigExportSubtitle: {
      fontSize: 11,
      color: Colors.textSecondary,
      lineHeight: 15,
    },

    // Detail lists (Ventas & Gastos)
    detailHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 4,
      paddingTop: 4,
      paddingBottom: 2,
    },
    detailTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: Colors.textPrimary,
    },
    detailCountText: {
      fontSize: 11,
      fontWeight: '600',
      color: Colors.textSecondary,
    },

    transactionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
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
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    transactionInfo: {
      flex: 1,
      justifyContent: 'center',
    },
    transactionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: Colors.textPrimary,
      marginBottom: 1,
    },
    transactionSubtitle: {
      fontSize: 11,
      color: Colors.textSecondary,
    },
    transactionDate: {
      fontSize: 10,
      color: Colors.textMuted,
      marginTop: 2,
    },
    transactionAmount: {
      fontSize: 13,
      fontWeight: '800',
    },
  });
