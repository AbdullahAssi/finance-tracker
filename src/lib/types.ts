export type TxType = 'expense' | 'income';

export interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  /** YYYY-MM-DD, local date */
  date: string;
  /** Expense category name, or income source name */
  category: string;
  method: string;
  note: string;
  updatedAt: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  /** Optional monthly spending limit. Absent or 0 means no budget. */
  budget?: number;
}

export type Frequency = 'weekly' | 'monthly';

/** A rule that adds a transaction automatically each week or month. Lives on this phone; the transactions it creates sync normally. */
export interface Recurring {
  id: string;
  type: TxType;
  amount: number;
  /** Expense category name, or income source name */
  category: string;
  method: string;
  note: string;
  frequency: Frequency;
  /** Day of month a monthly rule keeps to (clamped in short months) */
  anchorDay: number;
  /** Next date a transaction is due, YYYY-MM-DD */
  nextDate: string;
  active: boolean;
}

/** A change made locally that still has to reach the Google Sheet. */
export type Op =
  | { kind: 'upsert'; tx: Transaction }
  | { kind: 'delete'; id: string }
  | { kind: 'categories'; categories: Category[] }
  | { kind: 'replaceAll'; transactions: Transaction[]; categories: Category[] };

export type DateRange = 'month' | 'today' | 'week' | 'lastMonth' | 'custom';

export interface Filters {
  type: 'all' | TxType;
  range: DateRange;
  from: string;
  to: string;
  category: string | null;
  method: string | null;
}

/**
 * Where data is kept besides this phone.
 *  none   - nowhere (private to this phone)
 *  folder - a data file in a folder the user picked (Drive, Dropbox, OneDrive, phone storage...)
 *  script - the user's own Google Apps Script web app + Sheet (advanced)
 */
export type SyncProvider = 'none' | 'folder' | 'script';

/** 'system' follows the phone's light/dark setting. */
export type ThemeMode = 'system' | 'light' | 'dark';

export type SyncStatus ='idle' | 'syncing' | 'error' | 'offline-setup';
