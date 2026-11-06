import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeColors, Spacing, Radius, FontSize } from '@/constants/Colors';

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  startDate: Date;
  endDate: Date;
  onApplyRange: (start: Date, end: Date, label: string) => void;
  initialTab?: 'mes' | 'rango';
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MESES_CORTOS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

export function DatePickerModal({
  visible,
  onClose,
  startDate,
  endDate,
  onApplyRange,
  initialTab = 'mes',
}: DatePickerModalProps) {
  const Colors = useThemeColors();

  const [activeTab, setActiveTab] = useState<'mes' | 'rango'>(initialTab);

  // Estado para modo 'mes'
  const [selectedYear, setSelectedYear] = useState<number>(() => startDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(() => startDate.getMonth());

  // Estado para modo 'rango' (calendario)
  const [viewYear, setViewYear] = useState<number>(() => startDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(() => startDate.getMonth());
  const [rangeStart, setRangeStart] = useState<Date>(() => new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()));
  const [rangeEnd, setRangeEnd] = useState<Date>(() => new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()));
  const [isPickingEnd, setIsPickingEnd] = useState<boolean>(false);

  // Al abrir el modal, sincronizar
  React.useEffect(() => {
    if (visible) {
      setSelectedYear(startDate.getFullYear());
      setSelectedMonth(startDate.getMonth());
      setViewYear(startDate.getFullYear());
      setViewMonth(startDate.getMonth());
      setRangeStart(new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()));
      setRangeEnd(new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()));
      setIsPickingEnd(false);
      setActiveTab(initialTab);
    }
  }, [visible, startDate, endDate, initialTab]);

  // Generar días del mes actual en vista
  const daysInViewMonth = useMemo(() => {
    const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();
    // Obtener qué día de la semana empieza el mes (0 domingo, 1 lunes... convertimos a lunes=0)
    let firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // 0=Lunes, 6=Domingo

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push(i);
    }
    return days;
  }, [viewYear, viewMonth]);

  const handlePrevMonthView = () => {
    Haptics.selectionAsync();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(v => v - 1);
    } else {
      setViewMonth(v => v - 1);
    }
  };

  const handleNextMonthView = () => {
    Haptics.selectionAsync();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(v => v + 1);
    } else {
      setViewMonth(v => v + 1);
    }
  };

  const handleDayPress = (day: number) => {
    Haptics.selectionAsync();
    const pressedDate = new Date(viewYear, viewMonth, day);

    if (!isPickingEnd) {
      // Marcamos nuevo inicio
      setRangeStart(pressedDate);
      setRangeEnd(pressedDate);
      setIsPickingEnd(true);
    } else {
      // Marcamos fin
      if (pressedDate < rangeStart) {
        // Si seleccionó una fecha anterior, invertimos
        setRangeEnd(rangeStart);
        setRangeStart(pressedDate);
      } else {
        setRangeEnd(pressedDate);
      }
      setIsPickingEnd(false);
    }
  };

  const handleSelectQuickMonth = (monthIdx: number) => {
    Haptics.selectionAsync();
    setSelectedMonth(monthIdx);
    const start = new Date(selectedYear, monthIdx, 1, 0, 0, 0, 0);
    const end = new Date(selectedYear, monthIdx + 1, 0, 23, 59, 59, 999);
    const label = `${MESES[monthIdx]} ${selectedYear}`;
    onApplyRange(start, end, label);
    onClose();
  };

  const handleApplyRange = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const start = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate(), 0, 0, 0, 0);
    const end = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate(), 23, 59, 59, 999);
    
    // Label
    const startStr = start.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' });
    const endStr = end.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const label = `${startStr} al ${endStr}`;
    
    onApplyRange(start, end, label);
    onClose();
  };

  const handlePreset = (preset: 'hoy' | 'ayer' | '7dias' | 'este_mes' | 'mes_pasado' | '30dias' | 'este_ano' | 'todo') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const now = new Date();
    let start: Date;
    let end: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    let label = '';

    switch (preset) {
      case 'hoy': {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        label = `Hoy (${now.toLocaleDateString('es-CL')})`;
        break;
      }
      case 'ayer': {
        const ayer = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        start = new Date(ayer.getFullYear(), ayer.getMonth(), ayer.getDate(), 0, 0, 0, 0);
        end = new Date(ayer.getFullYear(), ayer.getMonth(), ayer.getDate(), 23, 59, 59, 999);
        label = `Ayer (${ayer.toLocaleDateString('es-CL')})`;
        break;
      }
      case '7dias': {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
        label = 'Últimos 7 días';
        break;
      }
      case 'este_mes': {
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        label = `${MESES[now.getMonth()]} ${now.getFullYear()}`;
        break;
      }
      case 'mes_pasado': {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        label = `${MESES[start.getMonth()]} ${start.getFullYear()}`;
        break;
      }
      case '30dias': {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
        label = 'Últimos 30 días';
        break;
      }
      case 'este_ano': {
        start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        label = `Año ${now.getFullYear()}`;
        break;
      }
      case 'todo': {
        start = new Date(2020, 0, 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear() + 1, 11, 31, 23, 59, 59, 999);
        label = 'Histórico Completo';
        break;
      }
    }

    onApplyRange(start, end, label);
    onClose();
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection={['down']}
      animationIn="fadeInUp"
      animationOut="fadeOutDown"
      backdropOpacity={0.6}
      style={styles.modal}
    >
      <View style={[styles.container, { backgroundColor: Colors.bgCardElevated, borderColor: Colors.border }]}>
        {/* Handle bar */}
        <View style={[styles.dragHandle, { backgroundColor: Colors.border }]} />

        {/* Modal Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>Filtrar Reporte</Text>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: Colors.bgInput }]}>
            <Ionicons name="close" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Mode Selector Segmented Tabs */}
        <View style={[styles.tabSelector, { backgroundColor: Colors.bgInput }]}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'mes' && [styles.tabBtnActive, { backgroundColor: Colors.bgCard }]]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab('mes');
            }}
          >
            <Ionicons
              name="calendar"
              size={16}
              color={activeTab === 'mes' ? Colors.primary : Colors.textSecondary}
            />
            <Text
              style={[
                styles.tabBtnText,
                { color: activeTab === 'mes' ? Colors.primary : Colors.textSecondary },
                activeTab === 'mes' && styles.tabBtnTextActive,
              ]}
            >
              Por Mes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'rango' && [styles.tabBtnActive, { backgroundColor: Colors.bgCard }]]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab('rango');
            }}
          >
            <Ionicons
              name="calendar-number-outline"
              size={16}
              color={activeTab === 'rango' ? Colors.primary : Colors.textSecondary}
            />
            <Text
              style={[
                styles.tabBtnText,
                { color: activeTab === 'rango' ? Colors.primary : Colors.textSecondary },
                activeTab === 'rango' && styles.tabBtnTextActive,
              ]}
            >
              Rango de Fechas
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {activeTab === 'mes' ? (
            /* =================== TAB POR MES =================== */
            <View style={styles.tabContent}>
              {/* Year Selector */}
              <View style={[styles.yearSelectorRow, { borderBottomColor: Colors.border }]}>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedYear(y => y - 1);
                  }}
                  style={[styles.arrowBtn, { backgroundColor: Colors.bgInput }]}
                >
                  <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
                </TouchableOpacity>

                <Text style={[styles.yearTitle, { color: Colors.textPrimary }]}>{selectedYear}</Text>

                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedYear(y => y + 1);
                  }}
                  style={[styles.arrowBtn, { backgroundColor: Colors.bgInput }]}
                >
                  <Ionicons name="chevron-forward" size={20} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Month Grid */}
              <View style={styles.monthGrid}>
                {MESES.map((mes, idx) => {
                  const isCurrentSelection =
                    selectedMonth === idx &&
                    selectedYear === startDate.getFullYear();
                  const isCurrentActualMonth =
                    new Date().getMonth() === idx &&
                    new Date().getFullYear() === selectedYear;

                  return (
                    <TouchableOpacity
                      key={mes}
                      style={[
                        styles.monthCell,
                        { backgroundColor: Colors.bgInput, borderColor: Colors.border },
                        isCurrentSelection && { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
                      ]}
                      onPress={() => handleSelectQuickMonth(idx)}
                    >
                      <Text
                        style={[
                          styles.monthCellText,
                          { color: Colors.textPrimary },
                          isCurrentSelection && { color: Colors.primary, fontWeight: '800' },
                        ]}
                      >
                        {MESES_CORTOS[idx]}
                      </Text>
                      {isCurrentActualMonth && (
                        <View style={[styles.currentMonthDot, { backgroundColor: Colors.primary }]} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Current Month Quick Button */}
              <TouchableOpacity
                style={[styles.quickCurrentMonthBtn, { borderColor: Colors.border, backgroundColor: Colors.bgInput }]}
                onPress={() => {
                  const now = new Date();
                  setSelectedYear(now.getFullYear());
                  handleSelectQuickMonth(now.getMonth());
                }}
              >
                <Ionicons name="today-outline" size={18} color={Colors.primary} />
                <Text style={[styles.quickCurrentMonthText, { color: Colors.primary }]}>
                  Ir al Mes Actual ({MESES_CORTOS[new Date().getMonth()]} {new Date().getFullYear()})
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* =================== TAB RANGO DE FECHAS =================== */
            <View style={styles.tabContent}>
              {/* Presets Grid */}
              <Text style={[styles.sectionSubtitle, { color: Colors.textSecondary }]}>Atajos Rápidos</Text>
              <View style={styles.presetsGrid}>
                <TouchableOpacity style={[styles.presetPill, { backgroundColor: Colors.bgInput }]} onPress={() => handlePreset('hoy')}>
                  <Text style={[styles.presetText, { color: Colors.textPrimary }]}>Hoy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.presetPill, { backgroundColor: Colors.bgInput }]} onPress={() => handlePreset('ayer')}>
                  <Text style={[styles.presetText, { color: Colors.textPrimary }]}>Ayer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.presetPill, { backgroundColor: Colors.bgInput }]} onPress={() => handlePreset('7dias')}>
                  <Text style={[styles.presetText, { color: Colors.textPrimary }]}>7 días</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.presetPill, { backgroundColor: Colors.bgInput }]} onPress={() => handlePreset('este_mes')}>
                  <Text style={[styles.presetText, { color: Colors.textPrimary }]}>Este mes</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.presetPill, { backgroundColor: Colors.bgInput }]} onPress={() => handlePreset('mes_pasado')}>
                  <Text style={[styles.presetText, { color: Colors.textPrimary }]}>Mes anterior</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.presetPill, { backgroundColor: Colors.bgInput }]} onPress={() => handlePreset('30dias')}>
                  <Text style={[styles.presetText, { color: Colors.textPrimary }]}>30 días</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.presetPill, { backgroundColor: Colors.bgInput }]} onPress={() => handlePreset('este_ano')}>
                  <Text style={[styles.presetText, { color: Colors.textPrimary }]}>Este año</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.presetPill, { backgroundColor: Colors.bgInput }]} onPress={() => handlePreset('todo')}>
                  <Text style={[styles.presetText, { color: Colors.textPrimary }]}>Todo</Text>
                </TouchableOpacity>
              </View>

              {/* Rango Visual Indicator */}
              <View style={[styles.rangeIndicatorBox, { backgroundColor: Colors.bgInput, borderColor: Colors.border }]}>
                <View style={styles.rangeColumn}>
                  <Text style={[styles.rangeColLabel, { color: Colors.textSecondary }]}>DESDE</Text>
                  <Text style={[styles.rangeColValue, { color: Colors.textPrimary }]}>
                    {rangeStart.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={18} color={Colors.primary} />
                <View style={styles.rangeColumn}>
                  <Text style={[styles.rangeColLabel, { color: Colors.textSecondary }]}>HASTA</Text>
                  <Text style={[styles.rangeColValue, { color: Colors.textPrimary }]}>
                    {rangeEnd.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </Text>
                </View>
              </View>

              {/* Mini Calendar Navigator */}
              <View style={styles.calendarCard}>
                <View style={styles.calendarNav}>
                  <TouchableOpacity onPress={handlePrevMonthView} style={[styles.arrowBtn, { backgroundColor: Colors.bgInput }]}>
                    <Ionicons name="chevron-back" size={18} color={Colors.textPrimary} />
                  </TouchableOpacity>
                  <Text style={[styles.calendarMonthTitle, { color: Colors.textPrimary }]}>
                    {MESES[viewMonth]} {viewYear}
                  </Text>
                  <TouchableOpacity onPress={handleNextMonthView} style={[styles.arrowBtn, { backgroundColor: Colors.bgInput }]}>
                    <Ionicons name="chevron-forward" size={18} color={Colors.textPrimary} />
                  </TouchableOpacity>
                </View>

                {/* Days of week header */}
                <View style={styles.dowRow}>
                  {DIAS_SEMANA.map((d, i) => (
                    <Text key={i} style={[styles.dowText, { color: Colors.textMuted }]}>{d}</Text>
                  ))}
                </View>

                {/* Days Grid */}
                <View style={styles.daysGrid}>
                  {daysInViewMonth.map((day, i) => {
                    if (day === null) {
                      return <View key={`empty-${i}`} style={styles.dayCellEmpty} />;
                    }

                    const thisDate = new Date(viewYear, viewMonth, day);
                    const isStart = thisDate.toDateString() === rangeStart.toDateString();
                    const isEnd = thisDate.toDateString() === rangeEnd.toDateString();
                    const isInBetween = thisDate > rangeStart && thisDate < rangeEnd;
                    const isSelected = isStart || isEnd;

                    return (
                      <TouchableOpacity
                        key={`day-${day}`}
                        style={[
                          styles.dayCell,
                          isInBetween && { backgroundColor: Colors.primaryMuted },
                          isSelected && [styles.dayCellSelected, { backgroundColor: Colors.primary }],
                        ]}
                        onPress={() => handleDayPress(day)}
                      >
                        <Text
                          style={[
                            styles.dayCellText,
                            { color: Colors.textPrimary },
                            isInBetween && { color: Colors.primary, fontWeight: '700' },
                            isSelected && { color: '#000000', fontWeight: '800' },
                          ]}
                        >
                          {day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Apply Button */}
              <TouchableOpacity
                style={[styles.applyBtn, { backgroundColor: Colors.primary }]}
                onPress={handleApplyRange}
              >
                <Text style={styles.applyBtnText}>Aplicar Rango de Fechas</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '90%',
    paddingBottom: Spacing.xl,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabSelector: {
    flexDirection: 'row',
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    borderRadius: Radius.lg,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  tabBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  tabContent: {
    gap: Spacing.md,
  },
  yearSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  yearTitle: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  monthCell: {
    width: '31%',
    height: 52,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  monthCellText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  currentMonthDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    position: 'absolute',
    bottom: 6,
  },
  quickCurrentMonthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginTop: Spacing.sm,
  },
  quickCurrentMonthText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  presetText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  rangeIndicatorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginTop: Spacing.xs,
  },
  rangeColumn: {
    alignItems: 'center',
    gap: 2,
  },
  rangeColLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  rangeColValue: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  calendarCard: {
    paddingVertical: Spacing.sm,
  },
  calendarNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  calendarMonthTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  dowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    marginBottom: 4,
  },
  dowText: {
    width: '13%',
    textAlign: 'center',
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 4,
  },
  dayCellEmpty: {
    width: '13%',
    height: 38,
  },
  dayCell: {
    width: '13%',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  dayCellSelected: {
    borderRadius: Radius.md,
  },
  dayCellText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  applyBtn: {
    height: 52,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  applyBtnText: {
    color: '#000000',
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
