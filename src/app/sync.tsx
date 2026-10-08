import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import { confirmDialog } from '../components/Dialogs';
import { Card, Icon, IconBubble, PrimaryButton, Screen, toast } from '../components/ui';
import { friendlyFolderError, pickFolder } from '../lib/folderIO';
import { useStore } from '../lib/store';
import { colors, radius, themedStyles } from '../lib/theme';

function Option({
  icon,
  title,
  body,
  selected,
  children,
}: {
  icon: string;
  title: string;
  body: string;
  selected?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Card style={[s.option, selected && s.optionSelected]}>
      <View style={s.optionHead}>
        <IconBubble name={icon} size={42} />
        <View style={{ flex: 1 }}>
          <Text style={s.optionTitle}>{title}</Text>
        </View>
        {selected ? <Icon name="checkmark-circle" size={24} color={colors.skyDeep} /> : null}
      </View>
      <Text style={s.optionBody}>{body}</Text>
      {children}
    </Card>
  );
}

export default function SyncScreen() {
  const { syncProvider, folderLabel, connectFolder, disconnectSync, sync, syncStatus, syncError, pending, lastSync } = useStore();
  const [busy, setBusy] = useState(false);

  const onFolder = syncProvider === 'folder';
  const onSheet = syncProvider === 'script';
  const onPhone = syncProvider === 'none';
  const syncing = syncStatus === 'syncing';

  const chooseFolder = async () => {
    try {
      const picked = await pickFolder();
      if (!picked) return;
      setBusy(true);
      await connectFolder(picked.uri, picked.label);
      toast('Folder connected.');
    } catch (e: any) {
      await confirmDialog({
        title: "Couldn't use that folder",
        message: friendlyFolderError(e),
        confirmLabel: 'OK',
        single: true,
        icon: 'alert-circle-outline',
        danger: true,
      });
    } finally {
      setBusy(false);
    }
  };

  const stop = async () => {
    const ok = await confirmDialog({
      title: 'Stop syncing?',
      message: 'Your data stays on this phone. Files already in the folder or sheet are not deleted.',
      confirmLabel: 'Stop syncing',
      icon: 'cloud-offline-outline',
    });
    if (!ok) return;
    disconnectSync();
    toast('Now private to this phone.');
  };

  const statusLine = syncing
    ? 'Syncing…'
    : syncStatus === 'error'
      ? syncError
      : pending.length > 0
        ? `${pending.length} change${pending.length === 1 ? '' : 's'} waiting to upload.`
        : lastSync
          ? `Up to date. Last sync ${new Date(lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
          : 'Connected.';

  return (
    <Screen>
      <Option
        icon="phone-portrait-outline"
        title="Only on this phone"
        selected={onPhone}
        body="Private by default. Your data is stored on this phone only and never uploaded. Use Backup to keep a copy yourself."
      >
        {!onPhone ? (
          <Pressable onPress={stop} style={s.linkRow} hitSlop={8}>
            <Text style={s.link}>Stop syncing</Text>
          </Pressable>
        ) : null}
      </Option>

      <Option
        icon="folder-open-outline"
        title="Sync through a folder"
        selected={onFolder}
        body={
          onFolder
            ? `Using “${folderLabel}”. Choose the same synced folder on another phone to share the data.`
            : 'Pick a folder in Google Drive, Dropbox, OneDrive or on your phone. The app keeps one file there, so any app that syncs that folder shares your data between devices.'
        }
      >
        {onFolder ? (
          <>
            <Text style={[s.status, syncStatus === 'error' && { color: colors.expense }]}>{statusLine}</Text>
            <PrimaryButton label={syncing ? 'SYNCING…' : 'SYNC NOW'} loading={syncing} onPress={() => sync()} style={{ marginTop: 12 }} />
          </>
        ) : null}
        <Pressable onPress={chooseFolder} disabled={busy} style={[s.pickBtn, busy && { opacity: 0.6 }]}>
          <Icon name="folder-outline" size={18} color={colors.skyDeep} />
          <Text style={s.pickText}>{busy ? 'Connecting…' : onFolder ? 'Change folder' : 'Choose folder'}</Text>
        </Pressable>
      </Option>

      <Option
        icon="logo-google"
        title="Google Sheet (advanced)"
        selected={onSheet}
        body="Keep your transactions in a spreadsheet you own. Needs a one-time setup with a small script."
      >
        {onSheet ? <Text style={s.status}>{statusLine}</Text> : null}
        <Pressable onPress={() => router.push('/sheet')} style={s.linkRow} hitSlop={8}>
          <Text style={s.link}>{onSheet ? 'Manage Google Sheet' : 'Set up Google Sheet'}</Text>
          <Icon name="chevron-forward" size={16} color={colors.skyDeep} />
        </Pressable>
      </Option>

      <Card style={{ gap: 8 }}>
        <View style={s.privacyRow}>
          <Icon name="shield-checkmark-outline" size={20} color={colors.skyDeep} />
          <Text style={s.privacyTitle}>You stay in control</Text>
        </View>
        <Text style={s.help}>
          There is no Expense Tracker account or server. If you pick a folder, your data goes only to that folder, which belongs to you. The app can't see anything else in it.
        </Text>
      </Card>
    </Screen>
  );
}

const s = themedStyles(() => StyleSheet.create({
  option: { marginBottom: 14, gap: 10, borderWidth: 1.5, borderColor: 'transparent' },
  optionSelected: { borderColor: colors.skyDeep },
  optionHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  optionBody: { fontSize: 14, lineHeight: 20, color: colors.muted },
  status: { fontSize: 13.5, lineHeight: 19, color: colors.muted },
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.skyDeep,
    marginTop: 4,
  },
  pickText: { fontSize: 15, fontWeight: '700', color: colors.skyDeep },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  link: { fontSize: 14.5, fontWeight: '700', color: colors.skyDeep },
  privacyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  privacyTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  help: { fontSize: 13.5, lineHeight: 19, color: colors.muted },
}));
