import { router, Stack } from 'expo-router';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { Text } from '../components/Text';
import { Card, EmptyState, Icon, IconBubble, PrimaryButton, Screen } from '../components/ui';
import { DEFAULT_ICON, INCOME_SOURCES } from '../lib/constants';
import { fmtDate, number } from '../lib/format';
import { useStore } from '../lib/store';
import { colors, themedStyles } from '../lib/theme';

export default function RecurringList() {
  const { recurring, categories, currency, saveRecurring } = useStore();

  const iconFor = (type: 'expense' | 'income', name: string) =>
    type === 'income'
      ? (INCOME_SOURCES.find((i) => i.label === name)?.icon ?? 'cash-outline')
      : (categories.find((c) => c.name === name)?.icon ?? DEFAULT_ICON);

  return (
    <Screen>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => router.push('/recurring-form')} hitSlop={10} accessibilityLabel="Add recurring transaction">
              <Icon name="add-circle" size={30} color={colors.skyDeep} />
            </Pressable>
          ),
        }}
      />

      {recurring.length === 0 ? (
        <Card>
          <EmptyState
            icon="repeat-outline"
            title="No recurring transactions"
            hint="Add things that repeat, like rent, a salary or an installment, and they are recorded for you on the due date."
          />
          <PrimaryButton label="ADD RECURRING" icon="add" onPress={() => router.push('/recurring-form')} style={{ marginTop: 4 }} />
        </Card>
      ) : (
        <Card style={{ paddingVertical: 4 }}>
          {recurring.map((r, i) => {
            const isIncome = r.type === 'income';
            return (
              <Pressable
                key={r.id}
                onPress={() => router.push({ pathname: '/recurring-form', params: { id: r.id } })}
                style={[s.row, i < recurring.length - 1 && s.border, !r.active && { opacity: 0.55 }]}
              >
                <IconBubble name={iconFor(r.type, r.category)} size={42} color={isIncome ? colors.income : colors.skyDeep} />
                <View style={{ flex: 1 }}>
                  <Text style={s.title} numberOfLines={1}>
                    {r.category || (isIncome ? 'Income' : 'Expense')}
                  </Text>
                  <Text style={s.sub} numberOfLines={1}>
                    {r.frequency === 'monthly' ? 'Monthly' : 'Weekly'} · {r.active ? `next ${fmtDate(r.nextDate).slice(0, 6)}` : 'paused'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={[s.amount, { color: isIncome ? colors.income : colors.expense }]}>
                    {isIncome ? '+' : '-'}
                    {currency} {number(r.amount)}
                  </Text>
                  <Switch
                    value={r.active}
                    onValueChange={(active) => saveRecurring({ ...r, active })}
                    trackColor={{ false: colors.border, true: colors.skyLight }}
                    thumbColor={r.active ? colors.skyDeep : '#FFFFFF'}
                  />
                </View>
              </Pressable>
            );
          })}
        </Card>
      )}

      <Text style={s.hint}>
        Due transactions are added when you open the app. If you were away for a while, every missed one is added with its original date.
      </Text>
    </Screen>
  );
}

const s = themedStyles(() => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  border: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  title: { fontSize: 15.5, fontWeight: '600', color: colors.text },
  sub: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
  amount: { fontSize: 15, fontWeight: '700' },
  hint: { fontSize: 13, lineHeight: 19, color: colors.muted, marginTop: 16, textAlign: 'center' },
}));
