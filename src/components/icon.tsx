import { Ionicons } from '@expo/vector-icons';
import { colors } from '../lib/theme';

/** Ionicons glyph by name. Kept in its own file so ui.tsx and Dialogs.tsx can both use it without a require cycle. */
export function Icon({ name, size = 22, color = colors.text }: { name: string; size?: number; color?: string }) {
  return <Ionicons name={name as keyof typeof Ionicons.glyphMap} size={size} color={color} />;
}
