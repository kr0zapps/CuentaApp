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
        const nuevo: ItemProduccion = {
          id: Date.now().toString(),
          fecha: new Date().toISOString(),
          ...data,
        };
        set((state) => ({ items: [nuevo, ...state.items] }));
      },

      updateItem: (id, data) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, ...data } : i
          ),
        })),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),

      toggleStock: (id) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, enStock: !i.enStock } : i
          ),
        })),

      updateStock: (id, newQty) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id
              ? { ...i, cantidad: newQty, enStock: newQty > 0 }
              : i
          ),
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
  return items.filter((i) => i.enStock);
}
