import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Text } from '../components/Text';
import { Card, PickRow, PrimaryButton, Screen, toast } from '../components/ui';
import { shareTextFile, toCsv } from '../lib/files';
import { fmtDate, fromISO, monthRange, toISO } from '../lib/format';
import { newestFirst, useStore } from '../lib/store';
import { colors, themedStyles } from '../lib/theme';

export default function Export() {
  const { txs, currency, month } = useStore();
  const [initFrom, initTo] = monthRange(month);
  const [from, setFrom] = useState(initFrom);
  const [to, setTo] = useState(initTo);
  const [busy, setBusy] = useState(false);

  const pick = (value: string, set: (v: string) => void) => {
    if (Platform.OS !== 'android') return;
    DateTimePickerAndroid.open({ value: fromISO(value), mode: 'date', onChange: (_, d) => d && set(toISO(d)) });
  };

  const run = async () => {
    const [a, b] = from <= to ? [from, to] : [to, from];
    const list = newestFirst(txs.filter((t) => t.date >= a && t.date <= b));
    if (list.length === 0) return toast('No transactions in this date range.');
    setBusy(true);
    try {
      await shareTextFile(`transactions-${a}_to_${b}.csv`, toCsv(list, currency), 'text/csv');
    } catch (e: any) {
      toast(e?.message || 'Could not export.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Text style={s.group}>Date range</Text>
      <PickRow icon="calendar-outline" label="From" value={fmtDate(from)} onPress={() => pick(from, setFrom)} />
      <PickRow icon="calendar-outline" label="To" value={fmtDate(to)} onPress={() => pick(to, setTo)} />
      <Card style={{ marginTop: 8 }}>
        <Text style={s.text}>Exports a CSV file. Excel and Google Sheets open CSV files directly.</Text>
      </Card>
      <PrimaryButton label="EXPORT CSV" onPress={run} loading={busy} style={{ marginTop: 20 }} />
    </Screen>
  );
}

const s = themedStyles(() => StyleSheet.create({
  group: { fontSize: 13, fontWeight: '700', color: colors.muted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 },
  text: { fontSize: 14, lineHeight: 20, color: colors.muted },
}));
