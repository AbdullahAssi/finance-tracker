import { StyleSheet, View } from 'react-native';
import { type BudgetLevel, type BudgetStatus } from '../lib/analytics';
import { number } from '../lib/format';
import { colors, themedStyles } from '../lib/theme';
import { Text } from './Text';
import { IconBubble } from './ui';

export const levelColor = (level: BudgetLevel) => (level === 'over' ? colors.expense : level === 'near' ? colors.warn : colors.sky);

/** One category's progress against its monthly budget. */
export function BudgetRow({ status, currency }: { status: BudgetStatus; currency: string }) {
  const { category, spent, budget, ratio, remaining, level } = status;
  const color = levelColor(level);

  return (
    <View style={s.row}>
      <IconBubble name={category.icon} size={40} color={level === 'ok' ? colors.skyDeep : color} />
      <View style={{ flex: 1, gap: 6 }}>
        <View style={s.top}>
          <Text style={s.name} numberOfLines={1}>
            {category.name}
          </Text>
          <Text style={s.amounts}>
            {number(spent, 0)} <Text style={s.of}>/ {number(budget, 0)}</Text>
          </Text>
        </View>
        <View style={s.track}>
          <View style={[s.fill, { width: `${Math.min(Math.max(ratio, 0.02), 1) * 100}%`, backgroundColor: color }]} />
        </View>
        <Text style={[s.status, level !== 'ok' && { color }]}>
          {level === 'over'
            ? `Over budget by ${currency} ${number(-remaining, 0)}`
            : `${currency} ${number(remaining, 0)} left · ${Math.round(ratio * 100)}% used`}
        </Text>
      </View>
    </View>
  );
}

const s = themedStyles(() => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  name: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  amounts: { fontSize: 14.5, fontWeight: '700', color: colors.text },
  of: { fontSize: 13, fontWeight: '500', color: colors.muted },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.skyTint, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  status: { fontSize: 12.5, color: colors.muted },
}));
