import { router } from 'expo-router';
import Constants from 'expo-constants';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../components/Text';
import { Card, Icon, IconBubble, Screen, TAB_SPACE } from '../../components/ui';
import { APP_INFO, copyrightLine } from '../../lib/appInfo';
import { useStore } from '../../lib/store';
import { colors } from '../../lib/theme';

function Row({ icon, label, value, onPress, last }: { icon: string; label: string; value?: string; onPress?: () => void; last?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={[s.row, !last && s.rowBorder]}>
      <IconBubble name={icon} size={38} />
      <Text style={s.label}>{label}</Text>
      {value ? <Text style={s.value}>{value}</Text> : null}
      {onPress ? <Icon name="chevron-forward" size={18} color={colors.muted} /> : null}
    </Pressable>
  );
}

const Group = ({ title }: { title: string }) => <Text style={s.group}>{title}</Text>;

export default function Settings() {
  const { currency, sheetUrl, syncStatus, pending } = useStore();

  const sheetValue = !sheetUrl
    ? 'Not connected'
    : syncStatus === 'syncing'
      ? 'Syncing…'
      : syncStatus === 'error'
        ? 'Error'
        : pending.length > 0
          ? `${pending.length} waiting`
          : 'Synced';

  return (
    <Screen bottom={TAB_SPACE + 20}>
      <Group title="Sync" />
      <Card style={s.card}>
        <Row icon="logo-google" label="Google Sheet" value={sheetValue} onPress={() => router.push('/sheet')} last />
      </Card>

      <Group title="Data" />
      <Card style={s.card}>
        <Row icon="cloud-upload-outline" label="Backup Data" onPress={() => router.push('/backup')} />
        <Row icon="cloud-download-outline" label="Restore Data" onPress={() => router.push('/restore')} />
        <Row icon="share-outline" label="Export Transactions" onPress={() => router.push('/export')} last />
      </Card>

      <Group title="Management" />
      <Card style={s.card}>
        <Row icon="grid-outline" label="Categories" onPress={() => router.push('/categories')} last />
      </Card>

      <Group title="App" />
      <Card style={s.card}>
        <Row icon="cash-outline" label="Currency" value={currency} onPress={() => router.push('/currency')} />
        <Row icon="information-circle-outline" label="Version" value={Constants.expoConfig?.version ?? '1.0.0'} last />
      </Card>

      <View style={s.footer}>
        <View style={s.logo}>
          <Icon name="wallet" size={26} color={colors.white} />
        </View>
        <Text style={s.appName}>{APP_INFO.name}</Text>
        <Text style={s.version}>Version {Constants.expoConfig?.version ?? '1.0.0'}</Text>
        <View style={s.madeBy}>
          <Text style={s.footerText}>Made with</Text>
          <Icon name="heart" size={14} color={colors.expense} />
          <Text style={s.footerText}>by</Text>
          <Text style={s.author}>{APP_INFO.author}</Text>
        </View>
        <Text style={s.copyright}>{copyrightLine()}</Text>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  group: { fontSize: 13, fontWeight: '700', color: colors.muted, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 18, marginBottom: 10 },
  card: { paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  label: { flex: 1, fontSize: 15.5, fontWeight: '600', color: colors.text },
  value: { fontSize: 14, color: colors.muted },
  footer: { alignItems: 'center', marginTop: 32, gap: 4 },
  logo: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.skyDeep, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  appName: { fontSize: 16, fontWeight: '700', color: colors.text },
  version: { fontSize: 13, color: colors.muted },
  madeBy: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 },
  footerText: { fontSize: 13.5, color: colors.muted },
  author: { fontSize: 13.5, fontWeight: '700', color: colors.text },
  copyright: { fontSize: 12, color: '#9AA8BA', marginTop: 2 },
});
