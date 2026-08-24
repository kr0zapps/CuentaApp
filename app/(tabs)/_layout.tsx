import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, FontSize } from '@/constants/Colors';
import { useThemeStore } from '@/store/useThemeStore';
import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, color, size }: { name: IoniconsName; color: string; size: number }) {
  return <Ionicons name={name} size={size} color={color} />;
}

export default function TabsLayout() {
  const Colors = useThemeColors();
  const theme = useThemeStore((s) => s.theme);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: theme === 'light' ? 'rgba(255,255,255,0.85)' : 'transparent',
          borderTopColor: Colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
          elevation: 0,
        },
        tabBarBackground: () => (
          <BlurView
            tint={theme === 'light' ? 'light' : 'dark'}
            intensity={theme === 'light' ? 80 : 40}
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: FontSize.xs,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name={focused ? "home" : "home-outline"} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="compras"
        options={{
          title: 'Compras',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name={focused ? "bag" : "bag-outline"} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="produccion"
        options={{
          title: 'Producción',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name={focused ? "construct" : "construct-outline"} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="ventas"
        options={{
          title: 'Ventas',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name={focused ? "cash" : "cash-outline"} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="reportes"
        options={{
          title: 'Reportes',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name={focused ? "bar-chart" : "bar-chart-outline"} color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
