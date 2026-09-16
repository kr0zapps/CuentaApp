import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ItemProduccion } from '@/types';

interface ProduccionState {
  items: ItemProduccion[];
  addItem: (data: Omit<ItemProduccion, 'id' | 'fecha'>) => void;
  updateItem: (id: string, data: Omit<ItemProduccion, 'id' | 'fecha'>) => void;
  removeItem: (id: string) => void;
  toggleStock: (id: string) => void;
  updateStock: (id: string, newQty: number) => void;
  deductStock: (id: string, qty: number) => void;
  clearAll: () => void;
}

export const useProduccionStore = create<ProduccionState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (data) => {
        const cantidad = Math.max(0, Number(data.cantidad) || 0);
        const nuevo: ItemProduccion = {
          id: Date.now().toString(),
          fecha: new Date().toISOString(),
          ...data,
          cantidad,
          enStock: cantidad > 0,
        };
        set((state) => ({ items: [nuevo, ...state.items] }));
      },

      updateItem: (id, data) =>
        set((state) => ({
          items: state.items.map((i) => {
            if (i.id === id) {
              const cantidad = data.cantidad !== undefined ? Math.max(0, Number(data.cantidad) || 0) : i.cantidad;
              // If cantidad is 0, enStock is ALWAYS false
              // If cantidad > 0, it becomes true (especially when renewing/replenishing stock) unless explicitly set to false
              let enStock = cantidad > 0;
              if (data.enStock !== undefined) {
                enStock = cantidad > 0 ? data.enStock : false;
              } else if (i.cantidad === 0 && cantidad > 0) {
                enStock = true;
              } else if (!i.enStock && cantidad > 0) {
                enStock = true;
              }
              return { ...i, ...data, cantidad, enStock, fecha: new Date().toISOString() };
            }
            return i;
          }),
        })),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),

      toggleStock: (id) =>
        set((state) => ({
          items: state.items.map((i) => {
            if (i.id === id) {
              // A product with 0 stock can NEVER be active/in stock
              if (i.cantidad <= 0) {
                return { ...i, enStock: false };
              }
              return { ...i, enStock: !i.enStock };
            }
            return i;
          }),
        })),

      updateStock: (id, newQty) =>
        set((state) => ({
          items: state.items.map((i) => {
            if (i.id === id) {
              const cantidad = Math.max(0, Number(newQty) || 0);
              return {
                ...i,
                cantidad,
                enStock: cantidad > 0,
                fecha: new Date().toISOString(),
              };
            }
            return i;
          }),
        })),

      deductStock: (id, qty) =>
        set((state) => ({
          items: state.items.map((i) => {
            if (i.id === id) {
              const newQty = Math.max(0, i.cantidad - qty);
              return { ...i, cantidad: newQty, enStock: newQty > 0 };
            }
            return i;
          }),
        })),

      clearAll: () => set({ items: [] }),
    }),
    {
      name: 'produccion-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export function useItemsEnStock() {
  const items = useProduccionStore((s) => s.items);
  return items.filter((i) => i.enStock !== false && i.cantidad > 0);
}
