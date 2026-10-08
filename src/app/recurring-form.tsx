import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { confirmDialog } from '../components/Dialogs';
import { Text } from '../components/Text';
import { Icon, PickRow, PickerModal, PrimaryButton, Screen, Segmented, SecondaryButton, TextField, animateNext, toast } from '../components/ui';
import { INCOME_SOURCES, PAYMENT_METHODS } from '../lib/constants';
import { fmtDate, fromISO, newId, parseAmount, toISO, todayISO } from '../lib/format';
import { useStore } from '../lib/store';
import { colors, themedStyles } from '../lib/theme';
import type { Frequency, TxType } from '../lib/types';

export default function RecurringForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { recurring, categories, currency, lastMethod, saveRecurring, deleteRecurring } = useStore();
  const editing = id ? recurring.find((r) => r.id === id) : undefined;

  const [type, setType] = useState<TxType>(editing?.type ?? 'expense');
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '');
  const [category, setCategory] = useState(editing?.type === 'expense' ? editing.category : '');
  const [source, setSource] = useState(editing?.type === 'income' ? editing.category : 'Salary');
  const [method, setMethod] = useState(editing?.method || lastMethod);
  const [frequency, setFrequency] = useState<Frequency>(editing?.frequency ?? 'monthly');
  const [nextDate, setNextDate] = useState(editing?.nextDate ?? todayISO());
  const [note, setNote] = useState(editing?.note ?? '');
  const [error, setError] = useState('');
  const [picker, setPicker] = useState<'category' | 'method' | 'source' | null>(null);

  const isExpense = type === 'expense';

  const pickDate = () => {
    if (Platform.OS !== 'android') return;
    DateTimePickerAndroid.open({ value: fromISO(nextDate), mode: 'date', onChange: (_, d) => d && setNextDate(toISO(d)) });
  };

  const save = () => {
    if (!amount.trim()) return setError('Please enter an amount.');
    const value = parseAmount(amount);
    if (!(value > 0)) return setError('Please enter a valid amount.');
    if (isExpense && !category) return setError('Please select a category.');

    saveRecurring({
      id: editing?.id ?? newId(),
      type,
      amount: Math.round(value * 100) / 100,
      category: isExpense ? category : source,
      method: isExpense ? method : '',
      note: note.trim(),
      frequency,
      anchorDay: Number(nextDate.slice(8, 10)),
      nextDate,
      active: editing?.active ?? true,
    });
    toast(editing ? 'Recurring transaction updated.' : 'Recurring transaction added.');
    router.back();
  };

  const remove = async () => {
    if (!editing) return;
    const ok = await confirmDialog({
      title: 'Stop this recurring transaction?',
      message: 'Transactions it already created are kept. It will not add any new ones.',
      confirmLabel: 'Stop it',
      danger: true,
      icon: 'repeat-outline',
    });
    if (!ok) return;
    deleteRecurring(editing.id);
    toast('Recurring transaction stopped.');
    router.back();
  };

  const isPast = nextDate <= todayISO();

  return (
    <Screen>
      <Stack.Screen options={{ title: editing ? 'Edit Recurring' : 'New Recurring' }} />

      <Segmented
        options={[
          { label: 'Expense', value: 'expense' },
          { label: 'Income', value: 'income' },
        ]}
        value={type}
        onChange={(v) => { animateNext(); setType(v); }}
      />

      <View style={{ height: 14 }} />
      <TextField
        icon="cash-outline"
        placeholder={`Amount in ${currency}`}
        value={amount}
        onChangeText={(v) => {
          setAmount(v.replace(/[^0-9.,]/g, ''));
          setError('');
        }}
        keyboardType="decimal-pad"
      />

      {isExpense ? (
        <>
          <PickRow
            icon={categories.find((c) => c.name === category)?.icon ?? 'grid-outline'}
            label="Category"
            value={category}
            placeholder="Select category"
            onPress={() => setPicker('category')}
          />
          <PickRow
            icon={PAYMENT_METHODS.find((m) => m.label === method)?.icon ?? 'card-outline'}
            label="Payment"
            value={method}
            onPress={() => setPicker('method')}
          />
        </>
      ) : (
        <PickRow
          icon={INCOME_SOURCES.find((m) => m.label === source)?.icon ?? 'cash-outline'}
          label="Source"
          value={source}
          onPress={() => setPicker('source')}
        />
      )}

      <Text style={s.group}>Repeats</Text>
      <Segmented
        options={[
          { label: 'Monthly', value: 'monthly' },
          { label: 'Weekly', value: 'weekly' },
        ]}
        value={frequency}
        onChange={(v) => { animateNext(); setFrequency(v); }}
      />
      <View style={{ height: 14 }} />
      <PickRow icon="calendar-outline" label={editing ? 'Next date' : 'First date'} value={fmtDate(nextDate)} onPress={pickDate} />
      <Text style={s.hint}>
        {frequency === 'monthly'
          ? `Added on day ${Number(nextDate.slice(8, 10))} of every month (the last day in shorter months).`
          : 'Added every 7 days from this date.'}
        {isPast ? ' Dates up to today are added right away.' : ''}
      </Text>

      <TextField icon="create-outline" placeholder="Note (optional)" value={note} onChangeText={setNote} multiline />

      {error ? (
        <View style={s.errorRow}>
          <Icon name="alert-circle-outline" size={18} color={colors.expense} />
          <Text style={s.error}>{error}</Text>
        </View>
      ) : null}

      <PrimaryButton label={editing ? 'SAVE CHANGES' : 'SAVE RECURRING'} onPress={save} style={{ marginTop: 14 }} />
      {editing ? <SecondaryButton label="Stop recurring" icon="stop-circle-outline" onPress={remove} style={{ marginTop: 10 }} /> : null}

      <PickerModal
        visible={picker === 'category'}
        title="Select Category"
        options={categories.map((c) => ({ label: c.name, icon: c.icon }))}
        selected={category}
        onSelect={(v) => {
          setCategory(v);
          setError('');
        }}
        onClose={() => setPicker(null)}
      />
      <PickerModal visible={picker === 'method'} title="Payment Method" options={PAYMENT_METHODS} selected={method} onSelect={setMethod} onClose={() => setPicker(null)} />
      <PickerModal visible={picker === 'source'} title="Income Source" options={INCOME_SOURCES} selected={source} onSelect={setSource} onClose={() => setPicker(null)} />
    </Screen>
  );
}

const s = themedStyles(() => StyleSheet.create({
  group: { fontSize: 13, fontWeight: '700', color: colors.muted, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 14, marginBottom: 10 },
  hint: { fontSize: 13, lineHeight: 19, color: colors.muted, marginBottom: 14, marginTop: -2 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  error: { color: colors.expense, fontSize: 14, fontWeight: '500' },
}));
