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

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline-setup';
