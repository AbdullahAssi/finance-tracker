import { LinearGradient } from 'expo-linear-gradient';
import { router, Tabs } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { FONT, Text } from '../../components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../components/ui';
import { colors, shadow } from '../../lib/theme';

const BAR_BOTTOM = 16;
const BAR_HEIGHT = 64;
const ITEM = 52;

type BarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const TAB_ICONS: Record<string, [outline: string, filled: string]> = {
  index: ['home-outline', 'home'],
  transactions: ['list-outline', 'list'],
  summary: ['pie-chart-outline', 'pie-chart'],
  settings: ['settings-outline', 'settings'],
};

function PlusButton({ bottom }: { bottom: number }) {
  const [open, setOpen] = useState(false);
  const go = (type: 'expense' | 'income') => {
    setOpen(false);
    router.push({ pathname: '/add', params: { type } });
  };
  return (
    <View style={s.slot}>
      <Pressable onPress={() => setOpen(true)} accessibilityLabel="Add transaction">
        <LinearGradient colors={['#7CC6F9', colors.skyDeep]} style={s.plus}>
          <Icon name="add" size={28} color={colors.white} />
        </LinearGradient>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={s.overlay} onPress={() => setOpen(false)}>
          <View style={[s.menu, { bottom: bottom + BAR_HEIGHT + 22 }]}>
            <Pressable style={s.pill} onPress={() => go('income')}>
              <Icon name="arrow-down-outline" size={18} color={colors.income} />
              <Text style={s.pillText}>Add Income</Text>
            </Pressable>
            <Pressable style={s.pill} onPress={() => go('expense')}>
              <Icon name="arrow-up-outline" size={18} color={colors.expense} />
              <Text style={s.pillText}>Add Expense</Text>
            </Pressable>
          </View>
          <Pressable
            onPress={() => setOpen(false)}
            style={[s.close, { bottom: bottom + (BAR_HEIGHT - ITEM) / 2 }]}
            accessibilityLabel="Close menu"
          >
            <LinearGradient colors={['#9DD6FB', colors.sky]} style={s.plus}>
              <Icon name="close" size={26} color={colors.white} />
            </LinearGradient>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function FloatingTabBar({ state, navigation }: BarProps) {
  const insets = useSafeAreaInsets();
  const bottom = BAR_BOTTOM + insets.bottom;

  return (
    <View style={[s.bar, { bottom }]}>
      {state.routes.map((route, index) => {
        if (route.name === 'plus') return <PlusButton key={route.key} bottom={bottom} />;

        const focused = state.index === index;
        const [outline, filled] = TAB_ICONS[route.name] ?? ['ellipse-outline', 'ellipse'];
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={s.slot}
            android_ripple={{ color: 'rgba(58,155,234,0.15)', borderless: true, radius: 28 }}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
          >
            <View style={[s.iconWrap, focused && { backgroundColor: colors.skyTint }]}>
              <Icon name={focused ? filled : outline} size={24} color={focused ? colors.skyDeep : '#9AA8BA'} />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        // Absolute keeps the scene full-height; the custom bar floats over it
        tabBarStyle: { position: 'absolute' },
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { fontFamily: FONT.bold, color: colors.text },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ headerShown: false }} />
      <Tabs.Screen name="transactions" options={{ title: 'Transactions' }} />
      <Tabs.Screen name="plus" options={{ title: 'Add' }} />
      <Tabs.Screen name="summary" options={{ title: 'Monthly Summary' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}

const s = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    ...shadow,
  },
  slot: { flex: 1, height: BAR_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  iconWrap: { width: 46, height: 46, borderRadius: 23, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  plus: { width: ITEM, height: ITEM, borderRadius: ITEM / 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(244,248,252,0.94)' },
  menu: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: 12 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.white,
    paddingHorizontal: 22,
    height: 50,
    borderRadius: 25,
    ...shadow,
  },
  pillText: { fontSize: 15, fontWeight: '600', color: colors.text },
  close: { position: 'absolute', alignSelf: 'center' },
});
