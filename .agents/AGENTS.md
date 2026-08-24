# CuentApp — Reglas del Proyecto

## Contexto
App de contabilidad nativa para artesanos de cuero chilenos. Desarrollada con Expo React Native + TypeScript.

## Reglas Globales

- **Moneda**: Siempre usar pesos chilenos (CLP). Usar `formatCLP()` de `utils/formatCLP.ts`.
- **Tema**: Dark mode obligatorio. Usar siempre los colores de `constants/colors.ts`.
- **Estado**: Toda la data se guarda localmente con Zustand + AsyncStorage. No hay backend.
- **TypeScript estricto**: Nunca usar `any`. Siempre tipar props, estados y retornos.
- **Componentes pequeños**: Máximo 100 líneas por componente. Extraer lógica a hooks.
- **Iconos**: Solo `Ionicons` de `@expo/vector-icons`.
- **Listas**: Siempre `FlatList`, nunca `ScrollView + .map()` para datos dinámicos.
- **Formularios**: Label visible sobre el input. Validación con mensaje en rojo debajo.
- **Idioma del código**: Variables y funciones en **español** (ej: `compras`, `ventas`, `monto`).
- **Idioma de la UI**: Todo el texto visible en **español chileno**.

## Skills Activas
- `expo-react-native` — Arquitectura y buenas prácticas generales
- `premium-mobile-ui` — Sistema de diseño oscuro premium
- `clp-currency` — Manejo de pesos chilenos
- `zustand-asyncstorage` — Persistencia offline con Zustand
