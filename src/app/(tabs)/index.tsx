import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, EmptyState, Icon, IconBubble, MonthPicker, SectionTitle, TAB_SPACE, TxRow } from '../../components/ui';
import { IncomeExpenseChart, TrendChart } from '../../components/charts';
import { dailySeries, daysInMonth, lastMonths } from '../../lib/analytics';
import { usePullSync } from '../../lib/usePullSync';
import { monthLabel, number } from '../../lib/format';
import { inMonth, newestFirst, totals, useStore } from '../../lib/store';
import { colors, radius, shadow } from '../../lib/theme';

function SyncIcon({ name, spinning }: { name: string; spinning: boolean }) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!spinning) {
      rotation.setValue(0);
      return;
    }
    const loop = Animated.loop(Animated.timing(rotation, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [spinning, rotation]);

  const rotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Icon name={name} size={20} color={colors.white} />
    </Animated.View>
  );
}

function Kpi({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <Card style={s.kpi}>
      <Icon name={icon} size={18} color={colors.skyDeep} />
      <Text style={s.kpiValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={s.kpiLabel}>{label}</Text>
    </Card>
  );
}

export default function Dashboard() {
  const { txs, categories, currency, month, setMonth, pending, syncStatus, sheetUrl } = useStore();
  const insets = useSafeAreaInsets();
  const { refreshing, onRefresh } = usePullSync();
  const [pickMonth, setPickMonth] = useState(false);
  const [hidden, setHidden] = useState(false);

  const monthTxs = useMemo(() => inMonth(txs, month), [txs, month]);
  const { income, expense, balance } = totals(monthTxs);
  const recent = useMemo(() => newestFirst(monthTxs).slice(0, 5), [monthTxs]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    monthTxs.filter((t) => t.type === 'expense').forEach((t) => map.set(t.category, (map.get(t.category) ?? 0) + t.amount));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [monthTxs]);

  const daily = useMemo(() => dailySeries(txs, month), [txs, month]);
  const trend = useMemo(() => lastMonths(txs, month, 6), [txs, month]);

  const syncIcon =
    !sheetUrl ? 'cloud-outline'
    : syncStatus === 'syncing' ? 'sync-outline'
    : syncStatus === 'error' ? 'cloud-offline-outline'
    : pending.length > 0 ? 'cloud-upload-outline'
    : 'cloud-done-outline';

  const mask = (v: string) => (hidden ? `${currency} ••••••` : v);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <LinearGradient colors={[colors.sky, colors.skyLight, colors.bg]} style={s.gradient} />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: TAB_SPACE + insets.bottom }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.white}
            colors={[colors.skyDeep]}
            progressBackgroundColor={colors.white}
            progressViewOffset={insets.top}
          />
        }
      >
        <View style={s.topRow}>
          <Text style={s.brand}>Expense Tracker</Text>
          <Pressable onPress={() => router.push('/sheet')} style={s.roundBtn} accessibilityLabel="Google Sheet sync">
            <SyncIcon name={syncIcon} spinning={syncStatus === 'syncing'} />
          </Pressable>
        </View>

        <View style={s.labelRow}>
          <Text style={s.label}>Remaining balance</Text>
          <Pressable onPress={() => setHidden(!hidden)} hitSlop={10}>
            <Icon name={hidden ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.white} />
          </Pressable>
          <Pressable onPress={() => setPickMonth(true)} style={s.monthChip}>
            <Text style={s.monthChipText}>{monthLabel(month)}</Text>
            <Icon name="chevron-down" size={14} color={colors.white} />
          </Pressable>
        </View>
        <Text style={s.balance}>{mask(`${balance < 0 ? '-' : ''}${currency} ${number(Math.abs(balance))}`)}</Text>
        <Text style={s.sub}>Income minus expenses for {monthLabel(month)}</Text>

        <View style={s.statRow}>
          <Card style={s.stat}>
            <IconBubble name="arrow-down-outline" size={38} color={colors.income} />
            <Text style={s.statLabel}>Income</Text>
            <Text style={[s.statValue, { color: colors.income }]} numberOfLines={1} adjustsFontSizeToFit>
              {mask(`${currency} ${number(income)}`)}
            </Text>
          </Card>
          <Card style={s.stat}>
            <IconBubble name="arrow-up-outline" size={38} color={colors.expense} />
            <Text style={s.statLabel}>Expenses</Text>
            <Text style={[s.statValue, { color: colors.expense }]} numberOfLines={1} adjustsFontSizeToFit>
              {mask(`${currency} ${number(expense)}`)}
            </Text>
          </Card>
        </View>

        <View style={s.kpiRow}>
          <Kpi icon="speedometer-outline" label="Avg / day" value={daily.length ? number(expense / daily.length, 0) : '0'} />
          <Kpi icon="trending-up-outline" label="Saved" value={income > 0 ? `${Math.round((balance / income) * 100)}%` : '—'} />
          <Kpi icon="ribbon-outline" label="Top spend" value={byCategory[0]?.[0] ?? '—'} />
        </View>

        {byCategory.length > 0 && (
          <>
            <SectionTitle title="Spending by Category" action="Details" onAction={() => router.push('/chart')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 8 }}>
              {byCategory.map(([name, amount]) => {
                const pct = expense > 0 ? amount / expense : 0;
                const icon = categories.find((c) => c.name === name)?.icon ?? 'ellipsis-horizontal-circle-outline';
                return (
                  <Card key={name} style={s.catCard}>
                    <IconBubble name={icon} size={36} />
                    <Text style={s.catName} numberOfLines={1}>{name}</Text>
                    <View style={s.track}>
                      <View style={[s.fill, { width: `${Math.max(pct * 100, 4)}%` }]} />
                    </View>
                    <View style={s.catFoot}>
                      <Text style={s.catAmount}>{number(amount, 0)}</Text>
                      <Text style={s.catPct}>{Math.round(pct * 100)}%</Text>
                    </View>
                  </Card>
                );
              })}
            </ScrollView>
          </>
        )}

        {expense > 0 && (
          <>
            <SectionTitle title="Spending Trend" />
            <Card>
              <TrendChart daily={daily} days={daysInMonth(month)} currency={currency} monthName={monthLabel(month)} />
            </Card>
          </>
        )}

        {trend.some((p) => p.income > 0 || p.expense > 0) && (
          <>
            <SectionTitle title="Income vs Expenses" />
            <Card>
              <IncomeExpenseChart data={trend} currency={currency} />
            </Card>
          </>
        )}

        <SectionTitle title="Recent Activity" action={recent.length ? 'View all' : undefined} onAction={() => router.navigate('/transactions')} />
        {recent.length === 0 ? (
          <Card>
            <EmptyState icon="receipt-outline" title="No transactions yet" hint="Tap + to add your first transaction and start tracking." />
          </Card>
        ) : (
          <Card style={{ paddingVertical: 6 }}>
            {recent.map((t) => (
              <TxRow key={t.id} tx={t} onPress={() => router.push(`/transaction/${t.id}`)} showDate />
            ))}
          </Card>
        )}
      </ScrollView>
      {/* Solid strip behind the status bar so scrolled content never collides with the clock/battery icons.
          Matches the top colour of the gradient, so it is invisible until content scrolls under it. */}
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top, backgroundColor: colors.sky }} />
      <MonthPicker visible={pickMonth} value={month} onSelect={setMonth} onClose={() => setPickMonth(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  gradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 420 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  brand: { fontSize: 24, fontWeight: '800', color: colors.white, letterSpacing: -0.3 },
  roundBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.28)', alignItems: 'center', justifyContent: 'center' },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 14, color: colors.white, fontWeight: '500' },
  monthChip: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  monthChipText: { fontSize: 13, fontWeight: '600', color: colors.white },
  balance: { fontSize: 42, fontWeight: '800', color: colors.white, marginTop: 6, letterSpacing: -1 },
  sub: { fontSize: 13, color: 'rgba(255,255,255,0.92)', marginTop: 2, marginBottom: 20 },
  statRow: { flexDirection: 'row', gap: 12 },
  stat: { flex: 1, gap: 6, padding: 14 },
  statLabel: { fontSize: 13, color: colors.muted, marginTop: 4 },
  statValue: { fontSize: 18, fontWeight: '800' },
  kpiRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  kpi: { flex: 1, padding: 12, gap: 4, borderRadius: radius.md },
  kpiValue: { fontSize: 17, fontWeight: '800', color: colors.text },
  kpiLabel: { fontSize: 12, color: colors.muted },
  catCard: { width: 150, padding: 14, gap: 8 },
  catName: { fontSize: 13, color: colors.muted, marginTop: 4 },
  track: { height: 4, borderRadius: 2, backgroundColor: colors.skyTint, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2, backgroundColor: colors.sky },
  catFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  catAmount: { fontSize: 18, fontWeight: '800', color: colors.text },
  catPct: { fontSize: 12, color: colors.muted },
});
