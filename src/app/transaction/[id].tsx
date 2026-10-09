import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../components/Text';
import { confirmDialog } from '../../components/Dialogs';
import { Card, EmptyState, IconBubble, PrimaryButton, Screen, SecondaryButton, signedAmount, toast } from '../../components/ui';
import { fmtLongDate } from '../../lib/format';
import { useStore } from '../../lib/store';
import { colors, themedStyles } from '../../lib/theme';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  );
}

export default function TransactionDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { txs, currency, deleteTx, iconFor } = useStore();
  const tx = txs.find((t) => t.id === id);

  if (!tx) {
    return (
      <Screen>
        <EmptyState icon="alert-circle-outline" title="Transaction not found" />
      </Screen>
    );
  }

  const isIncome = tx.type === 'income';

  const confirmDelete = async () => {
    const ok = await confirmDialog({
      title: 'Delete Transaction?',
      message: 'Are you sure you want to delete this transaction?',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    deleteTx(tx.id);
    toast('Transaction deleted.');
    router.back();
  };

  return (
    <Screen>
      <View style={s.hero}>
        <IconBubble name={iconFor(tx)} size={64} color={isIncome ? colors.income : colors.skyDeep} />
        <Text style={[s.amount, { color: isIncome ? colors.income : colors.expense }]}>{signedAmount(tx, currency)}</Text>
        <Text style={s.category}>{tx.category}</Text>
      </View>

      <Card>
        <Row label="Type" value={isIncome ? 'Income' : 'Expense'} />
        <Row label="Date" value={fmtLongDate(tx.date)} />
        <Row label={isIncome ? 'Source' : 'Category'} value={tx.category || '—'} />
        {!isIncome ? <Row label="Payment method" value={tx.method || '—'} /> : null}
        <Row label="Note" value={tx.note || '—'} />
      </Card>

      <View style={s.actions}>
        <SecondaryButton label="Edit" icon="create-outline" style={{ flex: 1 }} onPress={() => router.push({ pathname: '/add', params: { id: tx.id } })} />
        <PrimaryButton label="Delete" icon="trash-outline" danger style={{ flex: 1 }} onPress={confirmDelete} />
      </View>
    </Screen>
  );
}

const s = themedStyles(() => StyleSheet.create({
  hero: { alignItems: 'center', gap: 8, paddingVertical: 24 },
  amount: { fontSize: 34, fontWeight: '800', marginTop: 6 },
  category: { fontSize: 16, color: colors.muted },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowLabel: { fontSize: 14, color: colors.muted },
  rowValue: { flex: 1, textAlign: 'right', fontSize: 15, fontWeight: '600', color: colors.text },
  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
}));
