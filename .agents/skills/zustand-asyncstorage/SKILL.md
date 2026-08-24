---
name: zustand-asyncstorage
description: Pattern for using Zustand with AsyncStorage persistence in React Native Expo apps. All stores must follow this pattern for offline-first data storage.
---

# Zustand + AsyncStorage — Offline-First Data Store

## Why This Pattern
- Data lives on the device — no server, no internet required
- Zustand provides simple, reactive global state
- AsyncStorage persists data between app restarts
- This is the standard pattern for offline-first mobile apps

## Store Template

```ts
// store/useXxxStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface XxxItem {
  id: string;
  fecha: string; // ISO string
  monto: number; // CLP integer
  // ... other fields
}

interface XxxState {
  items: XxxItem[];
  isLoading: boolean;
  // Actions
  addItem: (item: Omit<XxxItem, 'id' | 'fecha'>) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<XxxItem>) => void;
  clearAll: () => void;
}

export const useXxxStore = create<XxxState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      addItem: (data) => {
        const newItem: XxxItem = {
          id: Date.now().toString(),
          fecha: new Date().toISOString(),
          ...data,
        };
        set((state) => ({ items: [newItem, ...state.items] }));
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      updateItem: (id, updates) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));
      },

      clearAll: () => set({ items: [] }),
    }),
    {
      name: 'xxx-storage', // unique key in AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

## Selectors Pattern
Always create selector hooks to avoid over-rendering:

```ts
// Derived data — computed from store
export function useItemsThisMonth() {
  const items = useXxxStore((state) => state.items);
  const now = new Date();
  return items.filter((item) => {
    const d = new Date(item.fecha);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
}

export function useTotalThisMonth() {
  const items = useItemsThisMonth();
  return items.reduce((sum, item) => sum + item.monto, 0);
}
```

## Rules
- Every store key in AsyncStorage must be **unique** (use `compras-storage`, `ventas-storage`, etc.)
- IDs are generated with `Date.now().toString()` — simple and unique enough for local data
- Dates are always stored as **ISO strings** — never Date objects
- Never mutate state directly — always use `set()`
- Actions should be **synchronous** — AsyncStorage persistence is handled by middleware automatically

## Store Files
- `store/useComprasStore.ts` — compras de fardos y materiales
- `store/useVentasStore.ts` — ventas de productos
- `store/useProduccionStore.ts` — registro de producción
- `store/useConfigStore.ts` — configuración (nombre taller, tipos de producto)
