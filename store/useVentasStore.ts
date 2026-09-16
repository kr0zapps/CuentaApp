import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Venta } from '@/types';

interface VentasState {
  ventas: Venta[];
  addVenta: (data: Omit<Venta, 'id' | 'fecha' | 'total'>) => void;
  removeVenta: (id: string) => void;
  clearAll: () => void;
}

export const useVentasStore = create<VentasState>()(
  persist(
    (set) => ({
      ventas: [],

      addVenta: (data) => {
        const total = data.precioUnitario * data.cantidad;
        const nueva: Venta = {
          id: Date.now().toString(),
          fecha: new Date().toISOString(),
          total,
          ...data,
        };
        set((state) => ({ ventas: [nueva, ...state.ventas] }));
      },

      removeVenta: (id) =>
        set((state) => ({
          ventas: state.ventas.filter((v) => v.id !== id),
        })),

      clearAll: () => set({ ventas: [] }),
    }),
    {
      name: 'ventas-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Selectores derivados
export type PeriodoFiltro = 'hoy' | 'ayer' | 'semana' | 'mes' | 'todo';

export function filtrarVentasPorPeriodo(ventas: Venta[], periodo: PeriodoFiltro): Venta[] {
  const now = new Date();
  const hoyStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const hoyEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  return ventas.filter((v) => {
    const d = new Date(v.fecha);
    if (isNaN(d.getTime())) return false;

    if (periodo === 'hoy') {
      return d >= hoyStart && d <= hoyEnd;
    }
    if (periodo === 'ayer') {
      const ayerStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      const ayerEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      return d >= ayerStart && d <= ayerEnd;
    }
    if (periodo === 'semana') {
      const semanaStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
      return d >= semanaStart && d <= hoyEnd;
    }
    if (periodo === 'mes') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true; // 'todo'
  });
}

export function useVentasDelMes() {
  const ventas = useVentasStore((s) => s.ventas);
  return filtrarVentasPorPeriodo(ventas, 'mes');
}

export function useTotalVentasMes() {
  const ventas = useVentasDelMes();
  return ventas.reduce((sum, v) => sum + v.total, 0);
}

export function useVentasPorPeriodo(periodo: PeriodoFiltro) {
  const ventas = useVentasStore((s) => s.ventas);
  return filtrarVentasPorPeriodo(ventas, periodo);
}

export function useTotalVentasPeriodo(periodo: PeriodoFiltro) {
  const ventas = useVentasPorPeriodo(periodo);
  return ventas.reduce((sum, v) => sum + v.total, 0);
}

