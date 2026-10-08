import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import { confirmDialog } from '../components/Dialogs';
import { Card, Icon, IconBubble, PrimaryButton, Screen, toast } from '../components/ui';
import { useStore } from '../lib/store';
import { colors, themedStyles } from '../lib/theme';

const count = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function Point({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <View style={s.point}>
      <IconBubble name={icon} size={38} />
      <View style={{ flex: 1 }}>
        <Text style={s.pointTitle}>{title}</Text>
        <Text style={s.pointBody}>{body}</Text>
      </View>
    </View>
  );
}

export default function Privacy() {
  const { txs, categories, recurring, syncProvider, folderLabel, eraseAll } = useStore();

  const where =
    syncProvider === 'folder'
      ? `On this phone, and in the folder you chose (${folderLabel}).`
      : syncProvider === 'script'
        ? 'On this phone, and in the Google Sheet you connected.'
        : 'On this phone only.';

  const erase = async () => {
    const ok = await confirmDialog({
      title: 'Delete all my data?',
      message:
        syncProvider === 'none'
          ? `This permanently removes your ${txs.length} transactions, categories, budgets and recurring rules from this phone. This can't be undone, so make a backup first if you might need it.`
          : 'This permanently removes your data from this phone and stops syncing. Files already in your folder or sheet are not touched, so you can delete those yourself. This can’t be undone.',
      confirmLabel: 'Delete all',
      confirmIcon: 'trash-outline',
      danger: true,
      icon: 'trash-outline',
    });
    if (!ok) return;
    eraseAll();
    toast('All data deleted from this phone.');
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <Screen>
      <Card style={{ gap: 6 }}>
        <Text style={s.heading}>Where your data is</Text>
        <Text style={s.where}>{where}</Text>
        <Text style={s.counts}>
          {count(txs.length, 'transaction')} · {count(categories.length, 'category', 'categories')} · {count(recurring.length, 'recurring rule')}
        </Text>
      </Card>

      <Text style={s.group}>Our promise</Text>
      <Card style={{ gap: 16 }}>
        <Point icon="person-remove-outline" title="No account" body="You never sign up or log in. There is no Expense Tracker account to leak." />
        <Point icon="server-outline" title="No server" body="We don't run a server or database. Your entries are never sent to us because there is nowhere to send them." />
        <Point icon="eye-off-outline" title="No tracking" body="No ads, no analytics and no third-party trackers." />
        <Point icon="key-outline" title="No sensitive permissions" body="No contacts, location, camera, microphone or storage access. The app only reaches a folder if you choose one." />
      </Card>

      <Text style={s.group}>If you choose to sync</Text>
      <Card>
        <Text style={s.body}>
          Data goes only to the folder or Google Sheet you pick, and that place belongs to you. If you share it with someone, they can see your data. The app can't see anything else in that folder.
        </Text>
      </Card>

      <Text style={s.group}>Your controls</Text>
      <Card style={{ gap: 16 }}>
        <Point icon="share-outline" title="Take it with you" body="Export to CSV or make a backup file from Settings at any time." />
        <Point icon="cloud-offline-outline" title="Stop syncing" body="Switch back to “Only on this phone” in Sync & Backup." />
      </Card>

      <PrimaryButton label="DELETE ALL MY DATA" icon="trash-outline" danger onPress={erase} style={{ marginTop: 24 }} />
    </Screen>
  );
}

const s = themedStyles(() => StyleSheet.create({
  heading: { fontSize: 13, fontWeight: '700', color: colors.muted, letterSpacing: 0.5, textTransform: 'uppercase' },
  where: { fontSize: 17, fontWeight: '700', color: colors.text, lineHeight: 24 },
  counts: { fontSize: 13.5, color: colors.muted },
  group: { fontSize: 13, fontWeight: '700', color: colors.muted, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 20, marginBottom: 10 },
  point: { flexDirection: 'row', gap: 12 },
  pointTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  pointBody: { fontSize: 13.5, lineHeight: 19, color: colors.muted, marginTop: 2 },
  body: { fontSize: 14, lineHeight: 20, color: colors.text },
}));
