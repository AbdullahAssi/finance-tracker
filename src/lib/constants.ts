import type { Category } from './types';

/** All icons are Ionicons glyph names (@expo/vector-icons). */
export const DEFAULT_ICON = 'ellipsis-horizontal-circle-outline';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-food', name: 'Food', icon: 'restaurant-outline' },
  { id: 'cat-groceries', name: 'Groceries', icon: 'cart-outline' },
  { id: 'cat-rent', name: 'Rent', icon: 'home-outline' },
  { id: 'cat-bills', name: 'Bills', icon: 'flash-outline' },
  { id: 'cat-transport', name: 'Transport', icon: 'car-outline' },
  { id: 'cat-shopping', name: 'Shopping', icon: 'bag-handle-outline' },
  { id: 'cat-medical', name: 'Medical', icon: 'medkit-outline' },
  { id: 'cat-education', name: 'Education', icon: 'school-outline' },
  { id: 'cat-debt', name: 'Debt / Installment', icon: 'card-outline' },
  { id: 'cat-other', name: 'Other', icon: DEFAULT_ICON },
];

export const INCOME_SOURCES = [
  { label: 'Salary', icon: 'cash-outline' },
  { label: 'Bonus', icon: 'gift-outline' },
  { label: 'Freelance', icon: 'laptop-outline' },
  { label: 'Other', icon: DEFAULT_ICON },
];

export const PAYMENT_METHODS = [
  { label: 'Cash', icon: 'cash-outline' },
  { label: 'Credit Card', icon: 'card-outline' },
  { label: 'Debit Card', icon: 'card' },
  { label: 'Bank', icon: 'business-outline' },
  { label: 'Other', icon: DEFAULT_ICON },
];

export const CURRENCIES = [
  { code: 'AED', name: 'UAE Dirham' },
  { code: 'PKR', name: 'Pakistani Rupee' },
  { code: 'SAR', name: 'Saudi Riyal' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'INR', name: 'Indian Rupee' },
];

export const ICON_CHOICES = [
  'restaurant-outline', 'cart-outline', 'home-outline', 'flash-outline', 'car-outline',
  'bag-handle-outline', 'medkit-outline', 'school-outline', 'card-outline', 'cafe-outline',
  'fast-food-outline', 'airplane-outline', 'film-outline', 'game-controller-outline', 'paw-outline',
  'happy-outline', 'barbell-outline', 'phone-portrait-outline', 'gift-outline', 'bus-outline',
  'receipt-outline', 'construct-outline', 'cut-outline', 'shirt-outline', 'water-outline',
  'wine-outline', 'bed-outline', 'wallet-outline',
];
