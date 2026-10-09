import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import { confirmDialog } from '../components/Dialogs';
import { Card, Icon, PrimaryButton, Screen, SecondaryButton, TextField, toast } from '../components/ui';
import { useStore } from '../lib/store';
import { colors, themedStyles } from '../lib/theme';

/** Advanced option: sync with your own Google Sheet through an Apps Script web app. */
export default function SheetScreen() {
  const { syncProvider, sheetUrl, token, connectScript, disconnectSync, sync, syncStatus, syncError, pending, lastSync } = useStore();
  const connected = syncProvider === 'script' && !!sheetUrl;
  const [url, setUrl] = useState(connected ? sheetUrl : '');
  const [secret, setSecret] = useState(connected ? token : '');

  const dirty = url.trim() !== sheetUrl || secret.trim() !== token;

  const save = async () => {
    if (syncProvider === 'folder') {
      const ok = await confirmDialog({
        title: 'Switch to Google Sheet?',
        message: 'Folder sync will be turned off. Your data stays on this phone and in the folder.',
        confirmLabel: 'Switch',
        icon: 'swap-horizontal-outline',
      });
      if (!ok) return;
    }
    connectScript(url.trim(), secret.trim());
    toast('Connecting…');
  };

  const statusLine = !connected
    ? 'Not connected.'
    : syncStatus === 'syncing'
      ? 'Syncing…'
      : syncStatus === 'error'
        ? syncError
        : pending.length > 0
          ? `${pending.length} change${pending.length === 1 ? '' : 's'} waiting to upload.`
          : lastSync
            ? `All synced. Last sync ${new Date(lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
            : 'Connected.';

  return (
    <Screen>
      <Card style={{ gap: 6 }}>
        <View style={s.statusRow}>
          <Icon
            name={syncStatus === 'error' && connected ? 'cloud-offline-outline' : connected ? 'cloud-done-outline' : 'cloud-outline'}
            size={22}
            color={syncStatus === 'error' && connected ? colors.expense : colors.skyDeep}
          />
          <Text style={s.statusTitle}>{connected ? 'Google Sheet' : 'Not connected'}</Text>
        </View>
        <Text style={[s.statusText, { color: syncStatus === 'error' && connected ? colors.expense : colors.muted }]}>{statusLine}</Text>
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
        label={syncStatus === 'syncing' && connected ? 'SYNCING…' : connected && !dirty ? 'SYNC NOW' : 'SAVE & CONNECT'}
        onPress={connected && !dirty ? () => sync() : save}
        disabled={!url.trim()}
        loading={syncStatus === 'syncing' && connected}
        style={{ marginTop: 12 }}
      />
      {connected ? (
        <SecondaryButton
          label="Disconnect"
          style={{ marginTop: 10 }}
          onPress={() => {
            disconnectSync();
            setUrl('');
            setSecret('');
            router.back();
          }}
        />
      ) : null}

      <Card style={{ marginTop: 24, gap: 8 }}>
        <Text style={s.helpTitle}>For spreadsheet fans</Text>
        <Text style={s.help}>
          This keeps your transactions in a Google Sheet that you own, so you can open them in Sheets. It takes a one-time setup with a small script; the steps are in apps-script/README.md in the project.
        </Text>
        <Text style={s.help}>Most people are better off with folder sync, which needs no setup.</Text>
      </Card>
    </Screen>
  );
}

const s = themedStyles(() => StyleSheet.create({
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  statusText: { fontSize: 14, lineHeight: 20 },
  group: { fontSize: 13, fontWeight: '700', color: colors.muted, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 18, marginBottom: 10 },
  helpTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  help: { fontSize: 13.5, lineHeight: 19, color: colors.muted },
}));
