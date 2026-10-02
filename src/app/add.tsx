import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '../components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, PickRow, PickerModal, PrimaryButton, Segmented, TextField } from '../components/ui';
import { INCOME_SOURCES, PAYMENT_METHODS } from '../lib/constants';
import { fmtDate, fromISO, money, parseAmount, toISO, todayISO } from '../lib/format';
import { useStore } from '../lib/store';
import { colors } from '../lib/theme';
import type { TxType } from '../lib/types';

export default function AddScreen() {
  const params = useLocalSearchParams<{ type?: string; id?: string }>();
  const { txs, categories, currency, lastMethod, addTx, updateTx } = useStore();
  const insets = useSafeAreaInsets();

  const editing = params.id ? txs.find((t) => t.id === params.id) : undefined;

  const [type, setType] = useState<TxType>(editing?.type ?? (params.type === 'income' ? 'income' : 'expense'));
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '');
  const [date, setDate] = useState(editing?.date ?? todayISO());
  const [category, setCategory] = useState(editing?.type === 'expense' ? editing.category : '');
  const [source, setSource] = useState(editing?.type === 'income' ? editing.category : 'Salary');
  const [method, setMethod] = useState(editing?.method || lastMethod);
  const [note, setNote] = useState(editing?.note ?? '');
  const [error, setError] = useState('');
  const [picker, setPicker] = useState<'category' | 'method' | 'source' | null>(null);
  const [saved, setSaved] = useState<{ title: string; line: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const isExpense = type === 'expense';
  const noun = isExpense ? 'Expense' : 'Income';

  const pickDate = () => {
    if (Platform.OS !== 'android') return;
    DateTimePickerAndroid.open({
      value: fromISO(date),
      mode: 'date',
      onChange: (_, d) => d && setDate(toISO(d)),
    });
  };

  const save = () => {
    if (!amount.trim()) return setError('Please enter an amount.');
    const value = parseAmount(amount);
    if (!(value > 0)) return setError('Please enter a valid amount.');
    if (isExpense && !category) return setError('Please select a category.');
    setError('');

    const data = {
      type,
      amount: Math.round(value * 100) / 100,
      date,
      category: isExpense ? category : source,
      method: isExpense ? method : '',
      note: note.trim(),
    };
    if (editing) updateTx(editing.id, data);
    else addTx(data);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setSaved({
      title: editing ? 'Transaction updated successfully.' : `${noun} Saved`,
      line: [data.category, data.method].filter(Boolean).join('  •  '),
    });
    timer.current = setTimeout(() => router.back(), 1400);
  };

  if (saved) {
    return (
      <View style={[s.savedWrap, { paddingTop: insets.top }]}>
        <View style={s.check}>
          <Icon name="checkmark" size={48} color={colors.white} />
        </View>
        <Text style={s.savedTitle}>{saved.title}</Text>
        <Text style={s.savedAmount}>{money(parseAmount(amount), currency)}</Text>
        <Text style={s.savedLine}>{saved.line}</Text>
        <PrimaryButton label="DONE" onPress={() => router.back()} style={{ alignSelf: 'stretch', marginTop: 32 }} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.white }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={s.close} accessibilityLabel="Close">
          <Icon name="close" size={22} />
        </Pressable>
        <Text style={s.title}>{editing ? `Edit ${noun}` : `Add ${noun}`}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Segmented
          options={[
            { label: 'Expense', value: 'expense' },
            { label: 'Income', value: 'income' },
          ]}
          value={type}
          onChange={setType}
        />

        <View style={s.amountBlock}>
          <Text style={s.amountLabel}>Amount</Text>
          <View style={s.amountRow}>
            <Text style={s.currency}>{currency}</Text>
            <TextInput
              value={amount}
              onChangeText={(v) => {
                setAmount(v.replace(/[^0-9.,]/g, ''));
                setError('');
              }}
              placeholder="0.00"
              placeholderTextColor="#C3CEDB"
              keyboardType="decimal-pad"
              autoFocus
              style={s.amountInput}
              selectionColor={colors.skyDeep}
            />
          </View>
        </View>

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
        <PickRow icon="calendar-outline" label="Date" value={fmtDate(date)} onPress={pickDate} />
        <TextField icon="create-outline" placeholder="Note (optional)" value={note} onChangeText={setNote} multiline />

        {error ? (
          <View style={s.errorRow}>
            <Icon name="alert-circle-outline" size={18} color={colors.expense} />
            <Text style={s.error}>{error}</Text>
          </View>
        ) : null}

        <PrimaryButton label={editing ? 'SAVE CHANGES' : `SAVE ${noun.toUpperCase()}`} onPress={save} style={{ marginTop: 14 }} />
      </ScrollView>

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
        footer={{ label: 'Add New Category', icon: 'add-circle-outline', onPress: () => router.push('/categories') }}
      />
      <PickerModal visible={picker === 'method'} title="Payment Method" options={PAYMENT_METHODS} selected={method} onSelect={setMethod} onClose={() => setPicker(null)} />
      <PickerModal visible={picker === 'source'} title="Income Source" options={INCOME_SOURCES} selected={source} onSelect={setSource} onClose={() => setPicker(null)} />
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8, backgroundColor: colors.white },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.field, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  amountBlock: { alignItems: 'center', paddingVertical: 28 },
  amountLabel: { fontSize: 14, color: colors.muted, marginBottom: 6 },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 8 },
  currency: { fontSize: 22, fontWeight: '600', color: colors.muted },
  amountInput: { fontSize: 46, fontWeight: '800', color: colors.text, minWidth: 120, textAlign: 'center', padding: 0 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  error: { color: colors.expense, fontSize: 14, fontWeight: '500' },
  savedWrap: { flex: 1, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: 28 },
  check: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.skyDeep, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  savedTitle: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center' },
  savedAmount: { fontSize: 34, fontWeight: '800', color: colors.skyDeep, marginTop: 10 },
  savedLine: { fontSize: 15, color: colors.muted, marginTop: 6 },
});
