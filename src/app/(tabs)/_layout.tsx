import { LinearGradient } from 'expo-linear-gradient';
import { router, Tabs } from 'expo-router';
import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, View } from 'react-native';
import { FONT, Text } from '../../components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../components/ui';
import { colors, shadow, themedStyles } from '../../lib/theme';

const BAR_BOTTOM = 16;
const BAR_HEIGHT = 64;
const ITEM = 52;
const BAR_PAD = 8;
const ICON_BUBBLE = 46;

type BarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const TAB_ICONS: Record<string, [outline: string, filled: string]> = {
  index: ['home-outline', 'home'],
  transactions: ['list-outline', 'list'],
  summary: ['pie-chart-outline', 'pie-chart'],
  settings: ['settings-outline', 'settings'],
};

function PlusButton({ bottom }: { bottom: number }) {
  const [visible, setVisible] = useState(false);
  // 0 = closed, 1 = fully open. Everything in the menu is derived from this one value.
  const progress = useRef(new Animated.Value(0)).current;

  const open = () => {
    setVisible(true);
    Animated.spring(progress, { toValue: 1, stiffness: 260, damping: 20, mass: 1, useNativeDriver: true }).start();
  };
  const close = (after?: () => void) => {
    Animated.timing(progress, { toValue: 0, duration: 160, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => {
      setVisible(false);
      after?.();
    });
  };
  const go = (type: 'expense' | 'income') => close(() => router.push({ pathname: '/add', params: { type } }));

  // Each pill starts a little later than the one before it
  const pillStyle = (from: number, to: number) => ({
    opacity: progress.interpolate({ inputRange: [from, to], outputRange: [0, 1], extrapolate: 'clamp' }),
    transform: [
      { translateY: progress.interpolate({ inputRange: [from, to], outputRange: [28, 0], extrapolate: 'clamp' }) },
      { scale: progress.interpolate({ inputRange: [from, to], outputRange: [0.85, 1], extrapolate: 'clamp' }) },
    ],
  });

  return (
    <View style={s.slot}>
      <Pressable onPress={open} accessibilityLabel="Add transaction">
        <LinearGradient colors={['#7CC6F9', colors.skyDeep]} style={s.plus}>
          <Icon name="add" size={28} color={colors.white} />
        </LinearGradient>
      </Pressable>

      <Modal visible={visible} transparent animationType="none" onRequestClose={() => close()}>
        <Pressable style={s.overlayHit} onPress={() => close()}>
          <Animated.View style={[s.overlay, { opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }) }]} />
          <View style={[s.menu, { bottom: bottom + BAR_HEIGHT + 22 }]}>
            <Animated.View style={pillStyle(0.15, 0.85)}>
              <Pressable style={s.pill} onPress={() => go('income')}>
                <Icon name="arrow-down-outline" size={18} color={colors.income} />
                <Text style={s.pillText}>Add Income</Text>
              </Pressable>
            </Animated.View>
            <Animated.View style={pillStyle(0, 0.7)}>
              <Pressable style={s.pill} onPress={() => go('expense')}>
                <Icon name="arrow-up-outline" size={18} color={colors.expense} />
                <Text style={s.pillText}>Add Expense</Text>
              </Pressable>
            </Animated.View>
          </View>
          <Animated.View
            style={[
              s.close,
              {
                bottom: bottom + (BAR_HEIGHT - ITEM) / 2,
                transform: [{ rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['-90deg', '0deg'] }) }],
              },
            ]}
          >
            <Pressable onPress={() => close()} accessibilityLabel="Close menu">
              <LinearGradient colors={['#9DD6FB', colors.sky]} style={s.plus}>
                <Icon name="close" size={26} color={colors.white} />
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

function FloatingTabBar({ state, navigation }: BarProps) {
  const insets = useSafeAreaInsets();
  const bottom = BAR_BOTTOM + insets.bottom;

  // One highlight circle that glides to the active tab
  const [barWidth, setBarWidth] = useState(0);
  const slotWidth = barWidth > 0 ? (barWidth - BAR_PAD * 2) / state.routes.length : 0;
  const targetX = BAR_PAD + slotWidth * state.index + (slotWidth - ICON_BUBBLE) / 2;
  const x = useRef(new Animated.Value(0)).current;
  const placed = useRef(false);

  useEffect(() => {
    if (slotWidth === 0) return;
    if (!placed.current) {
      x.setValue(targetX); // first layout: no animation
      placed.current = true;
    } else {
      Animated.spring(x, { toValue: targetX, stiffness: 300, damping: 24, mass: 1, useNativeDriver: true }).start();
    }
  }, [targetX, slotWidth, x]);

  const activeIsTab = state.routes[state.index]?.name !== 'plus';

  return (
    <View style={[s.bar, { bottom }]} onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}>
      {slotWidth > 0 && activeIsTab ? <Animated.View pointerEvents="none" style={[s.indicator, { transform: [{ translateX: x }] }]} /> : null}
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
            <View style={s.iconWrap}>
              <Icon name={focused ? filled : outline} size={24} color={focused ? colors.skyDeep : colors.faint} />
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

const s = themedStyles(() => StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: BAR_PAD,
    ...shadow,
  },
  slot: { flex: 1, height: BAR_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  indicator: {
    position: 'absolute',
    top: (BAR_HEIGHT - ICON_BUBBLE) / 2,
    left: 0,
    width: ICON_BUBBLE,
    height: ICON_BUBBLE,
    borderRadius: ICON_BUBBLE / 2,
    backgroundColor: colors.skyTint,
  },
  iconWrap: { width: ICON_BUBBLE, height: ICON_BUBBLE, borderRadius: ICON_BUBBLE / 2, alignItems: 'center', justifyContent: 'center' },
  plus: { width: ITEM, height: ITEM, borderRadius: ITEM / 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  overlayHit: { flex: 1 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.overlay },
  menu: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: 12 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    paddingHorizontal: 22,
    height: 50,
    borderRadius: 25,
    ...shadow,
  },
  pillText: { fontSize: 15, fontWeight: '600', color: colors.text },
  close: { position: 'absolute', alignSelf: 'center' },
}));
