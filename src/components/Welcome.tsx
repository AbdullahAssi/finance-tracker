import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadow, themedStyles } from '../lib/theme';
import { Icon } from './icon';
import { Text } from './Text';
import { IconBubble, PrimaryButton } from './ui';

/* ------------------------------------------------------------------ */
/* Small building blocks for the illustrations                         */
/* ------------------------------------------------------------------ */

/** Gently bobbing wrapper, so the illustrations feel alive. */
function Float({ children, delay = 0, amplitude = 7, style }: { children: ReactNode; delay?: number; amplitude?: number; style?: object }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: 2200, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t, delay]);
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, -amplitude] });
  return <Animated.View style={[style, { transform: [{ translateY }] }]}>{children}</Animated.View>;
}

/** Small round white badge holding an icon. */
function Chip({ icon, color = colors.skyDeep, size = 52 }: { icon: string; color?: string; size?: number }) {
  return (
    <View style={[s.chip, { width: size, height: size, borderRadius: size / 2 }]}>
      <Icon name={icon} size={size * 0.46} color={color} />
    </View>
  );
}

/** Step 1: a peek at the real transaction list. */
function AddIllustration() {
  return (
    <View style={s.stage}>
      <View style={s.mockCard}>
        <View style={s.mockRow}>
          <IconBubble name="cart-outline" size={42} />
          <View style={{ flex: 1 }}>
            <Text style={s.mockTitle}>Groceries</Text>
            <Text style={s.mockSub}>Today · Cash</Text>
          </View>
          <Text style={[s.mockAmount, { color: colors.expense }]}>-42.50</Text>
        </View>
        <View style={s.mockDivider} />
        <View style={s.mockRow}>
          <IconBubble name="cash-outline" size={42} color={colors.income} />
          <View style={{ flex: 1 }}>
            <Text style={s.mockTitle}>Salary</Text>
            <Text style={s.mockSub}>1 Oct · Bank</Text>
          </View>
          <Text style={[s.mockAmount, { color: colors.income }]}>+13,180</Text>
        </View>
      </View>
      <Float style={s.fab} delay={300}>
        <LinearGradient colors={['#7CC6F9', colors.skyDeep]} style={s.fabInner}>
          <Icon name="add" size={30} color="#FFFFFF" />
        </LinearGradient>
      </Float>
      <Float style={{ position: 'absolute', top: 6, left: 20 }} delay={900}>
        <Chip icon="flash-outline" size={46} />
      </Float>
    </View>
  );
}

/** Step 2: privacy. */
function PrivacyIllustration() {
  return (
    <View style={s.stage}>
      <View style={s.bigCircle}>
        <LinearGradient colors={['#7CC6F9', colors.skyDeep]} style={s.bigCircleInner}>
          <Icon name="shield-checkmark" size={58} color="#FFFFFF" />
        </LinearGradient>
      </View>
      <Float style={{ position: 'absolute', top: 14, left: 18 }}>
        <Chip icon="lock-closed-outline" />
      </Float>
      <Float style={{ position: 'absolute', top: 40, right: 14 }} delay={600}>
        <Chip icon="eye-off-outline" />
      </Float>
      <Float style={{ position: 'absolute', bottom: 18, left: 34 }} delay={1200}>
        <Chip icon="person-remove-outline" size={46} />
      </Float>
      <Float style={{ position: 'absolute', bottom: 8, right: 36 }} delay={300}>
        <Chip icon="server-outline" size={46} color={colors.expense} />
      </Float>
    </View>
  );
}

/** Step 3: optional folder sync. */
function SyncIllustration() {
  return (
    <View style={s.stage}>
      <View style={s.bigCircle}>
        <LinearGradient colors={['#7CC6F9', colors.skyDeep]} style={s.bigCircleInner}>
          <Icon name="folder-open" size={54} color="#FFFFFF" />
        </LinearGradient>
      </View>
      <Float style={{ position: 'absolute', top: 24, left: 10 }}>
        <Chip icon="phone-portrait-outline" size={58} />
      </Float>
      <Float style={{ position: 'absolute', top: 24, right: 10 }} delay={700}>
        <Chip icon="phone-portrait-outline" size={58} />
      </Float>
      <Float style={{ position: 'absolute', bottom: 10, alignSelf: 'center' }} delay={400}>
        <Chip icon="cloud-done-outline" size={48} />
      </Float>
    </View>
  );
}

const PAGES = [
  {
    title: 'Add an expense\nin seconds',
    body: 'Amount, category, done. Budgets and recurring bills keep everything on track for you.',
    art: <AddIllustration />,
  },
  {
    title: 'Private by\ndefault',
    body: 'Your data lives on this phone. No account, no sign-up, no server and no tracking.',
    art: <PrivacyIllustration />,
  },
  {
    title: 'Sync only\nif you want',
    body: 'Pick a folder, such as one in Google Drive, to share between phones. Stop any time.',
    art: <SyncIllustration />,
  },
];

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

function Dot({ active }: { active: boolean }) {
  const w = useRef(new Animated.Value(active ? 24 : 8)).current;
  useEffect(() => {
    Animated.spring(w, { toValue: active ? 24 : 8, stiffness: 300, damping: 24, mass: 1, useNativeDriver: false }).start();
  }, [active, w]);
  return <Animated.View style={[s.dot, { width: w, backgroundColor: active ? colors.skyDeep : colors.border }]} />;
}

/** First-run screen. Shown once, before anything is stored. */
export function Welcome({ onDone }: { onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scrollX = useRef(new Animated.Value(0)).current;
  const scroller = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const last = index === PAGES.length - 1;

  const goTo = (i: number) => scroller.current?.scrollTo({ x: i * width, animated: true });

  return (
    <LinearGradient colors={[colors.sky, colors.skyDeep]} style={s.fill}>
      {/* Decorative soft circles */}
      <View style={[s.blob, { width: 320, height: 320, top: -90, right: -110 }]} />
      <View style={[s.blob, { width: 220, height: 220, top: 170, left: -90 }]} />

      <View style={[s.topBar, { paddingTop: insets.top + 14 }]}>
        <View style={s.brand}>
          <View style={s.brandLogo}>
            <Icon name="wallet" size={18} color={colors.skyDeep} />
          </View>
          <Text style={s.brandText}>Expense Tracker</Text>
        </View>
        {!last ? (
          <Pressable onPress={onDone} hitSlop={12} accessibilityRole="button" accessibilityLabel="Skip introduction">
            <Text style={s.skip}>Skip</Text>
          </Pressable>
        ) : (
          <View />
        )}
      </View>

      {/* Illustrations cross-fade and drift as the text pager is swiped */}
      <View style={s.hero} pointerEvents="none">
        {PAGES.map((p, i) => {
          const range = [(i - 1) * width, i * width, (i + 1) * width];
          return (
            <Animated.View
              key={i}
              style={[
                s.heroLayer,
                {
                  opacity: scrollX.interpolate({ inputRange: range, outputRange: [0, 1, 0], extrapolate: 'clamp' }),
                  transform: [
                    { translateX: scrollX.interpolate({ inputRange: range, outputRange: [width * 0.3, 0, -width * 0.3], extrapolate: 'clamp' }) },
                    { scale: scrollX.interpolate({ inputRange: range, outputRange: [0.85, 1, 0.85], extrapolate: 'clamp' }) },
                  ],
                },
              ]}
            >
              {p.art}
            </Animated.View>
          );
        })}
      </View>

      {/* Bottom sheet, like the rest of the app */}
      <View style={[s.sheet, { paddingBottom: insets.bottom + 22 }]}>
        <Animated.ScrollView
          ref={scroller as never}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: true,
            listener: (e: any) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width)),
          })}
          style={{ flexGrow: 0 }}
        >
          {PAGES.map((p, i) => (
            <View key={i} style={[s.page, { width }]}>
              <Text style={s.title}>{p.title}</Text>
              <Text style={s.body}>{p.body}</Text>
            </View>
          ))}
        </Animated.ScrollView>

        <View style={s.dots}>
          {PAGES.map((_, i) => (
            <Dot key={i} active={i === index} />
          ))}
        </View>

        <View style={s.footer}>
          <PrimaryButton label={last ? 'GET STARTED' : 'NEXT'} onPress={last ? onDone : () => goTo(index + 1)} />
          <Text style={[s.fine, !last && { opacity: 0 }]}>You can change how your data is kept at any time in Settings.</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const s = themedStyles(() => StyleSheet.create({
  fill: { flex: 1 },
  blob: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandLogo: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  brandText: { fontSize: 17, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2 },
  skip: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.92)' },

  hero: { flex: 1, minHeight: 240 },
  heroLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  stage: { width: 300, height: 260, alignItems: 'center', justifyContent: 'center' },

  chip: { backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', ...shadow, shadowOpacity: 0.18 },
  bigCircle: { width: 190, height: 190, borderRadius: 95, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center', ...shadow, shadowOpacity: 0.2 },
  bigCircleInner: { width: 124, height: 124, borderRadius: 62, alignItems: 'center', justifyContent: 'center' },

  mockCard: { width: 272, backgroundColor: '#FFFFFF', borderRadius: 28, padding: 16, ...shadow, shadowOpacity: 0.2 },
  mockRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  mockDivider: { height: 1, backgroundColor: '#E6EDF5', marginVertical: 6 },
  mockTitle: { fontSize: 14.5, fontWeight: '700', color: '#0F172A' },
  mockSub: { fontSize: 12, color: '#6B7A90', marginTop: 1 },
  mockAmount: { fontSize: 14.5, fontWeight: '800' },
  fab: { position: 'absolute', bottom: 10, right: 10 },
  fabInner: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', ...shadow, shadowOpacity: 0.3 },

  sheet: { backgroundColor: colors.card, borderTopLeftRadius: 36, borderTopRightRadius: 36, paddingTop: 30 },
  page: { paddingHorizontal: 28, minHeight: 168 },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '800', color: colors.text, letterSpacing: -0.6 },
  body: { fontSize: 15, lineHeight: 22, color: colors.muted, marginTop: 12 },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 28, marginTop: 6, marginBottom: 22 },
  dot: { height: 8, borderRadius: 4 },
  footer: { paddingHorizontal: 24, gap: 12 },
  fine: { fontSize: 12.5, color: colors.faint, textAlign: 'center' },
}));
