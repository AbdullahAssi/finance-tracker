import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { colors } from '../lib/theme';

/**
 * Branded loading screen. The logo sits exactly where the native splash draws it
 * (same image, same size, centred) so the hand-over is seamless.
 */
export function Splash({ onReady }: { onReady?: () => void }) {
  return (
    <LinearGradient colors={[colors.sky, colors.skyDeep]} style={s.fill} onLayout={onReady}>
      <Image source={require('../../assets/splash-icon.png')} style={s.logo} />
      <View style={s.textBlock}>
        <Text style={s.name}>Expense Tracker</Text>
        <Text style={s.tag}>Personal Finance</Text>
      </View>
      <View style={s.loader}>
        <ActivityIndicator color={colors.white} />
        <Text style={s.status}>Loading your data…</Text>
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 200, height: 200 },
  textBlock: { position: 'absolute', left: 0, right: 0, top: '50%', marginTop: 96, alignItems: 'center' },
  name: { fontSize: 26, fontWeight: '800', color: colors.white, letterSpacing: -0.3 },
  tag: { fontSize: 14, color: 'rgba(255,255,255,0.88)', marginTop: 4 },
  loader: { position: 'absolute', bottom: 64, alignItems: 'center', gap: 10 },
  status: { fontSize: 13, color: 'rgba(255,255,255,0.88)' },
});
