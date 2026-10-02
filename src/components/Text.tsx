import { ComponentProps } from 'react';
import { StyleSheet, Text as RNText, TextInput as RNTextInput } from 'react-native';

/**
 * Inter, the typeface used by most finance and banking apps.
 * Custom fonts have one file per weight, so the family is chosen from the style's fontWeight.
 */
export const FONT = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

const BY_WEIGHT: Record<string, string> = {
  normal: FONT.regular,
  '100': FONT.regular,
  '200': FONT.regular,
  '300': FONT.regular,
  '400': FONT.regular,
  '500': FONT.medium,
  '600': FONT.semibold,
  '700': FONT.bold,
  bold: FONT.bold,
  '800': FONT.extrabold,
  '900': FONT.extrabold,
};

type TextProps = ComponentProps<typeof RNText>;
type InputProps = ComponentProps<typeof RNTextInput>;

const familyFor = (style: TextProps['style']) => {
  const weight = StyleSheet.flatten(style)?.fontWeight;
  return BY_WEIGHT[String(weight ?? '400')] ?? FONT.regular;
};

// fontWeight is reset to normal because the weight is already baked into the chosen font file
export function Text({ style, ...rest }: TextProps) {
  return <RNText {...rest} style={[style, { fontFamily: familyFor(style), fontWeight: 'normal' }]} />;
}

export function TextInput({ style, ...rest }: InputProps) {
  return <RNTextInput {...rest} style={[style, { fontFamily: familyFor(style), fontWeight: 'normal' }]} />;
}
