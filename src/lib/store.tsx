import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { DEFAULT_CATEGORIES, INCOME_SOURCES } from './constants';
import { currentMonthKey, monthKey, newId, todayISO } from './format';
import { applyOps } from './ops';
import { callSheet } from './sheets';
import type { Category, Filters, Op, SyncStatus, Transaction } from './types';

const STORAGE_KEY = 'expense-tracker-v1';

interface Persisted {
  txs: Transaction[];
  categories: Category[];
  pending: Op[];
  lastMethod: string;
  currency: string;
  sheetUrl: string;
  token: string;
  lastSync: number | null;
  lastBackup: number | null;
}

const initial: Persisted = {
  txs: [],
  categories: DEFAULT_CATEGORIES,
  pending: [],
  lastMethod: 'Cash',
  currency: 'AED',
  sheetUrl: '',
  token: '',
  lastSync: null,
  lastBackup: null,
};

export const defaultFilters = (): Filters => ({
  type: 'all',
  range: 'month',
  from: todayISO(),
  to: todayISO(),
  category: null,
  method: null,
});

export type NewTx = Omit<Transaction, 'id' | 'updatedAt'>;

interface Store extends Persisted {
  loaded: boolean;
  month: string;
  setMonth: (m: string) => void;
  filters: Filters;
  setFilters: (f: Filters) => void;
  syncStatus: SyncStatus;
  syncError: string;
  addTx: (t: NewTx) => Transaction;
  updateTx: (id: string, t: NewTx) => void;
  deleteTx: (id: string) => void;
  saveCategory: (c: Category) => void;
  deleteCategory: (id: string) => void;
  setSettings: (s: Partial<Pick<Persisted, 'currency' | 'sheetUrl' | 'token' | 'lastBackup'>>) => void;
  restoreAll: (txs: Transaction[], categories: Category[]) => void;
  sync: () => Promise<boolean>;
  iconFor: (t: Transaction) => string;
}

const Ctx = createContext<Store | null>(null);

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore outside StoreProvider');
  return v;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Persisted>(initial);
  const [loaded, setLoaded] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [month, setMonth] = useState(currentMonthKey());
  const [filters, setFilters] = useState<Filters>(defaultFilters());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncError, setSyncError] = useState('');

  const stateRef = useRef(state);
  stateRef.current = state;
  const syncing = useRef(false);

  // Load from disk once. `loaded` lets the UI open even if storage is slow;
  // `hydrated` only turns true once storage really answered, so a slow read can never be overwritten.
  useEffect(() => {
    const giveUp = setTimeout(() => setLoaded(true), 4000);
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setState({ ...initial, ...JSON.parse(raw) });
      })
      .catch(() => {})
      .finally(() => {
        clearTimeout(giveUp);
        setHydrated(true);
        setLoaded(true);
      });
    return () => clearTimeout(giveUp);
  }, []);

  // Persist on every change
  useEffect(() => {
    if (hydrated) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, hydrated]);

  const queue = (s: Persisted, ...ops: Op[]): Persisted => ({ ...s, pending: [...s.pending, ...ops] });

  const sync = useCallback(async () => {
    const s = stateRef.current;
    if (!s.sheetUrl) {
      setSyncStatus('offline-setup');
      return false;
    }
    if (syncing.current) return false;
    syncing.current = true;
    setSyncStatus('syncing');
    const sent = s.pending;
    try {
      const res = await callSheet(s.sheetUrl, s.token, sent);
      setState((cur) => {
        const remaining = cur.pending.slice(sent.length);
        const sheetHasCategories = res.categories.length > 0;
        const base = {
          txs: res.transactions,
          categories: sheetHasCategories ? res.categories : cur.categories,
        };
        const merged = applyOps(base, remaining);
        // First connection to an empty sheet: push our default categories up
        const pending =
          sheetHasCategories || remaining.some((o) => o.kind === 'categories' || o.kind === 'replaceAll')
            ? remaining
            : [...remaining, { kind: 'categories', categories: cur.categories } as Op];
        return { ...cur, txs: merged.txs, categories: merged.categories, pending, lastSync: Date.now() };
      });
      setSyncError('');
      setSyncStatus('idle');
      return true;
    } catch (e: any) {
      setSyncError(e?.message || 'Could not reach the sheet.');
      setSyncStatus('error');
      return false;
    } finally {
      syncing.current = false;
    }
  }, []);

  // Push whenever something is queued (or the sheet gets connected)
  useEffect(() => {
    if (hydrated && state.sheetUrl && state.pending.length > 0) sync();
  }, [hydrated, state.sheetUrl, state.pending.length, sync]);

  // Pull on launch and whenever the app returns to the foreground
  useEffect(() => {
    if (!hydrated || !state.sheetUrl) return;
    sync();
    const sub = AppState.addEventListener('change', (st) => st === 'active' && sync());
    return () => sub.remove();
  }, [hydrated, state.sheetUrl, sync]);

  const addTx = useCallback((t: NewTx) => {
    const tx: Transaction = { ...t, id: newId(), updatedAt: Date.now() };
    setState((s) =>
      queue({ ...s, txs: [...s.txs, tx], lastMethod: t.type === 'expense' ? t.method : s.lastMethod }, { kind: 'upsert', tx }),
    );
    return tx;
  }, []);

  const updateTx = useCallback((id: string, t: NewTx) => {
    const tx: Transaction = { ...t, id, updatedAt: Date.now() };
    setState((s) => queue({ ...s, txs: s.txs.map((x) => (x.id === id ? tx : x)) }, { kind: 'upsert', tx }));
  }, []);

  const deleteTx = useCallback((id: string) => {
    setState((s) => queue({ ...s, txs: s.txs.filter((x) => x.id !== id) }, { kind: 'delete', id }));
  }, []);

  const saveCategory = useCallback((c: Category) => {
    setState((s) => {
      const existing = s.categories.find((x) => x.id === c.id);
      const categories = existing ? s.categories.map((x) => (x.id === c.id ? c : x)) : [...s.categories, c];
      let txs = s.txs;
      const ops: Op[] = [{ kind: 'categories', categories }];
      // Keep old transactions attached to a renamed category
      if (existing && existing.name !== c.name) {
        const now = Date.now();
        txs = s.txs.map((t) => (t.type === 'expense' && t.category === existing.name ? { ...t, category: c.name, updatedAt: now } : t));
        txs.forEach((t, i) => t !== s.txs[i] && ops.push({ kind: 'upsert', tx: t }));
      }
      return queue({ ...s, categories, txs }, ...ops);
    });
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setState((s) => {
      const categories = s.categories.filter((x) => x.id !== id);
      return queue({ ...s, categories }, { kind: 'categories', categories });
    });
  }, []);

  const setSettings = useCallback((p: Partial<Pick<Persisted, 'currency' | 'sheetUrl' | 'token' | 'lastBackup'>>) => {
    setState((s) => ({ ...s, ...p }));
  }, []);

  const restoreAll = useCallback((txs: Transaction[], categories: Category[]) => {
    setState((s) => queue({ ...s, txs, categories, pending: [] }, { kind: 'replaceAll', transactions: txs, categories }));
  }, []);

  const iconFor = useCallback(
    (t: Transaction) => {
      if (t.type === 'income') return INCOME_SOURCES.find((i) => i.label === t.category)?.icon ?? 'cash-outline';
      return state.categories.find((c) => c.name === t.category)?.icon ?? 'ellipsis-horizontal-circle-outline';
    },
    [state.categories],
  );

  const value = useMemo<Store>(
    () => ({
      ...state,
      loaded,
      month,
      setMonth,
      filters,
      setFilters,
      syncStatus,
      syncError,
      addTx,
      updateTx,
      deleteTx,
      saveCategory,
      deleteCategory,
      setSettings,
      restoreAll,
      sync,
      iconFor,
    }),
    [state, loaded, month, filters, syncStatus, syncError, addTx, updateTx, deleteTx, saveCategory, deleteCategory, setSettings, restoreAll, sync, iconFor],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Totals for a set of transactions. */
export function totals(txs: Transaction[]) {
  let income = 0;
  let expense = 0;
  for (const t of txs) (t.type === 'income' ? (income += t.amount) : (expense += t.amount));
  return { income, expense, balance: income - expense };
}

export const inMonth = (txs: Transaction[], key: string) => txs.filter((t) => monthKey(t.date) === key);

/** Newest first; ties broken by last edit time. */
export const newestFirst = (txs: Transaction[]) =>
  [...txs].sort((a, b) => (a.date === b.date ? b.updatedAt - a.updatedAt : a.date < b.date ? 1 : -1));
