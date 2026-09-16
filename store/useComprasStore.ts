import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Compra } from '@/types';

interface ComprasState {
  compras: Compra[];
  addCompra: (data: Omit<Compra, 'id' | 'fecha'>) => void;
  removeCompra: (id: string) => void;
  clearAll: () => void;
}

export const useComprasStore = create<ComprasState>()(
  persist(
    (set) => ({
      compras: [],

      addCompra: (data) => {
        const nueva: Compra = {
          id: Date.now().toString(),
          fecha: new Date().toISOString(),
          ...data,
        };
        set((state) => ({ compras: [nueva, ...state.compras] }));
      },

      removeCompra: (id) =>
        set((state) => ({
          compras: state.compras.filter((c) => c.id !== id),
        })),

      clearAll: () => set({ compras: [] }),
    }),
    {
      name: 'compras-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Selectores derivados
export type PeriodoFiltro = 'hoy' | 'ayer' | 'semana' | 'mes' | 'todo';

export function filtrarComprasPorPeriodo(compras: Compra[], periodo: PeriodoFiltro): Compra[] {
  const now = new Date();
  const hoyStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const hoyEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  return compras.filter((c) => {
    const d = new Date(c.fecha);
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

export function useComprasDelMes() {
  const compras = useComprasStore((s) => s.compras);
  return filtrarComprasPorPeriodo(compras, 'mes');
}

export function useTotalComprasMes() {
  const compras = useComprasDelMes();
  return compras.reduce((sum, c) => sum + c.monto, 0);
}

export function useComprasPorPeriodo(periodo: PeriodoFiltro) {
  const compras = useComprasStore((s) => s.compras);
  return filtrarComprasPorPeriodo(compras, periodo);
}

export function useTotalComprasPeriodo(periodo: PeriodoFiltro) {
  const compras = useComprasPorPeriodo(periodo);
  return compras.reduce((sum, c) => sum + c.monto, 0);
}
