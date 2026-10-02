import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
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
import { PrimaryButton } from '../components/ui';
import { StoreProvider, useStore } from '../lib/store';
import { colors } from '../lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Keep the branded splash up at least this long so it never just flashes. */
const MIN_SPLASH_MS = 1200;

const detail = (title: string) => ({ headerShown: true, title });

function Root() {
  const { loaded } = useStore();
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

  return (
    <>
      <StatusBar style="dark" />
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
        <Stack.Screen name="sheet" options={detail('Google Sheet')} />
        <Stack.Screen name="backup" options={detail('Backup Data')} />
        <Stack.Screen name="restore" options={detail('Restore Data')} />
        <Stack.Screen name="export" options={detail('Export Transactions')} />
        <Stack.Screen name="currency" options={detail('Currency')} />
      </Stack>
      <DialogHost />
    </>
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

const s = StyleSheet.create({
  errorWrap: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 28 },
  errorIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FDECEF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  errorTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  errorText: { fontSize: 14.5, lineHeight: 21, color: colors.muted, textAlign: 'center', marginTop: 8 },
  errorDetail: { fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 12, opacity: 0.8 },
});
