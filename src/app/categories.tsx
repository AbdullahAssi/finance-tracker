import { Stack } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import { confirmDialog } from '../components/Dialogs';
import { Card, Icon, IconBubble, PrimaryButton, Screen, SecondaryButton, TextField } from '../components/ui';
import { DEFAULT_ICON, ICON_CHOICES } from '../lib/constants';
import { newId, number, parseAmount } from '../lib/format';
import { useStore } from '../lib/store';
import { colors, radius, themedStyles } from '../lib/theme';
import type { Category } from '../lib/types';

export default function Categories() {
  const { categories, saveCategory, deleteCategory, txs, currency } = useStore();
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(DEFAULT_ICON);
  const [budget, setBudget] = useState('');
  const [error, setError] = useState('');

  const open = (c: Category | null) => {
    setEditing(c ?? { id: '', name: '', icon: DEFAULT_ICON });
    setName(c?.name ?? '');
    setIcon(c?.icon ?? DEFAULT_ICON);
    setBudget(c?.budget ? String(c.budget) : '');
    setError('');
  };

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return setError('Please enter a category name.');
    if (categories.some((c) => c.id !== editing?.id && c.name.toLowerCase() === trimmed.toLowerCase())) {
      return setError('A category with this name already exists.');
    }
    // Empty budget = no budget; anything else must be a valid positive amount
    let limit: number | undefined;
    if (budget.trim()) {
      limit = parseAmount(budget);
      if (!(limit >= 0)) return setError('Please enter a valid budget amount.');
    }
    saveCategory({ id: editing?.id || newId(), name: trimmed, icon, ...(limit ? { budget: limit } : {}) });
    setEditing(null);
  };

  const remove = async () => {
    if (!editing?.id) return;
    const used = txs.filter((t) => t.type === 'expense' && t.category === editing.name).length;
    const ok = await confirmDialog({
      title: 'Delete category?',
      message:
        used > 0
          ? `${used} existing transaction${used === 1 ? '' : 's'} will keep the name "${editing.name}".`
          : 'This category will be removed.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    deleteCategory(editing.id);
    setEditing(null);
  };

  return (
    <Screen>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => open(null)} hitSlop={10} accessibilityLabel="Add category">
              <Icon name="add-circle" size={30} color={colors.skyDeep} />
            </Pressable>
          ),
        }}
      />
      <Card style={{ paddingVertical: 4 }}>
        {categories.map((c, i) => (
          <Pressable key={c.id} onPress={() => open(c)} style={[s.row, i < categories.length - 1 && s.border]}>
            <IconBubble name={c.icon} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{c.name}</Text>
              {c.budget ? <Text style={s.budget}>Budget {currency} {number(c.budget, 0)} / month</Text> : null}
            </View>
            <Icon name="create-outline" size={18} color={colors.muted} />
          </Pressable>
        ))}
      </Card>

      <Modal visible={!!editing} transparent animationType="slide" onRequestClose={() => setEditing(null)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          <Pressable style={s.backdrop} onPress={() => setEditing(null)} />
          <View style={s.sheet}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={s.title}>{editing?.id ? 'Edit Category' : 'Add Category'}</Text>
              <TextField icon="pricetag-outline" placeholder="Category name" value={name} onChangeText={(v) => { setName(v); setError(''); }} />
              <TextField
                icon="speedometer-outline"
                placeholder={`Monthly budget in ${currency} (optional)`}
                value={budget}
                onChangeText={(v) => {
                  setBudget(v.replace(/[^0-9.,]/g, ''));
                  setError('');
                }}
                keyboardType="decimal-pad"
              />
              <Text style={s.label}>Icon</Text>
              <View style={s.grid}>
                {ICON_CHOICES.map((ic) => (
                  <Pressable key={ic} onPress={() => setIcon(ic)} style={[s.iconCell, icon === ic && s.iconActive]}>
                    <Icon name={ic} size={22} color={icon === ic ? colors.white : colors.skyDeep} />
                  </Pressable>
                ))}
              </View>
              {error ? <Text style={s.error}>{error}</Text> : null}
              <PrimaryButton label="SAVE CATEGORY" onPress={save} style={{ marginTop: 14 }} />
              {editing?.id ? <SecondaryButton label="Delete category" onPress={remove} style={{ marginTop: 10 }} /> : null}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

const s = themedStyles(() => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  border: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  name: { fontSize: 15.5, fontWeight: '600', color: colors.text },
  budget: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.35)' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 32 },
  title: { fontSize: 17, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  iconCell: { width: 46, height: 46, borderRadius: radius.md, backgroundColor: colors.skyTint, alignItems: 'center', justifyContent: 'center' },
  iconActive: { backgroundColor: colors.skyDeep },
  error: { color: colors.expense, fontSize: 14, marginTop: 10 },
}));
