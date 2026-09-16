import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

import { useThemeColors, Spacing, Radius, FontSize  } from '@/constants/Colors';
import { useMemo } from 'react';
import { TarjetaMonto } from '@/components/ui/TarjetaMonto';
import { useVentasPorPeriodo, PeriodoFiltro } from '@/store/useVentasStore';
import { useComprasPorPeriodo } from '@/store/useComprasStore';
import { formatCLP } from '@/utils/formatCLP';
import { useThemeStore } from '@/store/useThemeStore';

function getNombreMes(): string {
  return new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
}

export default function Dashboard() {
  const Colors = useThemeColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const [mostrarSaldo, setMostrarSaldo] = useState(true);
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('mes');

  const theme = useThemeStore((s) => s.theme);
  const toggleAppTheme = useThemeStore((s) => s.toggleTheme);

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
  const mesActual = getNombreMes();

  const subtituloPeriodo = useMemo(() => {
    switch (periodo) {
      case 'hoy': return 'hoy';
      case 'ayer': return 'ayer';
      case 'semana': return 'últimos 7 días';
      case 'mes': return 'este mes';
      case 'todo': return 'en total';
    }
  }, [periodo]);

  const periodoEtiqueta = useMemo(() => {
    switch (periodo) {
      case 'hoy': return 'Hoy';
      case 'ayer': return 'Ayer';
      case 'semana': return '7 Días';
      case 'mes': return 'Este Mes';
      case 'todo': return 'Histórico';
    }
  }, [periodo]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.bg, Colors.bgGradientEnd]}
        style={StyleSheet.absoluteFill}
      />
      
      <SafeAreaView style={styles.safe}>
        <ScrollView 
          style={styles.scroll} 
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
        >
          {/* HEADER PREMIUM */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                style={styles.avatarContainer}
              >
                <Text style={styles.avatarText}>AR</Text>
              </LinearGradient>
              <View>
                <Text style={styles.saludo}>Hola, Artesano 👋</Text>
                <Text style={styles.mes}>{mesActual}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleAppTheme(); }} style={styles.eyeBtn}>
                <BlurView intensity={40} tint="dark" style={styles.eyeBtnBlur}>
                  <Ionicons name={theme === 'light' ? "moon" : "sunny"} size={22} color={Colors.textPrimary} />
                </BlurView>
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleSaldo} style={styles.eyeBtn}>
                <BlurView intensity={40} tint="dark" style={styles.eyeBtnBlur}>
                  <Ionicons name={mostrarSaldo ? "eye-outline" : "eye-off-outline"} size={22} color={Colors.textPrimary} />
                </BlurView>
              </TouchableOpacity>
            </View>
          </View>

          {/* SELECTOR DE PERÍODO */}
          <View style={styles.periodoContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodoScroll}>
              {[
                { key: 'hoy', label: 'Hoy' },
                { key: 'ayer', label: 'Ayer' },
                { key: 'semana', label: '7 días' },
                { key: 'mes', label: 'Este mes' },
                { key: 'todo', label: 'Histórico' },
              ].map((item) => {
                const isSelected = periodo === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.periodoChip,
                      isSelected && styles.periodoChipActive
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setPeriodo(item.key as PeriodoFiltro);
                    }}
                    activeOpacity={0.7}
                  >
                    {isSelected && (
                      <LinearGradient
                        colors={[Colors.primary, Colors.primaryDark || Colors.primary]}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      />
                    )}
                    <Text style={[styles.periodoChipText, isSelected && styles.periodoChipTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* BALANCE APPLE CARD STYLE */}
          <TouchableOpacity activeOpacity={0.9} onPress={toggleSaldo}>
            <LinearGradient
              colors={esGanancia ? ['#2A362E', '#16231A'] : ['#3A2424', '#231515']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.heroGlow} />
              <View style={styles.heroHeader}>
                <Text style={styles.balanceTitulo}>Balance • {periodoEtiqueta}</Text>
                <View style={[styles.badgeBalance, { backgroundColor: esGanancia ? 'rgba(78,222,163,0.15)' : 'rgba(255,142,135,0.15)' }]}>
                  <Ionicons name={esGanancia ? "trending-up" : "trending-down"} size={14} color={esGanancia ? Colors.success : Colors.danger} />
                  <Text style={[styles.badgeText, { color: esGanancia ? Colors.success : Colors.danger }]}>
                    {esGanancia ? 'Positivo' : 'Negativo'}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.balanceMonto}>
                {mostrarSaldo ? formatCLP(balance) : '********'}
              </Text>
              <Text style={styles.balanceSubtitulo}>
                {esGanancia ? `+${formatCLP(balance)} ${subtituloPeriodo}` : `-${formatCLP(Math.abs(balance))} ${subtituloPeriodo}`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* TARJETAS RESUMEN (Glassmorphism) */}
          <View style={styles.tarjetasRow}>
            <View style={styles.glassCardWrapper}>
              <BlurView intensity={20} tint="dark" style={styles.glassCard}>
                <View style={[styles.iconoCirculo, { backgroundColor: 'rgba(78,222,163,0.15)' }]}>
                  <Ionicons name="arrow-up" size={18} color={Colors.success} />
                </View>
                <Text style={styles.glassTitulo}>Ingresos</Text>
                <Text style={[styles.glassMonto, { color: Colors.success }]}>
                  {mostrarSaldo ? formatCLP(totalVentas) : '****'}
                </Text>
              </BlurView>
            </View>
            <View style={styles.glassCardWrapper}>
              <BlurView intensity={20} tint="dark" style={styles.glassCard}>
                <View style={[styles.iconoCirculo, { backgroundColor: 'rgba(255,142,135,0.15)' }]}>
                  <Ionicons name="arrow-down" size={18} color={Colors.danger} />
                </View>
                <Text style={styles.glassTitulo}>Gastos</Text>
                <Text style={[styles.glassMonto, { color: Colors.danger }]}>
                  {mostrarSaldo ? formatCLP(totalCompras) : '****'}
                </Text>
              </BlurView>
            </View>
          </View>

          {/* QUICK ACTIONS HORIZONTAL */}
          <Text style={styles.seccionTitulo}>Acciones Rápidas</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.accionesRow}>
            <TouchableOpacity
              style={styles.accionBtn}
              activeOpacity={0.7}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.navigate({ pathname: '/ventas', params: { openModal: 'true' } }); }}
            >
              <LinearGradient colors={['#4EDEA3', '#2CA876']} style={styles.accionGradient}>
                <Ionicons name="cash" size={26} color="#000" />
              </LinearGradient>
              <Text style={styles.accionTexto}>Vender</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.accionBtn}
              activeOpacity={0.7}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.navigate({ pathname: '/compras', params: { openModal: 'true' } }); }}
            >
              <LinearGradient colors={['#FF8E87', '#D15850']} style={styles.accionGradient}>
                <Ionicons name="cart" size={26} color="#000" />
              </LinearGradient>
              <Text style={styles.accionTexto}>Gastar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.accionBtn}
              activeOpacity={0.7}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.navigate({ pathname: '/produccion', params: { openModal: 'true' } }); }}
            >
              <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.accionGradient}>
                <Ionicons name="hammer" size={26} color="#000" />
              </LinearGradient>
              <Text style={styles.accionTexto}>Producir</Text>
            </TouchableOpacity>
            
            <View style={{ width: 20 }} />
          </ScrollView>

          {/* ACTIVIDAD RECIENTE REDISEÑADA */}
          <View style={styles.actividadHeader}>
            <Text style={styles.seccionTitulo}>Movimientos ({periodoEtiqueta})</Text>
            <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.navigate('/(tabs)/reportes'); }}>
              <Text style={styles.verTodo}>Ver reportes</Text>
            </TouchableOpacity>
          </View>
          
          {(() => {
            const movimientos = [...ventasRecientes.map(v => ({...v, _tipo: 'venta'})), ...comprasRecientes.map(c => ({...c, _tipo: 'compra'}))]
              .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
              .slice(0, 5);

            if (movimientos.length === 0) {
              return (
                <View style={styles.emptyMovimientos}>
                  <Ionicons name="calendar-outline" size={26} color={Colors.textSecondary} />
                  <Text style={styles.emptyMovimientosText}>Sin movimientos registrados ({subtituloPeriodo})</Text>
                </View>
              );
            }

            return (
              <View style={styles.listaContenedor}>
                {movimientos.map((item) => (
                  <View key={`${item._tipo}-${item.id}`} style={styles.listaItemFloating}>
                    <View style={[styles.listaIcono, { backgroundColor: item._tipo === 'venta' ? 'rgba(78,222,163,0.1)' : 'rgba(255,142,135,0.1)' }]}>
                      <Ionicons name={item._tipo === 'venta' ? "trending-up" : "trending-down"} size={20} color={item._tipo === 'venta' ? Colors.success : Colors.danger} />
                    </View>
                    <View style={styles.listaInfo}>
                      <Text style={styles.listaTexto}>
                        {item._tipo === 'venta' ? (item as any).producto : (item as any).categoria}
                      </Text>
                      <Text style={styles.listaFecha}>
                        {new Date(item.fecha).toLocaleString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        {item._tipo === 'venta' 
                          ? (item as any).cliente ? ` • ${(item as any).cliente}` : ''
                          : (item as any).proveedor ? ` • ${(item as any).proveedor}` : ''}
                      </Text>
                    </View>
                    <Text style={[styles.listaMonto, { color: item._tipo === 'venta' ? Colors.success : Colors.textPrimary }]}>
                      {item._tipo === 'venta' ? '+' : '-'}{mostrarSaldo ? formatCLP((item as any).total || (item as any).monto) : '***'}
                    </Text>
                  </View>
                ))}
              </View>
            );
          })()}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const makeStyles = (Colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: 100 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  avatarText: { color: '#000', fontWeight: '900', fontSize: 18 },
  saludo: { fontSize: FontSize.md, color: Colors.textSecondary },
  mes: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary, textTransform: 'capitalize' },
  eyeBtn: { overflow: 'hidden', borderRadius: Radius.full },
  eyeBtnBlur: { padding: 10 },

  periodoContainer: {
    marginBottom: Spacing.lg,
  },
  periodoScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  periodoChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodoChipActive: {
    borderColor: Colors.primary,
  },
  periodoChipText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  periodoChipTextActive: {
    color: '#000',
    fontWeight: '700',
  },

  heroCard: {
    borderRadius: 24,
    padding: Spacing.xl,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  heroGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  balanceTitulo: { fontSize: FontSize.md, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  badgeBalance: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  badgeText: { fontSize: FontSize.xs, fontWeight: '800' },
  balanceMonto: { fontSize: 42, fontWeight: '900', color: '#FFF', letterSpacing: -1.5 },
  balanceSubtitulo: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.5)', marginTop: 8 },

  tarjetasRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  glassCardWrapper: { flex: 1, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  glassCard: { padding: Spacing.lg },
  iconoCirculo: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  glassTitulo: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 4 },
  glassMonto: { fontSize: FontSize.lg, fontWeight: '800' },

  seccionTitulo: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.md, letterSpacing: 0.5 },
  
  accionesRow: { flexDirection: 'row', marginBottom: Spacing.xl, paddingRight: Spacing.xl },
  accionBtn: { alignItems: 'center', marginRight: Spacing.lg },
  accionGradient: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  accionTexto: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },

  actividadHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  verTodo: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '700' },
  
  emptyMovimientos: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  emptyMovimientosText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: 4,
  },

  listaContenedor: { gap: Spacing.sm },
  listaItemFloating: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  listaIcono: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  listaInfo: { flex: 1, marginLeft: Spacing.md },
  listaTexto: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: '700' },
  listaFecha: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 4 },
  listaMonto: { fontSize: FontSize.lg, fontWeight: '800' },
});
