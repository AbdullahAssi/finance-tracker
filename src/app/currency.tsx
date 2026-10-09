import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import { Card, Icon, PrimaryButton, Screen } from '../components/ui';
import { CURRENCIES } from '../lib/constants';
import { useStore } from '../lib/store';
import { colors, themedStyles } from '../lib/theme';

export default function Currency() {
  const { currency, setSettings } = useStore();
  const [value, setValue] = useState(currency);

  return (
    <Screen>
      <Card style={{ paddingVertical: 4 }}>
        {CURRENCIES.map((c, i) => (
          <Pressable key={c.code} onPress={() => setValue(c.code)} style={[s.row, i < CURRENCIES.length - 1 && s.border]}>
            <Icon name={value === c.code ? 'radio-button-on' : 'radio-button-off'} size={22} color={value === c.code ? colors.skyDeep : colors.muted} />
            <View style={{ flex: 1 }}>
              <Text style={s.code}>{c.code}</Text>
              <Text style={s.name}>{c.name}</Text>
            </View>
          </Pressable>
        ))}
      </Card>
      <Text style={s.hint}>This only changes the label shown next to amounts. Existing amounts are not converted.</Text>
      <PrimaryButton
        label="SAVE"
        onPress={() => {
          setSettings({ currency: value });
          router.back();
        }}
        style={{ marginTop: 16 }}
      />
    </Screen>
  );
}

const s = themedStyles(() => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13 },
  border: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  code: { fontSize: 16, fontWeight: '700', color: colors.text },
  name: { fontSize: 13, color: colors.muted },
  hint: { fontSize: 13, color: colors.muted, marginTop: 12, lineHeight: 18 },
}));
