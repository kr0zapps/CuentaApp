import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

import { useTheme, Spacing, Radius, FontSize } from '@/constants/Colors';
import { useVentasPorPeriodo, PeriodoFiltro } from '@/store/useVentasStore';
import { useComprasPorPeriodo } from '@/store/useComprasStore';
import { formatCLP } from '@/utils/formatCLP';

function getNombreMes(): string {
  return new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
}

export default function Dashboard() {
  const { Colors, isDark, theme, toggleTheme } = useTheme();
  const styles = useMemo(() => makeStyles(Colors, isDark), [Colors, isDark]);
  const [mostrarSaldo, setMostrarSaldo] = useState(true);
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('mes');

  const [refreshing, setRefreshing] = useState(false);

  const toggleSaldo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMostrarSaldo(!mostrarSaldo);
  };

  const ventasPeriodo = useVentasPorPeriodo(periodo);
  const comprasPeriodo = useComprasPorPeriodo(periodo);

  const totalVentas = useMemo(() => ventasPeriodo.reduce((sum, v) => sum + v.total, 0), [ventasPeriodo]);
  const totalCompras = useMemo(() => comprasPeriodo.reduce((sum, c) => sum + c.monto, 0), [comprasPeriodo]);
  const balance = totalVentas - totalCompras;

  const ventasRecientes = useMemo(() => ventasPeriodo.slice(0, 5), [ventasPeriodo]);
  const comprasRecientes = useMemo(() => comprasPeriodo.slice(0, 5), [comprasPeriodo]);

  const esGanancia = balance >= 0;

  const subtituloPeriodo = useMemo(() => {
    switch (periodo) {
      case 'hoy': return 'hoy';
      case 'ayer': return 'ayer';
      case 'semana': return 'esta semana';
      case 'mes': return 'este mes';
      case 'todo': return 'en total';
    }
  }, [periodo]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[(Colors as any).bgGradientStart || '#08080A', Colors.bg]}
        style={StyleSheet.absoluteFill}
      />
      
      <SafeAreaView style={styles.safe}>
        <ScrollView 
          style={styles.scroll} 
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
        >
          {/* TOP HEADER SECTION (Stitch Design) */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {/* Geometric Cube Logo */}
              <LinearGradient
                colors={['#D97706', '#F59E0B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoBadge}
              >
                <View style={styles.logoInner}>
                  <Ionicons name="cube" size={20} color="#F59E0B" />
                </View>
              </LinearGradient>
              <View>
                <Text style={styles.brandTitle}>CuentApp</Text>
                <Text style={styles.brandSubtitle}>Tu taller, en orden</Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity 
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleTheme(); }} 
                style={styles.circleBtn}
              >
                <Ionicons name={theme === 'light' ? "moon" : "sunny"} size={18} color={Colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={toggleSaldo} 
                style={styles.circleBtn}
              >
                <Ionicons name={mostrarSaldo ? "eye-outline" : "eye-off-outline"} size={18} color={Colors.textSecondary} />
              </TouchableOpacity>

              {/* Profile Avatar with Gold Ring */}
              <View style={styles.avatarRing}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitials}>AR</Text>
                </View>
              </View>
            </View>
          </View>

          {/* HERO BALANCE CARD (Stitch Golden Mesh) */}
          <TouchableOpacity activeOpacity={0.95} onPress={toggleSaldo} style={styles.heroCardContainer}>
            <LinearGradient
              colors={isDark ? ['#1F1A14', '#111114'] : [Colors.heroCardStart, Colors.heroCardEnd]}
              start={{ x: 0.1, y: 0.1 }}
              end={{ x: 0.9, y: 0.9 }}
              style={styles.heroCard}
            >
              {/* Ambient Glow */}
              <View style={styles.heroAmbientGlow} />

              {/* Top Row: Wallet Icon + Label + Arrow */}
              <View style={styles.heroTopRow}>
                <View style={styles.heroLabelBadge}>
                  <View style={styles.walletIconBox}>
                    <Ionicons name="wallet-outline" size={15} color={Colors.primary} />
                  </View>
                  <Text style={styles.heroLabelText}>Saldo disponible</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={isDark ? 'rgba(245,158,11,0.7)' : Colors.primary} />
              </View>

              {/* Balance Amount & Eye */}
              <View style={styles.balanceRow}>
                <Text style={styles.balanceAmount}>
                  {mostrarSaldo ? formatCLP(balance) : '********'}
                </Text>
              </View>

              {/* Status Comparison Indicator */}
              <View style={styles.comparisonRow}>
                <Ionicons 
                  name={esGanancia ? "arrow-up" : "arrow-down"} 
                  size={12} 
                  color={esGanancia ? Colors.success : Colors.danger} 
                />
                <Text style={[styles.comparisonText, { color: esGanancia ? Colors.success : Colors.danger }]}>
                  {esGanancia ? `+${formatCLP(balance)}` : `-${formatCLP(Math.abs(balance))}`} {subtituloPeriodo}
                </Text>
              </View>

              {/* Golden SVG Trend Curve Wave */}
              <View style={styles.trendWaveContainer}>
                <Svg width="100%" height={48} viewBox="0 0 320 60" preserveAspectRatio="none">
                  <Defs>
                    <SvgGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0%" stopColor={Colors.primary} stopOpacity={0.32} />
                      <Stop offset="100%" stopColor={Colors.primary} stopOpacity={0.0} />
                    </SvgGradient>
                  </Defs>
                  <Path 
                    d="M0 48 C 45 48, 70 54, 110 40 C 150 25, 180 42, 220 32 C 260 22, 285 10, 320 12 L 320 60 L 0 60 Z" 
                    fill="url(#chartGradient)" 
                  />
                  <Path 
                    d="M0 48 C 45 48, 70 54, 110 40 C 150 25, 180 42, 220 32 C 260 22, 285 10, 320 12" 
                    fill="none" 
                    stroke={Colors.primary} 
                    strokeLinecap="round" 
                    strokeWidth={2.4} 
                  />
                </Svg>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* PERIOD FILTER SEGMENTED PILL (Stitch Design) */}
          <View style={styles.segmentedContainer}>
            {[
              { key: 'hoy', label: 'Hoy' },
              { key: 'semana', label: 'Semana' },
              { key: 'mes', label: 'Mes' },
              { key: 'todo', label: 'Todo' },
            ].map((item) => {
              const isSelected = periodo === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.segmentedTab,
                    isSelected && styles.segmentedTabActive
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setPeriodo(item.key as PeriodoFiltro);
                  }}
                  activeOpacity={0.7}
                >
                  {isSelected && (
                    <LinearGradient
                      colors={['#FBBF24', '#F59E0B']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                  <Text style={[styles.segmentedText, isSelected && styles.segmentedTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* KPI METRICS (Stitch Grid: Ingresos & Gastos) */}
          <View style={styles.kpiGrid}>
            {/* Ingresos Card */}
            <View style={styles.kpiCard}>
              <View style={styles.kpiHeader}>
                <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.25)' }]}>
                  <Ionicons name="arrow-up" size={16} color={Colors.success} />
                </View>
                <Text style={styles.kpiLabel}>Ingresos</Text>
              </View>
              <Text style={[styles.kpiValue, { color: Colors.success }]}>
                {mostrarSaldo ? formatCLP(totalVentas) : '****'}
              </Text>
              <View style={styles.kpiBadgeRow}>
                <Text style={[styles.kpiBadgeText, { color: Colors.success }]}>+18%</Text>
                <Text style={styles.kpiBadgePeriod}>vs. período anterior</Text>
              </View>
            </View>

            {/* Gastos Card */}
            <View style={styles.kpiCard}>
              <View style={styles.kpiHeader}>
                <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.25)' }]}>
                  <Ionicons name="arrow-down" size={16} color={Colors.danger} />
                </View>
                <Text style={styles.kpiLabel}>Gastos</Text>
              </View>
              <Text style={[styles.kpiValue, { color: Colors.textPrimary }]}>
                {mostrarSaldo ? formatCLP(totalCompras) : '****'}
              </Text>
              <View style={styles.kpiBadgeRow}>
                <Text style={[styles.kpiBadgeText, { color: Colors.danger }]}>-7%</Text>
                <Text style={styles.kpiBadgePeriod}>vs. período anterior</Text>
              </View>
            </View>
          </View>

          {/* QUICK ACTION BUTTONS */}
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity
              style={styles.quickActionCard}
              activeOpacity={0.8}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.navigate({ pathname: '/ventas', params: { openModal: 'true' } }); }}
            >
              <LinearGradient colors={['#10B981', '#059669']} style={styles.quickActionIcon}>
                <Ionicons name="cash-outline" size={22} color="#000" />
              </LinearGradient>
              <Text style={styles.quickActionText}>Vender</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              activeOpacity={0.8}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.navigate({ pathname: '/compras', params: { openModal: 'true' } }); }}
            >
              <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.quickActionIcon}>
                <Ionicons name="cart-outline" size={22} color="#000" />
              </LinearGradient>
              <Text style={styles.quickActionText}>Gastar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              activeOpacity={0.8}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.navigate({ pathname: '/produccion', params: { openModal: 'true' } }); }}
            >
              <LinearGradient colors={['#FBBF24', '#D97706']} style={styles.quickActionIcon}>
                <Ionicons name="hammer-outline" size={22} color="#000" />
              </LinearGradient>
              <Text style={styles.quickActionText}>Producir</Text>
            </TouchableOpacity>
          </View>

          {/* RECENT MOVEMENTS SECTION (Stitch Design) */}
          <View style={styles.movementsSection}>
            <View style={styles.movementsHeader}>
              <Text style={styles.sectionTitle}>Movimientos recientes</Text>
              <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.navigate('/(tabs)/reportes'); }}>
                <Text style={styles.seeAllText}>Ver todos &gt;</Text>
              </TouchableOpacity>
            </View>

            {(() => {
              const movimientos = [...ventasRecientes.map(v => ({...v, _tipo: 'venta'})), ...comprasRecientes.map(c => ({...c, _tipo: 'compra'}))]
                .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                .slice(0, 5);

              if (movimientos.length === 0) {
                return (
                  <View style={styles.emptyCard}>
                    <Ionicons name="calendar-outline" size={24} color={Colors.textMuted} />
                    <Text style={styles.emptyText}>Sin movimientos registrados ({subtituloPeriodo})</Text>
                  </View>
                );
              }

              return (
                <View style={styles.movementsList}>
                  {movimientos.map((item) => {
                    const isVenta = item._tipo === 'venta';
                    return (
                      <View key={`${item._tipo}-${item.id}`} style={styles.movementItem}>
                        <View style={[styles.movementIconBox, { backgroundColor: isVenta ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }]}>
                          <Ionicons 
                            name={isVenta ? "cash-outline" : "bag-outline"} 
                            size={18} 
                            color={isVenta ? Colors.success : Colors.danger} 
                          />
                        </View>

                        <View style={styles.movementDetails}>
                          <Text style={styles.movementTitle} numberOfLines={1}>
                            {isVenta ? `Venta • ${(item as any).producto}` : `Compra • ${(item as any).categoria}`}
                          </Text>
                          <Text style={styles.movementMeta}>
                            {new Date(item.fecha).toLocaleString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            {isVenta 
                              ? (item as any).cliente ? ` • ${(item as any).cliente}` : ''
                              : (item as any).proveedor ? ` • ${(item as any).proveedor}` : ''}
                          </Text>
                        </View>

                        <Text style={[styles.movementAmount, { color: isVenta ? Colors.success : Colors.textPrimary }]}>
                          {isVenta ? '+' : '-'}{mostrarSaldo ? formatCLP((item as any).total || (item as any).monto) : '***'}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              );
            })()}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const makeStyles = (Colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: 110,
  },

  // HEADER (Stitch Design)
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingTop: Spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    padding: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoInner: {
    width: '100%',
    height: '100%',
    borderRadius: 10.5,
    backgroundColor: Colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    padding: 2,
    borderWidth: 1.5,
    borderColor: isDark ? 'rgba(245,158,11,0.4)' : Colors.borderFocus,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    backgroundColor: Colors.leather,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },

  // HERO BALANCE CARD (Stitch Golden Mesh)
  heroCardContainer: {
    marginBottom: Spacing.md,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(245,158,11,0.3)' : Colors.heroCardBorder,
    shadowColor: Colors.primary,
    shadowOpacity: isDark ? 0.22 : 0.1,
    shadowRadius: 18,
    elevation: 6,
  },
  heroCard: {
    padding: Spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  heroAmbientGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: isDark ? 'rgba(245,158,11,0.12)' : 'rgba(217,119,6,0.06)',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroLabelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(245,158,11,0.3)' : Colors.heroCardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: isDark ? '#FDE68A' : Colors.primaryDark,
    letterSpacing: 0.2,
  },
  balanceRow: {
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 34,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  comparisonText: {
    fontSize: 11,
    fontWeight: '700',
  },
  trendWaveContainer: {
    height: 48,
    width: '100%',
    overflow: 'hidden',
    marginTop: 4,
  },

  // SEGMENTED PILL (Stitch)
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: isDark ? '#131317' : Colors.pillBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 9999,
    padding: 3,
    marginBottom: Spacing.lg,
  },
  segmentedTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 9999,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentedTabActive: {},
  segmentedText: {
    fontSize: 12,
    fontWeight: '600',
    color: isDark ? '#A1A1AA' : Colors.textSecondary,
  },
  segmentedTextActive: {
    color: isDark ? '#0B0B0E' : '#FFFFFF',
    fontWeight: '800',
  },

  // KPI GRID (Stitch)
  kpiGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.lg,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    padding: Spacing.md + 2,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  kpiIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  kpiBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  kpiBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  kpiBadgePeriod: {
    fontSize: 10,
    color: Colors.textMuted,
  },

  // QUICK ACTIONS
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.xl,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 6,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  // MOVEMENTS
  movementsSection: {
    gap: Spacing.sm,
  },
  movementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  movementsList: {
    gap: 8,
  },
  movementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 12,
  },
  movementIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  movementDetails: {
    flex: 1,
    marginLeft: 12,
  },
  movementTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  movementMeta: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  movementAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  emptyCard: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
