export type Scheme = 'light' | 'dark';

const light = {
  // Brand blues stay the same in both schemes, so the splash and gradient buttons never shift
  sky: '#5BB8F5',
  skyLight: '#9DD6FB',
  skyDeep: '#3A9BEA',
  skyTint: '#EAF5FE',
  bg: '#F4F8FC',
  /** Surface of cards, sheets, dialogs and the tab bar */
  card: '#FFFFFF',
  /** Input rows and toggle tracks. Must stand out from both `bg` and `card`. */
  field: '#E9EFF7',
  text: '#0F172A',
  muted: '#6B7A90',
  /** Quiet text and inactive icons */
  faint: '#9AA8BA',
  border: '#E6EDF5',
  expense: '#EF5A78',
  income: '#2B7DE9',
  warn: '#F5A524',
  /** Pure white, only for text and icons that sit on blue or coral */
  white: '#FFFFFF',
  // Charts
  axis: '#8A97A9',
  grid: '#E9EFF6',
  other: '#C5CFDB',
  // Misc
  overlay: 'rgba(244,248,252,0.94)',
  dangerTint: '#FDECEF',
  toast: '#0F2A43',
  /** Dashboard header gradient */
  headerA: '#5BB8F5',
  headerB: '#9DD6FB',
};

export type Palette = typeof light;

const dark: Palette = {
  sky: '#5BB8F5',
  skyLight: '#9DD6FB',
  skyDeep: '#3A9BEA',
  skyTint: '#162A44',
  bg: '#0A101C',
  card: '#131B2B',
  field: '#1A2437',
  text: '#E7EDF7',
  muted: '#8C9BB2',
  faint: '#5E6E87',
  border: '#222D42',
  expense: '#F0708A',
  income: '#5AA2F5',
  warn: '#F5A524',
  white: '#FFFFFF',
  axis: '#7C8AA0',
  grid: '#1E2940',
  other: '#44526B',
  overlay: 'rgba(8,13,22,0.94)',
  dangerTint: '#3A1B27',
  toast: '#26354D',
  headerA: '#1B4A7C',
  headerB: '#12335A',
};

const palettes: Record<Scheme, Palette> = { light, dark };

/**
 * The live palette. It is one shared object that applyTheme() updates in place,
 * so `colors.x` always reads the current theme at render time.
 */
export const colors: Palette = { ...light };

let current: Scheme = 'light';
let version = 0;

export const currentScheme = () => current;

export function applyTheme(scheme: Scheme) {
  if (scheme === current) return;
  current = scheme;
  Object.assign(colors, palettes[scheme]);
  version++;
}

/**
 * StyleSheet that is rebuilt after a theme change. Use instead of StyleSheet.create at module level:
 *   const s = themedStyles(() => StyleSheet.create({ ... }));
 * The factory runs on first use and again whenever the theme changes.
 */
export function themedStyles<T extends object>(factory: () => T): T {
  let cache: T | null = null;
  let cachedVersion = -1;
  return new Proxy({} as T, {
    get(_, key) {
      if (!cache || cachedVersion !== version) {
        cache = factory();
        cachedVersion = version;
      }
      return (cache as Record<string | symbol, unknown>)[key];
    },
  });
}

export const radius = { sm: 12, md: 18, lg: 24, pill: 999 };

export const shadow = {
  shadowColor: '#2F6FA8',
  shadowOpacity: 0.12,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 6 },
  elevation: 4,
} as const;
