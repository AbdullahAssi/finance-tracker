import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../components/Text';
import { Card, EmptyState, Icon, IconBubble, Screen, SectionTitle, TAB_SPACE } from '../../components/ui';
import { DonutChart } from '../../components/charts';
import { BudgetRow } from '../../components/BudgetRow';
import { budgetStatuses, categoryBreakdown } from '../../lib/analytics';
import { monthLabel, number, shiftMonth } from '../../lib/format';
import { inMonth, totals, useStore } from '../../lib/store';
import { colors, themedStyles } from '../../lib/theme';

export default function Summary() {
  const { txs, categories, currency, month, setMonth } = useStore();
  const monthTxs = useMemo(() => inMonth(txs, month), [txs, month]);
  const { income, expense, balance } = totals(monthTxs);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    monthTxs.filter((t) => t.type === 'expense').forEach((t) => map.set(t.category, (map.get(t.category) ?? 0) + t.amount));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [monthTxs]);

  const budgets = useMemo(() => budgetStatuses(txs, categories, month), [txs, categories, month]);

  return (
    <Screen bottom={TAB_SPACE + 20}>
      <View style={s.switcher}>
        <Pressable onPress={() => setMonth(shiftMonth(month, -1))} hitSlop={12} style={s.arrow}>
          <Icon name="chevron-back" size={20} color={colors.skyDeep} />
        </Pressable>
        <Text style={s.month}>{monthLabel(month)}</Text>
        <Pressable onPress={() => setMonth(shiftMonth(month, 1))} hitSlop={12} style={s.arrow}>
          <Icon name="chevron-forward" size={20} color={colors.skyDeep} />
        </Pressable>
      </View>

      <Card style={s.big}>
        <Text style={s.bigLabel}>Remaining</Text>
        <Text style={[s.bigValue, balance < 0 && { color: colors.expense }]}>
          {balance < 0 ? '-' : ''}
          {currency} {number(Math.abs(balance))}
        </Text>
      </Card>

      <View style={s.pair}>
        <Card style={s.half}>
          <IconBubble name="arrow-down-outline" size={38} color={colors.income} />
          <Text style={s.smallLabel}>Total Income</Text>
          <Text style={[s.smallValue, { color: colors.income }]} adjustsFontSizeToFit numberOfLines={1}>
            {currency} {number(income)}
          </Text>
        </Card>
        <Card style={s.half}>
          <IconBubble name="arrow-up-outline" size={38} color={colors.expense} />
          <Text style={s.smallLabel}>Total Expenses</Text>
          <Text style={[s.smallValue, { color: colors.expense }]} adjustsFontSizeToFit numberOfLines={1}>
            {currency} {number(expense)}
          </Text>
        </Card>
      </View>

      <SectionTitle title="Budgets" action={budgets.length ? 'Manage' : undefined} onAction={() => router.push('/categories')} />
      {budgets.length === 0 ? (
        <Pressable onPress={() => router.push('/categories')}>
          <Card style={s.budgetHint}>
            <IconBubble name="speedometer-outline" size={42} />
            <View style={{ flex: 1 }}>
              <Text style={s.catName}>Set monthly budgets</Text>
              <Text style={s.hint}>Add a limit to a category and track how much is left.</Text>
            </View>
            <Icon name="chevron-forward" size={18} color={colors.muted} />
          </Card>
        </Pressable>
      ) : (
        <Card style={{ paddingVertical: 4 }}>
          {budgets.map((b) => (
            <BudgetRow key={b.category.id} status={b} currency={currency} />
          ))}
        </Card>
      )}

      <SectionTitle title="Expense by Category" action={byCategory.length ? 'View chart' : undefined} onAction={() => router.push('/chart')} />
      {byCategory.length === 0 ? (
        <Card>
          <EmptyState icon="pie-chart-outline" title="No expenses this month" />
        </Card>
      ) : (
        <>
          <Card>
            <DonutChart slices={categoryBreakdown(txs, month)} currency={currency} />
          </Card>
          <SectionTitle title="All categories" />
          <Card style={{ paddingVertical: 6 }}>
            {byCategory.map(([name, amount]) => (
              <View key={name} style={s.catRow}>
                <IconBubble name={categories.find((c) => c.name === name)?.icon ?? 'ellipsis-horizontal-circle-outline'} size={38} />
                <Text style={s.catName}>{name}</Text>
                <Text style={s.catAmount}>
                  {currency} {number(amount)}
                </Text>
              </View>
            ))}
          </Card>
        </>
      )}
    </Screen>
  );
}

const s = themedStyles(() => StyleSheet.create({
  budgetHint: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hint: { fontSize: 13, color: colors.muted, marginTop: 2 },
  switcher: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 16 },
  arrow: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  month: { fontSize: 18, fontWeight: '700', color: colors.text, minWidth: 160, textAlign: 'center' },
  big: { alignItems: 'center', paddingVertical: 22, gap: 6 },
  bigLabel: { fontSize: 14, color: colors.muted },
  bigValue: { fontSize: 32, fontWeight: '800', color: colors.skyDeep },
  pair: { flexDirection: 'row', gap: 12, marginTop: 12 },
  half: { flex: 1, gap: 6, padding: 14 },
  smallLabel: { fontSize: 13, color: colors.muted, marginTop: 4 },
  smallValue: { fontSize: 18, fontWeight: '800' },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  catName: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  catAmount: { fontSize: 15, fontWeight: '700', color: colors.text },
}));
