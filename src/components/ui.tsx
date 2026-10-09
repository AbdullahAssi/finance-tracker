import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, LayoutAnimation, Modal, Pressable, ScrollView, StyleSheet, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import { Text, TextInput } from './Text';
import { MONTHS_SHORT, fmtDate, number } from '../lib/format';
import { Icon } from './icon';
import { useStore } from '../lib/store';
import { colors, radius, shadow, themedStyles } from '../lib/theme';
import type { Transaction } from '../lib/types';

export { Icon };

export { showToast as toast } from './Dialogs';

/** Space left at the bottom so content clears the floating tab bar. */
export const TAB_SPACE = 110;

export function Screen({
  children,
  bottom = 32,
  style,
}: {
  children: React.ReactNode;
  bottom?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={[{ padding: 16, paddingBottom: bottom }, style]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={s.sectionRow}>
      <Text style={s.sectionTitle}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text style={s.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  danger,
  disabled,
  loading,
  icon,
  style,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
  disabled?: boolean;
  /** Shows a spinner and ignores presses while work is in progress */
  loading?: boolean;
  icon?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const off = disabled || loading;
  return (
    <Pressable onPress={onPress} disabled={off} style={({ pressed }) => [{ opacity: disabled ? 0.5 : pressed || loading ? 0.85 : 1 }, style]}>
      <LinearGradient
        colors={danger ? ['#F57C93', colors.expense] : ['#7CC6F9', colors.skyDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.primary}
      >
        {loading ? <ActivityIndicator color={colors.white} /> : icon ? <Icon name={icon} size={20} color={colors.white} /> : null}
        <Text style={s.primaryText}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

/** Outlined button: white fill with a blue border so it stands out on the light background. */
export function SecondaryButton({
  label,
  onPress,
  icon,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.secondary, { opacity: pressed ? 0.7 : 1 }, style]}>
      {icon ? <Icon name={icon} size={20} color={colors.skyDeep} /> : null}
      <Text style={s.secondaryText}>{label}</Text>
    </Pressable>
  );
}

/** Light grey tappable row used for pickers in forms: icon, label, value, chevron. */
export function PickRow({
  icon,
  label,
  value,
  onPress,
  placeholder,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress: () => void;
  placeholder?: string;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.pickRow, pressed && { opacity: 0.7 }]}>
      <View style={s.pickIcon}>
        <Icon name={icon} size={18} color={colors.skyDeep} />
      </View>
      <Text style={s.pickLabel}>{label}</Text>
      <Text style={[s.pickValue, !value && { color: colors.muted }]} numberOfLines={1}>
        {value || placeholder || 'Select'}
      </Text>
      <Icon name="chevron-forward" size={16} color={colors.muted} />
    </Pressable>
  );
}

export function TextField(props: TextInputProps & { icon?: string }) {
  const { icon, style, ...rest } = props;
  return (
    <View style={s.textField}>
      {icon ? <Icon name={icon} size={18} color={colors.muted} /> : null}
      <TextInput placeholderTextColor={colors.muted} style={[s.textInput, style]} {...rest} />
    </View>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const position = useRef(new Animated.Value(index)).current;

  // Slide the highlight to the chosen option
  useEffect(() => {
    Animated.spring(position, { toValue: index, stiffness: 320, damping: 26, mass: 1, useNativeDriver: true }).start();
  }, [index, position]);

  const thumbWidth = width > 0 ? (width - SEG_PAD * 2) / options.length : 0;
  const translateX = position.interpolate({
    inputRange: options.map((_, i) => i),
    outputRange: options.map((_, i) => i * thumbWidth),
  });

  return (
    <View style={s.segment} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {thumbWidth > 0 ? <Animated.View style={[s.segThumb, { width: thumbWidth, transform: [{ translateX }] }]} /> : null}
      {options.map((o) => (
        <Pressable
          key={o.value}
          onPress={() => {
            if (o.value === value) return;
            Haptics.selectionAsync().catch(() => {});
            onChange(o.value);
          }}
          style={s.segItem}
          accessibilityRole="button"
          accessibilityState={{ selected: value === o.value }}
        >
          <Text style={[s.segText, value === o.value && { color: colors.skyDeep }]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const SEG_PAD = 4;

/** Call right before a state change that adds or removes parts of a form, so the layout eases instead of jumping. */
export function animateNext() {
  LayoutAnimation.configureNext(LayoutAnimation.create(220, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity));
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, active && s.chipActive]}>
      <Text style={[s.chipText, active && { color: colors.white }]}>{label}</Text>
    </Pressable>
  );
}

export function EmptyState({ icon, title, hint }: { icon: string; title: string; hint?: string }) {
  return (
    <View style={s.empty}>
      <View style={s.emptyIcon}>
        <Icon name={icon} size={30} color={colors.skyDeep} />
      </View>
      <Text style={s.emptyTitle}>{title}</Text>
      {hint ? <Text style={s.emptyHint}>{hint}</Text> : null}
    </View>
  );
}

export function IconBubble({ name, size = 44, color = colors.skyDeep }: { name: string; size?: number; color?: string }) {
  return (
    <View style={[s.bubble, { width: size, height: size, borderRadius: size / 2 }]}>
      <Icon name={name} size={size * 0.46} color={color} />
    </View>
  );
}

export function signedAmount(t: Transaction, currency: string) {
  return `${t.type === 'income' ? '+' : '-'}${currency} ${number(t.amount)}`;
}

export function TxRow({ tx, onPress, showDate }: { tx: Transaction; onPress: () => void; showDate?: boolean }) {
  const { currency, iconFor } = useStore();
  const sub = [tx.note, tx.method].filter(Boolean).join('  ·  ');
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.txRow, pressed && { opacity: 0.7 }]}>
      <IconBubble name={iconFor(tx)} color={tx.type === 'income' ? colors.income : colors.skyDeep} />
      <View style={{ flex: 1 }}>
        <Text style={s.txTitle} numberOfLines={1}>
          {tx.category || (tx.type === 'income' ? 'Income' : 'Expense')}
        </Text>
        <Text style={s.txSub} numberOfLines={1}>
          {showDate ? `${fmtDate(tx.date)}${sub ? '  ·  ' + sub : ''}` : sub || fmtDate(tx.date)}
        </Text>
      </View>
      <Text style={[s.txAmount, { color: tx.type === 'income' ? colors.income : colors.expense }]}>{signedAmount(tx, currency)}</Text>
    </Pressable>
  );
}

export interface PickerOption {
  label: string;
  icon?: string;
}

/** Bottom sheet list picker. */
export function PickerModal({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
  footer,
}: {
  visible: boolean;
  title: string;
  options: PickerOption[];
  selected?: string | null;
  onSelect: (label: string) => void;
  onClose: () => void;
  footer?: { label: string; icon: string; onPress: () => void };
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose} />
      <View style={s.sheet}>
        <View style={s.grabber} />
        <Text style={s.sheetTitle}>{title}</Text>
        <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
          {options.map((o) => {
            const active = o.label === selected;
            return (
              <Pressable
                key={o.label}
                onPress={() => {
                  onSelect(o.label);
                  onClose();
                }}
                style={[s.optRow, active && { backgroundColor: colors.skyTint }]}
              >
                {o.icon ? <IconBubble name={o.icon} size={38} /> : null}
                <Text style={s.optLabel}>{o.label}</Text>
                {active ? <Icon name="checkmark-circle" size={22} color={colors.skyDeep} /> : null}
              </Pressable>
            );
          })}
          {footer ? (
            <Pressable
              onPress={() => {
                onClose();
                footer.onPress();
              }}
              style={s.optRow}
            >
              <IconBubble name={footer.icon} size={38} />
              <Text style={[s.optLabel, { color: colors.skyDeep }]}>{footer.label}</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

/** Year + 12 month grid. */
export function MonthPicker({
  visible,
  value,
  onSelect,
  onClose,
}: {
  visible: boolean;
  value: string;
  onSelect: (key: string) => void;
  onClose: () => void;
}) {
  const [year, setYear] = useState(Number(value.slice(0, 4)));
  const selectedYear = Number(value.slice(0, 4));
  const selectedMonth = Number(value.slice(5, 7));
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} onShow={() => setYear(selectedYear)}>
      <Pressable style={[s.backdrop, { justifyContent: 'center', padding: 24 }]} onPress={onClose}>
        <Pressable style={s.monthCard}>
          <Text style={s.sheetTitle}>Select Month</Text>
          <View style={s.yearRow}>
            <Pressable onPress={() => setYear(year - 1)} hitSlop={12}>
              <Icon name="chevron-back" size={22} color={colors.skyDeep} />
            </Pressable>
            <Text style={s.yearText}>{year}</Text>
            <Pressable onPress={() => setYear(year + 1)} hitSlop={12}>
              <Icon name="chevron-forward" size={22} color={colors.skyDeep} />
            </Pressable>
          </View>
          <View style={s.monthGrid}>
            {MONTHS_SHORT.map((m, i) => {
              const active = year === selectedYear && i + 1 === selectedMonth;
              return (
                <Pressable
                  key={m}
                  style={[s.monthCell, active && { backgroundColor: colors.skyDeep }]}
                  onPress={() => {
                    onSelect(`${year}-${String(i + 1).padStart(2, '0')}`);
                    onClose();
                  }}
                >
                  <Text style={[s.monthText, active && { color: colors.white }]}>{m}</Text>
                </Pressable>
              );
            })}
          </View>
          <SecondaryButton label="Cancel" onPress={onClose} style={{ marginTop: 8 }} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = themedStyles(() => StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, ...shadow },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  sectionAction: { fontSize: 14, fontWeight: '600', color: colors.skyDeep },
  primary: { height: 54, borderRadius: radius.pill, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: colors.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  secondary: {
    height: 54,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.skyDeep,
  },
  secondaryText: { color: colors.skyDeep, fontSize: 16, fontWeight: '700' },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.field,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    height: 58,
    marginBottom: 10,
  },
  pickIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.skyTint, alignItems: 'center', justifyContent: 'center' },
  pickLabel: { fontSize: 15, color: colors.muted },
  pickValue: { flex: 1, textAlign: 'right', fontSize: 15, fontWeight: '600', color: colors.text },
  textField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.field,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    minHeight: 54,
    marginBottom: 10,
  },
  textInput: { flex: 1, fontSize: 15, color: colors.text, paddingVertical: 12 },
  segment: { flexDirection: 'row', backgroundColor: colors.field, borderRadius: radius.pill, padding: SEG_PAD },
  segThumb: {
    position: 'absolute',
    top: SEG_PAD,
    left: SEG_PAD,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    ...shadow,
    shadowOpacity: 0.1,
    elevation: 2,
  },
  segItem: { flex: 1, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  segText: { fontSize: 14, fontWeight: '600', color: colors.muted },
  chip: { paddingHorizontal: 16, height: 38, borderRadius: radius.pill, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.skyDeep, borderColor: colors.skyDeep },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.muted },
  empty: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 24 },
  emptyIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.skyTint, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  emptyHint: { fontSize: 14, color: colors.muted, marginTop: 4, textAlign: 'center' },
  bubble: { backgroundColor: colors.skyTint, alignItems: 'center', justifyContent: 'center' },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  txTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  txSub: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700' },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.35)' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 32 },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 12 },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 12 },
  optRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 10, borderRadius: radius.md },
  optLabel: { flex: 1, fontSize: 15.5, fontWeight: '500', color: colors.text },
  monthCard: { backgroundColor: colors.card, borderRadius: 28, padding: 20 },
  yearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28, marginBottom: 12 },
  yearText: { fontSize: 20, fontWeight: '700', color: colors.text },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  monthCell: { width: '30%', height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.field, marginBottom: 10 },
  monthText: { fontSize: 15, fontWeight: '600', color: colors.text },
}));
