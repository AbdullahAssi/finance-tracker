import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Text } from '../components/Text';
import { Card, PrimaryButton, Screen, toast } from '../components/ui';
import { shareTextFile } from '../lib/files';
import { todayISO } from '../lib/format';
import { useStore } from '../lib/store';
import { colors, themedStyles } from '../lib/theme';

export default function Backup() {
  const { txs, categories, recurring, currency, lastBackup, setSettings } = useStore();

  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    try {
      const payload = { app: 'expense-tracker', version: 1, exportedAt: new Date().toISOString(), currency, transactions: txs, categories, recurring };
      await shareTextFile(`expense-backup-${todayISO()}.json`, JSON.stringify(payload, null, 2), 'application/json');
      setSettings({ lastBackup: Date.now() });
      toast('Backup created successfully.');
    } catch (e: any) {
      toast(e?.message || 'Could not create the backup.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Card style={{ gap: 8 }}>
        <Text style={s.text}>Create a backup file of all your transactions and categories. Save it to Drive, email it, or keep it on your phone.</Text>
        <Text style={s.label}>Last backup</Text>
        <Text style={s.value}>{lastBackup ? new Date(lastBackup).toLocaleString() : 'Never'}</Text>
        <Text style={s.hint}>{txs.length} transactions • {categories.length} categories</Text>
      </Card>
      <PrimaryButton label="CREATE BACKUP" onPress={create} loading={busy} style={{ marginTop: 20 }} />
    </Screen>
  );
}

const s = themedStyles(() => StyleSheet.create({
  text: { fontSize: 15, lineHeight: 22, color: colors.text },
  label: { fontSize: 13, color: colors.muted, marginTop: 10 },
  value: { fontSize: 16, fontWeight: '700', color: colors.text },
  hint: { fontSize: 13, color: colors.muted, marginTop: 4 },
}));
