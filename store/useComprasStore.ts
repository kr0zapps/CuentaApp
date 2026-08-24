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
export function useComprasDelMes() {
  const compras = useComprasStore((s) => s.compras);
  const now = new Date();
  return compras.filter((c) => {
    const d = new Date(c.fecha);
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  });
}

export function useTotalComprasMes() {
  const compras = useComprasDelMes();
  return compras.reduce((sum, c) => sum + c.monto, 0);
}
