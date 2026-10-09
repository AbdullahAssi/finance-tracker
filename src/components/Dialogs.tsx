import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadow, themedStyles } from '../lib/theme';
import { Icon } from './icon';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  /** Small icon shown before the confirm label */
  confirmIcon?: string;
  cancelLabel?: string;
  /** A plain notice: shows only the confirm button */
  single?: boolean;
  /** Red styling for destructive actions */
  danger?: boolean;
  icon?: string;
}

let confirmImpl: ((o: ConfirmOptions) => Promise<boolean>) | null = null;
let toastImpl: ((message: string) => void) | null = null;

/** App-styled replacement for Alert.alert; resolves true when the user confirms. */
export const confirmDialog = (o: ConfirmOptions) => (confirmImpl ? confirmImpl(o) : Promise.resolve(false));

/** Short, app-styled confirmation message. */
export const showToast = (message: string) => toastImpl?.(message);

/** Mount once at the root; renders the confirm dialog and toast. */
export function DialogHost() {
  const insets = useSafeAreaInsets();
  const [dialog, setDialog] = useState<{ opts: ConfirmOptions; resolve: (v: boolean) => void } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    confirmImpl = (opts) => new Promise<boolean>((resolve) => setDialog({ opts, resolve }));
    toastImpl = (m) => {
      clearTimeout(timer.current);
      setMessage(m);
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setMessage(null));
      }, 2200);
    };
    return () => {
      confirmImpl = null;
      toastImpl = null;
      clearTimeout(timer.current);
    };
  }, [opacity]);

  const close = (value: boolean) => {
    dialog?.resolve(value);
    setDialog(null);
  };

  const opts = dialog?.opts;
  const danger = !!opts?.danger;

  return (
    <>
      <Modal visible={!!dialog} transparent animationType="fade" onRequestClose={() => close(false)}>
        <Pressable style={s.backdrop} onPress={() => close(false)}>
          <Pressable style={s.card}>
            <View style={[s.iconWrap, danger && { backgroundColor: colors.dangerTint }]}>
              <Icon
                name={opts?.icon ?? (danger ? 'trash-outline' : 'help-circle-outline')}
                size={30}
                color={danger ? colors.expense : colors.skyDeep}
              />
            </View>
            <Text style={s.title}>{opts?.title}</Text>
            {opts?.message ? <Text style={s.message}>{opts.message}</Text> : null}
            <View style={s.actions}>
              {opts?.single ? null : (
                <Pressable onPress={() => close(false)} style={[s.btn, s.cancel]}>
                  <Text style={s.cancelText}>{opts?.cancelLabel ?? 'Cancel'}</Text>
                </Pressable>
              )}
              <Pressable onPress={() => close(true)} style={s.btn}>
                <LinearGradient
                  colors={danger ? ['#F57C93', colors.expense] : ['#7CC6F9', colors.skyDeep]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.confirmFill}
                >
                  {opts?.confirmIcon ? <Icon name={opts.confirmIcon} size={18} color={colors.white} /> : null}
                  <Text style={s.confirmText} numberOfLines={1}>{opts?.confirmLabel ?? 'OK'}</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {message ? (
        <Animated.View pointerEvents="none" style={[s.toastWrap, { bottom: insets.bottom + 110, opacity }]}>
          <View style={s.toast}>
            <Icon name="checkmark-circle" size={20} color="#7CC6F9" />
            <Text style={s.toastText}>{message}</Text>
          </View>
        </Animated.View>
      ) : null}
    </>
  );
}

const s = themedStyles(() => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  card: { width: '100%', maxWidth: 360, backgroundColor: colors.card, borderRadius: 28, padding: 24, alignItems: 'center', ...shadow },
  iconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.skyTint, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 19, fontWeight: '800', color: colors.text, textAlign: 'center' },
  message: { fontSize: 14.5, lineHeight: 21, color: colors.muted, textAlign: 'center', marginTop: 8 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  btn: { flex: 1, height: 50, borderRadius: radius.pill, overflow: 'hidden' },
  cancel: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.field, borderWidth: 1, borderColor: colors.border },
  cancelText: { fontSize: 15, fontWeight: '700', color: colors.text },
  confirmFill: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  confirmText: { fontSize: 15, fontWeight: '700', color: colors.white },
  toastWrap: { position: 'absolute', left: 24, right: 24, alignItems: 'center' },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.toast, paddingHorizontal: 18, height: 48, borderRadius: 24, maxWidth: '100%' },
  toastText: { color: colors.white, fontSize: 14.5, fontWeight: '600', flexShrink: 1 },
}));
