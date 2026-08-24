---
name: premium-mobile-ui
description: Guidelines for building visually stunning, premium dark-mode mobile UIs in React Native. Applies to all screens, components and layouts.
---

# Premium Mobile UI Design — React Native

## Design Philosophy
The UI must feel **premium, modern, and intentional**. Every screen should look like it belongs in a paid app on the App Store. Avoid generic, plain, or "tutorial-style" layouts.

## Color System (Dark Mode)
Use this exact palette defined in `constants/colors.ts`:

```ts
export const Colors = {
  // Backgrounds
  bg: '#0D0D0D',
  bgCard: '#1A1A1A',
  bgCardElevated: '#242424',
  bgInput: '#1F1F1F',

  // Brand — ámbar cuero
  primary: '#D4A843',
  primaryMuted: '#D4A84322',
  primaryDark: '#A07820',

  // Semantic
  success: '#4CAF82',
  danger: '#E05C5C',
  warning: '#E8A020',

  // Text
  textPrimary: '#F0F0F0',
  textSecondary: '#9A9A9A',
  textMuted: '#555555',

  // Borders
  border: '#2A2A2A',
  borderFocus: '#D4A843',
};
```

## Typography
- Use `fontWeight: '700'` for headings, `'500'` for labels, `'400'` for body
- Title sizes: 28 (hero), 22 (section), 18 (card title), 15 (body), 13 (caption)
- Line height: always 1.4–1.6x the font size
- Never use all-caps for body text — only for small labels/tags

## Layout Principles
- Screen padding: `horizontal: 20, top: 16, bottom: 24`
- Card border radius: `16`
- Button border radius: `12`
- Input border radius: `10`
- Gap between cards: `12`
- Section title margin bottom: `12`

## Cards
```tsx
// Standard card style
card: {
  backgroundColor: Colors.bgCard,
  borderRadius: 16,
  padding: 16,
  borderWidth: 1,
  borderColor: Colors.border,
}
```

## Shadows (Android elevation + iOS shadow)
```ts
shadow: {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 8,
}
```

## Buttons
- **Primary**: background `Colors.primary`, text dark `#0D0D0D`, bold
- **Secondary**: border `Colors.border`, text `Colors.textPrimary`
- **Danger**: background `Colors.danger`
- Always include `activeOpacity={0.8}` on `TouchableOpacity`
- Minimum height: `52px`

## Icons
- Use `Ionicons` from `@expo/vector-icons` exclusively
- Icon size in tab bar: `24`
- Icon size in cards/headers: `20–24`
- Icon color: match the context (primary, secondary, danger)

## Lists
- Use `FlatList` with `ItemSeparatorComponent`
- Show empty state with icon + message when list is empty
- Use `onRefresh` + `refreshing` prop for pull-to-refresh

## Animations & Micro-interactions
- Use `Animated.spring()` for entrance animations
- Use `LayoutAnimation.configureNext()` for list changes
- Add `expo-haptics` feedback on: form submit, delete, important toggles
- Tab bar icons should scale on press (use `Animated.Value`)

## Forms
- Label above input, not placeholder-only
- Show validation errors below the input in red (`Colors.danger`)
- Use numeric keyboard (`keyboardType="numeric"`) for money fields
- Focus next input on `returnKeyType="next"`

## Money Display
- Always format CLP with `$` prefix and thousands separator
- Positive amounts: `Colors.success` green
- Negative amounts / losses: `Colors.danger` red
- Zero: `Colors.textSecondary`

## Header
- Each screen has a header with:
  - Left: Screen title (large, bold)
  - Right: Optional action button or icon
- Use `SafeAreaView` always — never let content go behind status bar

## Empty States
- Never show a blank screen — always show an illustration + message
- Use the `EmptyState` component with an Ionicon, title, and subtitle
