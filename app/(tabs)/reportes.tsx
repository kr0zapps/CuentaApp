import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, Spacing, Radius, FontSize } from '@/constants/Colors';
import { useComprasStore } from '@/store/useComprasStore';
import { useVentasStore } from '@/store/useVentasStore';
import { formatCLP } from '@/utils/formatCLP';

// --- Utils para fechas ---
function esMismoMes(d1: Date, d2: Date) {
  return d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
}

function filtrarPorFecha(items: any[], rango: 'este_mes' | 'mes_pasado' | '3_meses' | '6_meses' | 'historico') {
  const ahora = new Date();
  const hace1Mes = new Date(ahora.getFullYear(), ahora.getMonth() - 1, ahora.getDate());
  const hace3Meses = new Date(ahora.getFullYear(), ahora.getMonth() - 3, ahora.getDate());
  const hace6Meses = new Date(ahora.getFullYear(), ahora.getMonth() - 6, ahora.getDate());

  return items.filter(item => {
    const d = new Date(item.fecha);
    switch (rango) {
      case 'este_mes': return esMismoMes(d, ahora);
      case 'mes_pasado': return esMismoMes(d, hace1Mes);
      case '3_meses': return d >= hace3Meses;
      case '6_meses': return d >= hace6Meses;
      case 'historico': return true;
      default: return true;
    }
  });
}

function getMesesArray(): Date[] {
  const meses: Date[] = [];
  const ahora = new Date();
  for (let i = 5; i >= 0; i--) {
    meses.push(new Date(ahora.getFullYear(), ahora.getMonth() - i, 1));
  }
  return meses;
}

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
  const Colors = useThemeColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const insets = useSafeAreaInsets();
  
  const [refreshing, setRefreshing] = useState(false);
  const [rangoSeleccionado, setRangoSeleccionado] = useState<'este_mes' | 'mes_pasado' | '3_meses' | '6_meses' | 'historico'>('este_mes');
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  }, []);

  const todasCompras = useComprasStore((s) => s.compras);
  const todasVentas = useVentasStore((s) => s.ventas);

  const compras = useMemo(() => filtrarPorFecha(todasCompras, rangoSeleccionado), [todasCompras, rangoSeleccionado]);
  const ventas = useMemo(() => filtrarPorFecha(todasVentas, rangoSeleccionado), [todasVentas, rangoSeleccionado]);

  const totalCompras = compras.reduce((s, c) => s + c.monto, 0);
  const totalVentas = ventas.reduce((s, v) => s + v.total, 0);
  const balance = totalVentas - totalCompras;
  const margenPromedio = totalVentas > 0 ? Math.round((balance / totalVentas) * 100) : 0;

  // Gráfico últimos 6 meses (siempre mostramos la tendencia de los últimos 6 meses sin importar el filtro, para contexto)
  const mesesFechas = getMesesArray();
  const mesesDatos = mesesFechas.map(mesDate => {
    const v = todasVentas.filter(v => esMismoMes(new Date(v.fecha), mesDate)).reduce((sum, v) => sum + v.total, 0);
    const c = todasCompras.filter(c => esMismoMes(new Date(c.fecha), mesDate)).reduce((sum, c) => sum + c.monto, 0);
    return {
      label: mesDate.toLocaleDateString('es-CL', { month: 'short', year: '2-digit' }),
      ventas: v,
      compras: c
    };
  }).filter(d => d.ventas > 0 || d.compras > 0); // Ocultar meses sin actividad

  const maxValorGrafico = Math.max(...mesesDatos.flatMap(d => [d.ventas, d.compras]), 1);

  // Categorías de compras (del periodo seleccionado)
  const porCategoria: Record<string, number> = {};
  compras.forEach((c) => {
    porCategoria[c.categoria] = (porCategoria[c.categoria] ?? 0) + c.monto;
  });
  const categorias = Object.entries(porCategoria).sort((a, b) => b[1] - a[1]);
  const totalCategorias = categorias.reduce((s, [, v]) => s + v, 0);

  // Productos más vendidos (del periodo seleccionado)
  const ventasPorProducto = ventas.reduce<Record<string, { cantidad: number; total: number }>>((acc, v) => {
    if (!acc[v.producto]) acc[v.producto] = { cantidad: 0, total: 0 };
    acc[v.producto].cantidad += v.cantidad;
    acc[v.producto].total += v.total;
    return acc;
  }, {});
  const productosTop = Object.entries(ventasPorProducto)
    .sort((a, b) => b[1].cantidad - a[1].cantidad)
    .slice(0, 5);
  const medallas = ['🥇', '🥈', '🥉'];

  const FILTROS = [
    { id: 'este_mes', label: 'Este mes' },
    { id: 'mes_pasado', label: 'Mes pasado' },
    { id: '3_meses', label: 'Últimos 3 meses' },
    { id: '6_meses', label: 'Últimos 6 meses' },
    { id: 'historico', label: 'Histórico' },
  ] as const;

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={[Colors.bg, (Colors as any).bgGradientEnd || Colors.bg]} 
        style={StyleSheet.absoluteFill} 
      />
      
      {/* HEADER FIJO CON FILTROS */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + Spacing.lg }]}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.titulo}>Dashboard</Text>
          <View style={styles.iconCircleTitle}>
            <Ionicons name="pie-chart" size={24} color={Colors.primary} />
          </View>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          {FILTROS.map((filtro) => {
            const isActive = rangoSeleccionado === filtro.id;
            return (
              <TouchableOpacity
                key={filtro.id}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setRangoSeleccionado(filtro.id as any);
                }}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {filtro.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView 
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
        }
      >
        {/* KPIs generales */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <View style={[styles.iconCircle, { backgroundColor: Colors.successMuted }]}>
                <Ionicons name="trending-up" size={20} color={Colors.success} />
              </View>
            </View>
            <View style={styles.kpiTextContainer}>
              <Text style={styles.kpiLabel}>Total Vendido</Text>
              <Text style={[styles.kpiValor, { color: Colors.success }]} numberOfLines={1} adjustsFontSizeToFit>{formatCLP(totalVentas)}</Text>
            </View>
          </View>
          
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <View style={[styles.iconCircle, { backgroundColor: Colors.dangerMuted }]}>
                <Ionicons name="trending-down" size={20} color={Colors.danger} />
              </View>
            </View>
            <View style={styles.kpiTextContainer}>
              <Text style={styles.kpiLabel}>Total Gastado</Text>
              <Text style={[styles.kpiValor, { color: Colors.danger }]} numberOfLines={1} adjustsFontSizeToFit>{formatCLP(totalCompras)}</Text>
            </View>
          </View>
          
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <View style={[styles.iconCircle, { backgroundColor: balance >= 0 ? Colors.successMuted : Colors.dangerMuted }]}>
                <Ionicons name="wallet" size={20} color={balance >= 0 ? Colors.success : Colors.danger} />
              </View>
            </View>
            <View style={styles.kpiTextContainer}>
              <Text style={styles.kpiLabel}>Balance Total</Text>
              <Text style={[styles.kpiValor, { color: balance >= 0 ? Colors.success : Colors.danger }]} numberOfLines={1} adjustsFontSizeToFit>
                {formatCLP(balance)}
              </Text>
            </View>
          </View>
          
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <View style={[styles.iconCircle, { backgroundColor: Colors.warningMuted }]}>
                <Ionicons name="analytics" size={20} color={Colors.warning} />
              </View>
            </View>
            <View style={styles.kpiTextContainer}>
              <Text style={styles.kpiLabel}>Margen Promedio</Text>
              <Text style={[styles.kpiValor, { color: Colors.warning }]} numberOfLines={1} adjustsFontSizeToFit>{margenPromedio}%</Text>
            </View>
          </View>
        </View>

        {/* Gráfico Tendencia 6 meses */}
        {mesesDatos.length > 0 && (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Tendencia histórica (6 meses)</Text>
            <View style={styles.card}>
              {mesesDatos.map((d) => (
                <View key={d.label} style={styles.mesBloque}>
                  <Text style={styles.mesLabel}>{d.label}</Text>
                  <View style={styles.barrasCol}>
                    {/* Ventas */}
                    {d.ventas > 0 && (
                      <View style={styles.barraHorizontalWrapper}>
                        <View style={styles.barraHorizontalFondo}>
                          <View style={[styles.barraHorizontal, { width: `${(d.ventas / maxValorGrafico) * 100}%`, backgroundColor: Colors.success }]} />
                        </View>
                        <Text style={styles.barraHorizontalVal}>{formatCLP(d.ventas)}</Text>
                      </View>
                    )}
                    {/* Compras */}
                    {d.compras > 0 && (
                      <View style={styles.barraHorizontalWrapper}>
                        <View style={styles.barraHorizontalFondo}>
                          <View style={[styles.barraHorizontal, { width: `${(d.compras / maxValorGrafico) * 100}%`, backgroundColor: Colors.danger }]} />
                        </View>
                        <Text style={styles.barraHorizontalVal}>{formatCLP(d.compras)}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
              <View style={styles.leyenda}>
                <View style={styles.leyendaItem}>
                  <View style={[styles.leyendaPunto, { backgroundColor: Colors.success }]} />
                  <Text style={styles.leyendaTexto}>Ventas</Text>
                </View>
                <View style={styles.leyendaItem}>
                  <View style={[styles.leyendaPunto, { backgroundColor: Colors.danger }]} />
                  <Text style={styles.leyendaTexto}>Compras</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Categorías de gasto */}
        {categorias.length > 0 && (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Gastos por categoría</Text>
            <View style={styles.card}>
              {categorias.map(([cat, valor]) => (
                <BarraComparativa key={cat} label={cat} valor={valor} maximo={totalCategorias} color={Colors.danger} styles={styles} />
              ))}
            </View>
          </View>
        )}

        {/* Productos más vendidos */}
        {productosTop.length > 0 && (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Productos más vendidos</Text>
            <View style={styles.card}>
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
          </View>
        )}
        
        {totalCompras === 0 && totalVentas === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Sin datos en este periodo</Text>
            <Text style={styles.emptySubtitle}>No hay ventas ni compras registradas para el rango de fechas seleccionado.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (Colors: any) => StyleSheet.create({
  container: { flex: 1 },
  headerContainer: {
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bgCardElevated,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    zIndex: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  titulo: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  iconCircleTitle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersScroll: { paddingHorizontal: Spacing.xl, gap: Spacing.sm },
  filterPill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  filterPillActive: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
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
  content: { paddingHorizontal: Spacing.xl, gap: Spacing.xl, paddingTop: Spacing.xl },
  
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  kpiCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.bgCardElevated,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  kpiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiTextContainer: { gap: 4 },
  kpiLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  kpiValor: { fontSize: FontSize.xl, fontWeight: '800' },

  seccion: { gap: Spacing.md },
  seccionTitulo: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, letterSpacing: 0.3 },

  card: {
    backgroundColor: Colors.bgCardElevated,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.lg,
  },
  
  mesBloque: { gap: Spacing.sm, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  mesLabel: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: '700', textTransform: 'capitalize' },
  barrasCol: { gap: 8 },
  barraHorizontalWrapper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  barraHorizontalFondo: { flex: 1, height: 16, backgroundColor: Colors.bgInput, borderRadius: 8, overflow: 'hidden' },
  barraHorizontal: { height: '100%', borderRadius: 8 },
  barraHorizontalVal: { fontSize: FontSize.sm, color: Colors.textSecondary, width: 80, textAlign: 'right', fontWeight: '600' },
  
  leyenda: { flexDirection: 'row', gap: Spacing.xl, justifyContent: 'center', paddingTop: Spacing.sm },
  leyendaItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  leyendaPunto: { width: 10, height: 10, borderRadius: 5 },
  leyendaTexto: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },

  barraWrapper: { gap: 8 },
  barraHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barraFondo: { height: 12, backgroundColor: Colors.bgInput, borderRadius: 6, overflow: 'hidden' },
  barraRelleno: { height: '100%', borderRadius: 6 },
  barraLabel: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: '600' },
  barraValor: { fontSize: FontSize.md, fontWeight: '700' },

  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rankingNum: { fontSize: FontSize.xl, color: Colors.textMuted, fontWeight: '800', width: 36, textAlign: 'center' },
  rankingInfo: { flex: 1, gap: 2 },
  rankingProducto: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: '700' },
  rankingCantidad: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '500' },
  rankingTotal: { fontSize: FontSize.md, color: Colors.success, fontWeight: '800' },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xxxl * 2, gap: Spacing.md },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.xl },
});
