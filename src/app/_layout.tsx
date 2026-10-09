import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Fragment, useEffect, useState } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/inter';
import { FONT, Text } from '../components/Text';
import { DialogHost } from '../components/Dialogs';
import { Icon } from '../components/icon';
import { Splash } from '../components/Splash';
import { Welcome } from '../components/Welcome';
import { PrimaryButton } from '../components/ui';
import { StoreProvider, useStore } from '../lib/store';
import { applyTheme, colors, themedStyles, type Scheme } from '../lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Keep the branded splash up at least this long so it never just flashes. */
const MIN_SPLASH_MS = 1200;

const detail = (title: string) => ({ headerShown: true, title });

function Root() {
  const { loaded, themeMode, onboarded, completeOnboarding } = useStore();
  const systemScheme = useColorScheme();
  const scheme: Scheme = themeMode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : themeMode;
  const [minElapsed, setMinElapsed] = useState(false);
  const [fontsGiveUp, setFontsGiveUp] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    const min = setTimeout(() => setMinElapsed(true), MIN_SPLASH_MS);
    // Safety nets: never get stuck on the splash if fonts or the layout callback misbehave
    const fonts = setTimeout(() => setFontsGiveUp(true), 3500);
    const failsafe = setTimeout(() => SplashScreen.hideAsync().catch(() => {}), 3000);
    return () => {
      clearTimeout(min);
      clearTimeout(fonts);
      clearTimeout(failsafe);
    };
  }, []);

  const fontsReady = fontsLoaded || !!fontError || fontsGiveUp;

  if (!loaded || !minElapsed || !fontsReady) {
    return <Splash onReady={() => SplashScreen.hideAsync().catch(() => {})} />;
  }

  // Switch the shared palette before anything below renders. The key remounts the whole tree when the
  // theme changes, which is what makes every screen pick up the new colours.
  applyTheme(scheme);

  // First launch: a short welcome that explains the privacy model before anything is stored
  if (!onboarded) {
    return (
      <Fragment key={`welcome-${scheme}`}>
        <StatusBar style="light" />
        <Welcome onDone={completeOnboarding} />
      </Fragment>
    );
  }

  return (
    <Fragment key={scheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.bg },
          headerTitleStyle: { fontFamily: FONT.bold, color: colors.text },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="transaction/[id]" options={detail('Transaction Details')} />
        <Stack.Screen name="search" options={detail('Search Transactions')} />
        <Stack.Screen name="filters" options={detail('Filters')} />
        <Stack.Screen name="chart" options={detail('Expense Breakdown')} />
        <Stack.Screen name="categories" options={detail('Categories')} />
        <Stack.Screen name="sync" options={detail('Sync & Backup')} />
        <Stack.Screen name="privacy" options={detail('Privacy & Data')} />
        <Stack.Screen name="sheet" options={detail('Google Sheet')} />
        <Stack.Screen name="backup" options={detail('Backup Data')} />
        <Stack.Screen name="restore" options={detail('Restore Data')} />
        <Stack.Screen name="export" options={detail('Export Transactions')} />
        <Stack.Screen name="currency" options={detail('Currency')} />
        <Stack.Screen name="recurring" options={detail('Recurring')} />
        <Stack.Screen name="recurring-form" options={detail('Recurring')} />
      </Stack>
      <DialogHost />
    </Fragment>
  );
}

/** Shown by Expo Router if any screen throws, instead of a red/blank screen. */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  return (
    <View style={s.errorWrap}>
      <View style={s.errorIcon}>
        <Icon name="alert-circle-outline" size={36} color={colors.expense} />
      </View>
      <Text style={s.errorTitle}>Something went wrong</Text>
      <Text style={s.errorText}>Your saved data is safe. Try again, and if it keeps happening, restart the app.</Text>
      <Text style={s.errorDetail} numberOfLines={3}>
        {error?.message}
      </Text>
      <PrimaryButton label="TRY AGAIN" onPress={() => retry()} style={{ alignSelf: 'stretch', marginTop: 24 }} />
    </View>
  );
}

export default function Layout() {
  return (
    <StoreProvider>
      <Root />
    </StoreProvider>
  );
}

const s = themedStyles(() => StyleSheet.create({
  errorWrap: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 28 },
  errorIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.dangerTint, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  errorTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  errorText: { fontSize: 14.5, lineHeight: 21, color: colors.muted, textAlign: 'center', marginTop: 8 },
  errorDetail: { fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 12, opacity: 0.8 },
}));
