import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import { Card, EmptyState, Screen } from '../components/ui';
import { monthLabel, number } from '../lib/format';
import { inMonth, useStore } from '../lib/store';
import { colors, themedStyles } from '../lib/theme';

export default function Chart() {
  const { txs, currency, month } = useStore();

  const { rows, total } = useMemo(() => {
    const map = new Map<string, number>();
    inMonth(txs, month)
      .filter((t) => t.type === 'expense')
      .forEach((t) => map.set(t.category, (map.get(t.category) ?? 0) + t.amount));
    const rows = [...map.entries()].sort((a, b) => b[1] - a[1]);
    return { rows, total: rows.reduce((n, [, v]) => n + v, 0) };
  }, [txs, month]);

  const max = rows[0]?.[1] ?? 1;

  return (
    <Screen>
      <Text style={s.month}>{monthLabel(month)}</Text>
      {rows.length === 0 ? (
        <Card>
          <EmptyState icon="bar-chart-outline" title="No expenses this month" />
        </Card>
      ) : (
        <Card style={{ gap: 18 }}>
          {rows.map(([name, amount]) => (
            <View key={name}>
              <View style={s.labels}>
                <Text style={s.name}>{name}</Text>
                <Text style={s.amount}>
                  {currency} {number(amount)}
                  <Text style={s.pct}>  {Math.round((amount / total) * 100)}%</Text>
                </Text>
              </View>
              <View style={s.track}>
                <View style={[s.fill, { width: `${Math.max((amount / max) * 100, 3)}%` }]} />
              </View>
            </View>
          ))}
          <View style={s.totalRow}>
            <Text style={s.name}>Total</Text>
            <Text style={s.amount}>
              {currency} {number(total)}
            </Text>
          </View>
        </Card>
      )}
    </Screen>
  );
}

const s = themedStyles(() => StyleSheet.create({
  month: { fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 16 },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  amount: { fontSize: 15, fontWeight: '700', color: colors.text },
  pct: { fontSize: 13, fontWeight: '500', color: colors.muted },
  track: { height: 12, borderRadius: 6, backgroundColor: colors.skyTint, overflow: 'hidden' },
  fill: { height: 12, borderRadius: 6, backgroundColor: colors.sky },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
}));
