---
name: expo-react-native
description: Best practices for building production-quality Expo React Native apps with TypeScript, Expo Router, and native components.
---

# Expo React Native Best Practices

## Project Structure
- Use **Expo Router** (file-based routing) — never use React Navigation manually
- Place screens in `app/(tabs)/` for tab navigation
- Place reusable components in `components/ui/` and `components/charts/`
- Place business logic in `store/` (Zustand stores)
- Place utilities in `utils/`
- Place constants (colors, sizes, strings) in `constants/`

## TypeScript Rules
- Always use TypeScript (`.tsx` for components, `.ts` for logic)
- Define types in a `types/` folder or at the top of the file
- Never use `any` — always type properly
- Use `interface` for object shapes, `type` for unions/primitives

## Component Rules
- Every component must be a **named export** (no default anonymous functions)
- Use `React.FC<Props>` or explicit return type `JSX.Element`
- Keep components small — max ~100 lines per component
- Extract repeated logic into custom hooks (`hooks/useXxx.ts`)
- Never put business logic directly in JSX — use handlers and computed values

## Styling Rules
- ALWAYS use `StyleSheet.create({})` — never inline style objects
- Use `constants/colors.ts` for all color values — no hardcoded hex strings in components
- Use `constants/sizes.ts` for spacing and font sizes
- Support both light and dark mode using `useColorScheme()`

## Navigation
- Use `expo-router` Link and `router.push()` for navigation
- Use typed routes with `href` prop
- Define tab icons in `app/(tabs)/_layout.tsx`

## Data & State
- Use **Zustand** for global state management
- Persist all stores with `zustand/middleware` + `AsyncStorage`
- Never fetch data inside a component directly — use store actions
- Separate reads (selectors) from writes (actions) in stores

## Performance
- Use `useMemo` and `useCallback` for expensive computations
- Use `FlatList` instead of `ScrollView + map()` for long lists
- Lazy load heavy components with `React.lazy` or dynamic imports
- Avoid anonymous functions in JSX props

## Error Handling
- Wrap risky operations in try/catch
- Show user-facing error messages with `Alert.alert()`
- Log errors to console in dev, suppress in production

## Expo Specific
- Use `expo-constants` for app config values
- Use `expo-haptics` for tactile feedback on important actions
- Use `@expo/vector-icons` (Ionicons) for all icons — consistent set
- Test on real device via Expo Go over WiFi during development
