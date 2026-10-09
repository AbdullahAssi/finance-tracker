import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, SectionList, StyleSheet, View } from 'react-native';
import { Text } from '../../components/Text';
import { Chip, EmptyState, Icon, MonthPicker, TAB_SPACE, TxRow } from '../../components/ui';
import { applyFilters, hasActiveFilters, RANGE_LABELS } from '../../lib/filter';
import { addDays, fmtLongDate, monthLabel, todayISO } from '../../lib/format';
import { newestFirst, useStore } from '../../lib/store';
import { usePullSync } from '../../lib/usePullSync';
import { colors, radius, themedStyles } from '../../lib/theme';

function dayTitle(date: string) {
  const today = todayISO();
  if (date === today) return 'TODAY';
  if (date === addDays(today, -1)) return 'YESTERDAY';
  return fmtLongDate(date).toUpperCase();
}

export default function Transactions() {
  const { txs, month, setMonth, filters, setFilters } = useStore();
  const [pickMonth, setPickMonth] = useState(false);
  const { refreshing, onRefresh } = usePullSync();

  const sections = useMemo(() => {
    const list = newestFirst(applyFilters(txs, filters, month));
    const groups: { title: string; data: typeof list }[] = [];
    for (const t of list) {
      const title = dayTitle(t.date);
      const last = groups[groups.length - 1];
      if (last && last.title === title) last.data.push(t);
      else groups.push({ title, data: [t] });
    }
    return groups;
  }, [txs, filters, month]);

  const active = hasActiveFilters(filters);
  const usingMonth = filters.range === 'month';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={s.bar}>
        <Pressable onPress={() => (usingMonth ? setPickMonth(true) : router.push('/filters'))} style={s.monthBtn}>
          <Text style={s.monthText}>{usingMonth ? monthLabel(month) : RANGE_LABELS[filters.range]}</Text>
          <Icon name="chevron-down" size={16} color={colors.skyDeep} />
        </Pressable>
        <Pressable onPress={() => router.push('/search')} style={s.iconBtn} accessibilityLabel="Search">
          <Icon name="search-outline" size={20} />
        </Pressable>
        <Pressable onPress={() => router.push('/filters')} style={s.iconBtn} accessibilityLabel="Filters">
          <Icon name="options-outline" size={20} />
          {active ? <View style={s.dot} /> : null}
        </Pressable>
      </View>

      <View style={s.chips}>
        <Chip label="All" active={filters.type === 'all'} onPress={() => setFilters({ ...filters, type: 'all' })} />
        <Chip label="Income" active={filters.type === 'income'} onPress={() => setFilters({ ...filters, type: 'income' })} />
        <Chip label="Expense" active={filters.type === 'expense'} onPress={() => setFilters({ ...filters, type: 'expense' })} />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(t) => t.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: TAB_SPACE + 20, flexGrow: 1 }}
        renderSectionHeader={({ section }) => <Text style={s.sectionHeader}>{section.title}</Text>}
        renderItem={({ item, index, section }) => (
          <View
            style={[
              s.itemWrap,
              index === 0 && s.itemFirst,
              index === section.data.length - 1 && s.itemLast,
            ]}
          >
            <TxRow tx={item} onPress={() => router.push(`/transaction/${item.id}`)} />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="No transactions found"
            hint={active || filters.type !== 'all' ? 'Try clearing your filters.' : 'Tap + to add your first transaction.'}
          />
        }
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.skyDeep]} />}
      />
      <MonthPicker visible={pickMonth} value={month} onSelect={setMonth} onClose={() => setPickMonth(false)} />
    </View>
  );
}

const s = themedStyles(() => StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 4 },
  monthBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  monthText: { fontSize: 17, fontWeight: '700', color: colors.text },
  iconBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', top: 9, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.expense },
  chips: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 14 },
  sectionHeader: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, color: colors.muted, marginTop: 14, marginBottom: 8 },
  itemWrap: { backgroundColor: colors.card, paddingHorizontal: 14 },
  itemFirst: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, paddingTop: 4 },
  itemLast: { borderBottomLeftRadius: radius.lg, borderBottomRightRadius: radius.lg, paddingBottom: 4 },
}));
