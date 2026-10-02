import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import { Card, Icon, PrimaryButton, Screen, SecondaryButton, TextField } from '../components/ui';
import { useStore } from '../lib/store';
import { colors } from '../lib/theme';

export default function SheetScreen() {
  const { sheetUrl, token, setSettings, sync, syncStatus, syncError, pending, lastSync } = useStore();
  const [url, setUrl] = useState(sheetUrl);
  const [secret, setSecret] = useState(token);

  const connected = !!sheetUrl;
  const dirty = url.trim() !== sheetUrl || secret.trim() !== token;

  const save = () => {
    setSettings({ sheetUrl: url.trim(), token: secret.trim() });
    // Let the new settings land in state before pulling
    setTimeout(() => sync(), 50);
  };

  const statusLine = !connected
    ? 'Not connected. Entries are saved on this phone only.'
    : syncStatus === 'syncing'
      ? 'Syncing…'
      : syncStatus === 'error'
        ? syncError
        : pending.length > 0
          ? `${pending.length} change${pending.length === 1 ? '' : 's'} waiting to upload.`
          : lastSync
            ? `All synced. Last sync ${new Date(lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
            : 'Connected.';

  const statusColor = syncStatus === 'error' ? colors.expense : colors.muted;

  return (
    <Screen>
      <Card style={{ gap: 6 }}>
        <View style={s.statusRow}>
          <Icon
            name={syncStatus === 'error' ? 'cloud-offline-outline' : connected ? 'cloud-done-outline' : 'cloud-outline'}
            size={22}
            color={syncStatus === 'error' ? colors.expense : colors.skyDeep}
          />
          <Text style={s.statusTitle}>{connected ? 'Google Sheet' : 'Not connected'}</Text>
        </View>
        <Text style={[s.statusText, { color: statusColor }]}>{statusLine}</Text>
      </Card>

      <Text style={s.group}>Web app URL</Text>
      <TextField
        icon="link-outline"
        placeholder="https://script.google.com/macros/s/…/exec"
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />
      <Text style={s.group}>Secret (optional)</Text>
      <TextField
        icon="key-outline"
        placeholder="Same value as SECRET in the script"
        value={secret}
        onChangeText={setSecret}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
      />

      <PrimaryButton
        label={syncStatus === 'syncing' ? 'SYNCING…' : connected && !dirty ? 'SYNC NOW' : 'SAVE & CONNECT'}
        onPress={connected && !dirty ? () => sync() : save}
        disabled={!url.trim()}
        loading={syncStatus === 'syncing'}
        style={{ marginTop: 12 }}
      />
      {connected ? (
        <SecondaryButton
          label="Disconnect"
          style={{ marginTop: 10 }}
          onPress={() => {
            setSettings({ sheetUrl: '', token: '' });
            setUrl('');
            setSecret('');
          }}
        />
      ) : null}

      <Card style={{ marginTop: 24, gap: 8 }}>
        <Text style={s.helpTitle}>How it works</Text>
        <Text style={s.help}>Your transactions are stored in your own Google Sheet. The app keeps a copy on this phone, so you can add entries offline. They upload automatically when you are back online.</Text>
        <Text style={s.help}>Setup steps are in apps-script/README.md in the project.</Text>
      </Card>
    </Screen>
  );
}

const s = StyleSheet.create({
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  statusText: { fontSize: 14, lineHeight: 20 },
  group: { fontSize: 13, fontWeight: '700', color: colors.muted, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 18, marginBottom: 10 },
  helpTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  help: { fontSize: 13.5, lineHeight: 19, color: colors.muted },
});
