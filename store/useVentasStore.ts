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
export function useVentasDelMes() {
  const ventas = useVentasStore((s) => s.ventas);
  const now = new Date();
  return ventas.filter((v) => {
    const d = new Date(v.fecha);
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  });
}

export function useTotalVentasMes() {
  const ventas = useVentasDelMes();
  return ventas.reduce((sum, v) => sum + v.total, 0);
}

