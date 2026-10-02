import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Card, EmptyState, TextField, TxRow } from '../components/ui';
import { newestFirst, useStore } from '../lib/store';
import { colors } from '../lib/theme';

export default function Search() {
  const { txs } = useStore();
  const [q, setQ] = useState('');

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    return newestFirst(
      txs.filter((t) => [t.note, t.category, t.method].some((f) => f.toLowerCase().includes(needle))),
    );
  }, [txs, q]);

  return (
    <View style={s.wrap}>
      <TextField icon="search-outline" placeholder="Search note, category or payment method" value={q} onChangeText={setQ} autoFocus returnKeyType="search" />
      <FlatList
        data={results}
        keyExtractor={(t) => t.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 32 }}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: 10, paddingVertical: 4 }}>
            <TxRow tx={item} showDate onPress={() => router.push(`/transaction/${item.id}`)} />
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title={q.trim() ? 'No results' : 'Search your transactions'}
            hint={q.trim() ? 'Try a different word.' : 'Matches notes, categories and payment methods across all months.'}
          />
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, padding: 16 },
});
