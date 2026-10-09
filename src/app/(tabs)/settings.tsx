import { router } from 'expo-router';
import Constants from 'expo-constants';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../components/Text';
import { confirmDialog } from '../../components/Dialogs';
import { Card, Icon, IconBubble, PickerModal, Screen, TAB_SPACE, toast } from '../../components/ui';
import type { ThemeMode } from '../../lib/types';
import { APP_INFO, copyrightLine } from '../../lib/appInfo';
import { useStore } from '../../lib/store';
import { colors, themedStyles } from '../../lib/theme';

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

const APPEARANCE: { mode: ThemeMode; label: string; icon: string }[] = [
  { mode: 'system', label: 'System default', icon: 'phone-portrait-outline' },
  { mode: 'light', label: 'Light', icon: 'sunny-outline' },
  { mode: 'dark', label: 'Dark', icon: 'moon-outline' },
];

export default function Settings() {
  const { currency, syncProvider, syncEnabled, syncStatus, pending, recurring, themeMode, setSettings, replayIntro, loadSample, removeSample, hasSample } = useStore();
  const [picker, setPicker] = useState(false);

  const toggleSample = async () => {
    if (hasSample) {
      const ok = await confirmDialog({
        title: 'Remove sample data?',
        message: 'Only the example entries are removed. Anything you added yourself stays.',
        confirmLabel: 'Remove',
        confirmIcon: 'trash-outline',
        danger: true,
      });
      if (!ok) return;
      removeSample();
      toast('Sample data removed.');
    } else {
      const ok = await confirmDialog({
        title: 'Load sample data?',
        message: `Adds six months of example transactions, budgets and recurring bills so you can explore the app. You can remove them any time.${syncEnabled ? ' Because sync is on, they will also be saved to your synced folder or sheet.' : ''}`,
        confirmLabel: 'Load',
        confirmIcon: 'flask-outline',
        icon: 'flask-outline',
      });
      if (!ok) return;
      loadSample();
      toast('Sample data added.');
    }
  };

  const target = syncProvider === 'folder' ? 'Folder' : 'Google Sheet';
  const syncValue = !syncEnabled
    ? 'Private'
    : syncStatus === 'syncing'
      ? 'Syncing…'
      : syncStatus === 'error'
        ? `${target} · error`
        : pending.length > 0
          ? `${target} · ${pending.length} waiting`
          : `${target} · synced`;

  return (
    <Screen bottom={TAB_SPACE + 20}>
      <Group title="Sync & Privacy" />
      <Card style={s.card}>
        <Row icon="sync-outline" label="Sync & Backup" value={syncValue} onPress={() => router.push('/sync')} />
        <Row icon="shield-checkmark-outline" label="Privacy & Data" onPress={() => router.push('/privacy')} last />
      </Card>

      <Group title="Data" />
      <Card style={s.card}>
        <Row icon="cloud-upload-outline" label="Backup Data" onPress={() => router.push('/backup')} />
        <Row icon="cloud-download-outline" label="Restore Data" onPress={() => router.push('/restore')} />
        <Row icon="share-outline" label="Export Transactions" onPress={() => router.push('/export')} last />
      </Card>

      <Group title="Management" />
      <Card style={s.card}>
        <Row icon="grid-outline" label="Categories & Budgets" onPress={() => router.push('/categories')} />
        <Row
          icon="repeat-outline"
          label="Recurring"
          value={recurring.length ? `${recurring.filter((r) => r.active).length} active` : undefined}
          onPress={() => router.push('/recurring')}
          last
        />
      </Card>

      <Group title="App" />
      <Card style={s.card}>
        <Row icon="cash-outline" label="Currency" value={currency} onPress={() => router.push('/currency')} />
        <Row icon="moon-outline" label="Appearance" value={APPEARANCE.find((a) => a.mode === themeMode)?.label} onPress={() => setPicker(true)} />
        <Row icon="play-circle-outline" label="Welcome tour" onPress={replayIntro} />
        <Row
          icon={hasSample ? 'trash-bin-outline' : 'flask-outline'}
          label={hasSample ? 'Remove sample data' : 'Load sample data'}
          onPress={toggleSample}
        />
        <Row icon="information-circle-outline" label="Version" value={Constants.expoConfig?.version ?? '1.0.0'} last />
      </Card>

      <PickerModal
        visible={picker}
        title="Appearance"
        options={APPEARANCE.map((a) => ({ label: a.label, icon: a.icon }))}
        selected={APPEARANCE.find((a) => a.mode === themeMode)?.label}
        onSelect={(label) => {
          const mode = APPEARANCE.find((a) => a.label === label)?.mode;
          if (!mode || mode === themeMode) return;
          setSettings({ themeMode: mode });
          // Changing the theme rebuilds the screens and lands on Home, so return to Settings afterwards
          setTimeout(() => router.navigate('/settings'), 350);
        }}
        onClose={() => setPicker(false)}
      />

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

const s = themedStyles(() => StyleSheet.create({
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
  copyright: { fontSize: 12, color: colors.faint, marginTop: 2 },
}));
