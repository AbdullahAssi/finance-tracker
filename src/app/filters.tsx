import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import { Card, Icon, PickRow, PickerModal, PrimaryButton, Screen, SecondaryButton } from '../components/ui';
import { PAYMENT_METHODS } from '../lib/constants';
import { RANGE_LABELS } from '../lib/filter';
import { fmtDate, fromISO, toISO } from '../lib/format';
import { defaultFilters, useStore } from '../lib/store';
import { colors, themedStyles } from '../lib/theme';
import type { DateRange, Filters } from '../lib/types';

const TYPES: { label: string; value: Filters['type'] }[] = [
  { label: 'All', value: 'all' },
  { label: 'Income', value: 'income' },
  { label: 'Expense', value: 'expense' },
];
const RANGES: DateRange[] = ['month', 'today', 'week', 'lastMonth', 'custom'];

function Radio({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={s.radioRow}>
      <Icon name={selected ? 'radio-button-on' : 'radio-button-off'} size={22} color={selected ? colors.skyDeep : colors.muted} />
      <Text style={s.radioLabel}>{label}</Text>
    </Pressable>
  );
}

export default function FiltersScreen() {
  const { filters, setFilters, categories } = useStore();
  const [draft, setDraft] = useState<Filters>(filters);
  const [picker, setPicker] = useState<'category' | 'method' | null>(null);

  const pickDate = (key: 'from' | 'to') => {
    if (Platform.OS !== 'android') return;
    DateTimePickerAndroid.open({
      value: fromISO(draft[key]),
      mode: 'date',
      onChange: (_, d) => d && setDraft((cur) => ({ ...cur, [key]: toISO(d) })),
    });
  };

  return (
    <Screen>
      <Text style={s.group}>Transaction type</Text>
      <Card style={s.card}>
        {TYPES.map((t) => (
          <Radio key={t.value} label={t.label} selected={draft.type === t.value} onPress={() => setDraft({ ...draft, type: t.value })} />
        ))}
      </Card>

      <Text style={s.group}>Date</Text>
      <Card style={s.card}>
        {RANGES.map((r) => (
          <Radio key={r} label={RANGE_LABELS[r]} selected={draft.range === r} onPress={() => setDraft({ ...draft, range: r })} />
        ))}
        {draft.range === 'custom' ? (
          <View style={{ marginTop: 8 }}>
            <PickRow icon="calendar-outline" label="From" value={fmtDate(draft.from)} onPress={() => pickDate('from')} />
            <PickRow icon="calendar-outline" label="To" value={fmtDate(draft.to)} onPress={() => pickDate('to')} />
          </View>
        ) : null}
      </Card>

      <Text style={s.group}>Category & payment</Text>
      <PickRow icon="grid-outline" label="Category" value={draft.category ?? 'Any'} onPress={() => setPicker('category')} />
      <PickRow icon="card-outline" label="Payment" value={draft.method ?? 'Any'} onPress={() => setPicker('method')} />

      <PrimaryButton
        label="APPLY FILTER"
        style={{ marginTop: 20 }}
        onPress={() => {
          setFilters(draft);
          router.back();
        }}
      />
      <SecondaryButton
        label="Clear all"
        style={{ marginTop: 10 }}
        onPress={() => {
          setFilters(defaultFilters());
          router.back();
        }}
      />

      <PickerModal
        visible={picker === 'category'}
        title="Category"
        options={[{ label: 'Any' }, ...categories.map((c) => ({ label: c.name, icon: c.icon }))]}
        selected={draft.category ?? 'Any'}
        onSelect={(v) => setDraft({ ...draft, category: v === 'Any' ? null : v })}
        onClose={() => setPicker(null)}
      />
      <PickerModal
        visible={picker === 'method'}
        title="Payment Method"
        options={[{ label: 'Any' }, ...PAYMENT_METHODS]}
        selected={draft.method ?? 'Any'}
        onSelect={(v) => setDraft({ ...draft, method: v === 'Any' ? null : v })}
        onClose={() => setPicker(null)}
      />
    </Screen>
  );
}

const s = themedStyles(() => StyleSheet.create({
  group: { fontSize: 13, fontWeight: '700', color: colors.muted, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 16, marginBottom: 10 },
  card: { paddingVertical: 6 },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  radioLabel: { fontSize: 15.5, color: colors.text, fontWeight: '500' },
}));
