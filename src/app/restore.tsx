import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Text } from '../components/Text';
import { confirmDialog } from '../components/Dialogs';
import { Card, PrimaryButton, Screen, toast } from '../components/ui';
import { DEFAULT_ICON } from '../lib/constants';
import { useStore } from '../lib/store';
import { colors, themedStyles } from '../lib/theme';
import type { Category, Recurring, Transaction } from '../lib/types';

function parseBackup(text: string): { txs: Transaction[]; categories: Category[]; recurring?: Recurring[] } {
  const data = JSON.parse(text);
  if (!Array.isArray(data?.transactions) || !Array.isArray(data?.categories)) throw new Error('bad shape');
  const txs: Transaction[] = data.transactions.map((t: any) => ({
    id: String(t.id),
    type: t.type === 'income' ? 'income' : 'expense',
    amount: Number(t.amount) || 0,
    date: String(t.date).slice(0, 10),
    category: String(t.category ?? ''),
    method: String(t.method ?? ''),
    note: String(t.note ?? ''),
    updatedAt: Number(t.updatedAt) || Date.now(),
  }));
  const categories: Category[] = data.categories.map((c: any) => {
    const budget = Number(c.budget);
    return {
      id: String(c.id),
      name: String(c.name),
      icon: String(c.icon || DEFAULT_ICON),
      ...(budget > 0 ? { budget } : {}),
    };
  });
  // Older backups have no recurring rules; keep the ones already on this phone in that case
  const recurring: Recurring[] | undefined = Array.isArray(data.recurring)
    ? data.recurring
        .filter((r: any) => r && r.id && /^\d{4}-\d{2}-\d{2}$/.test(String(r.nextDate)))
        .map((r: any) => ({
          id: String(r.id),
          type: r.type === 'income' ? 'income' : 'expense',
          amount: Number(r.amount) || 0,
          category: String(r.category ?? ''),
          method: String(r.method ?? ''),
          note: String(r.note ?? ''),
          frequency: r.frequency === 'weekly' ? 'weekly' : 'monthly',
          anchorDay: Number(r.anchorDay) || Number(String(r.nextDate).slice(8, 10)) || 1,
          nextDate: String(r.nextDate),
          active: r.active !== false,
        }))
    : undefined;
  return { txs, categories, recurring };
}

export default function Restore() {
  const { restoreAll } = useStore();

  const pick = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
      if (res.canceled || !res.assets?.[0]) return;
      const backup = parseBackup(await new File(res.assets[0].uri).text());
      const ok = await confirmDialog({
        title: 'Restore Data?',
        message: `This replaces your current data with ${backup.txs.length} transactions and ${backup.categories.length} categories from the backup. If Google Sheet is connected, the sheet is overwritten too.`,
        confirmLabel: 'Restore',
        danger: true,
        icon: 'cloud-download-outline',
      });
      if (!ok) return;
      restoreAll(backup.txs, backup.categories, backup.recurring);
      toast('Data restored successfully.');
      router.back();
    } catch {
      toast('That file is not a valid backup.');
    }
  };

  return (
    <Screen>
      <Card>
        <Text style={s.text}>Select a backup file to restore your data. Restoring replaces everything currently in the app.</Text>
      </Card>
      <PrimaryButton label="SELECT FILE" onPress={pick} style={{ marginTop: 20 }} />
    </Screen>
  );
}

const s = themedStyles(() => StyleSheet.create({
  text: { fontSize: 15, lineHeight: 22, color: colors.text },
}));
