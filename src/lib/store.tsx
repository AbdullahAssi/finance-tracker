import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { DEFAULT_CATEGORIES, INCOME_SOURCES } from './constants';
import { currentMonthKey, monthKey, newId, todayISO } from './format';
import { readFolder, syncWithFolder } from './folderData';
import { directoryIO, friendlyFolderError } from './folderIO';
import { applyOps, mergeData } from './ops';
import { callSheet } from './sheets';
import { runRecurring } from './recurring';
import { buildSampleData, isDemoId, withDemoBudgets, withoutDemoBudgets } from './sampleData';
import type { Category, Filters, Op, Recurring, SyncProvider, SyncStatus, ThemeMode, Transaction } from './types';

const STORAGE_KEY = 'expense-tracker-v1';

interface Persisted {
  txs: Transaction[];
  categories: Category[];
  recurring: Recurring[];
  pending: Op[];
  lastMethod: string;
  currency: string;
  sheetUrl: string;
  token: string;
  lastSync: number | null;
  lastBackup: number | null;
  themeMode: ThemeMode;
  /** Where data is kept besides this phone. Default 'none': everything stays private on the phone. */
  syncProvider: SyncProvider;
  /** content:// URI of the folder picked for folder sync */
  folderUri: string;
  folderLabel: string;
  /** False until the welcome screen has been completed */
  onboarded: boolean;
}

const initial: Persisted = {
  txs: [],
  categories: DEFAULT_CATEGORIES,
  recurring: [],
  pending: [],
  lastMethod: 'Cash',
  currency: 'AED',
  sheetUrl: '',
  token: '',
  lastSync: null,
  lastBackup: null,
  themeMode: 'system',
  syncProvider: 'none',
  folderUri: '',
  folderLabel: '',
  onboarded: false,
};

/** A provider is only usable once its details are filled in. */
function isSyncConfigured(s: Pick<Persisted, 'syncProvider' | 'folderUri' | 'sheetUrl'>) {
  return (s.syncProvider === 'folder' && !!s.folderUri) || (s.syncProvider === 'script' && !!s.sheetUrl);
}

/** Fills in the new fields for data saved by earlier versions, without changing what those users have. */
function migrate(saved: any): Persisted {
  const state: Persisted = { ...initial, ...saved };
  if (saved.syncProvider === undefined) {
    state.syncProvider = saved.sheetUrl ? 'script' : 'none';
  }
  if (saved.onboarded === undefined) {
    // Anyone who already uses the app has no need for the welcome screen
    state.onboarded = (saved.txs?.length ?? 0) > 0 || !!saved.sheetUrl;
  }
  // Nothing to upload when nothing is connected
  if (state.syncProvider === 'none') state.pending = [];
  return state;
}

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
  setSettings: (s: Partial<Pick<Persisted, 'currency' | 'lastBackup' | 'themeMode'>>) => void;
  saveRecurring: (r: Recurring) => void;
  deleteRecurring: (id: string) => void;
  restoreAll: (txs: Transaction[], categories: Category[], recurring?: Recurring[]) => void;
  /** True when a sync target (folder or sheet) is connected and fully set up */
  syncEnabled: boolean;
  connectFolder: (uri: string, label: string) => Promise<void>;
  connectScript: (url: string, token: string) => void;
  disconnectSync: () => void;
  eraseAll: () => void;
  completeOnboarding: () => void;
  replayIntro: () => void;
  loadSample: () => void;
  removeSample: () => void;
  /** True while example data is present */
  hasSample: boolean;
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
        if (raw) setState(migrate(JSON.parse(raw)));
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

  // Changes are only queued when there is somewhere to send them, so a private phone-only setup stores nothing extra
  const queue = (s: Persisted, ...ops: Op[]): Persisted =>
    s.syncProvider === 'none' ? s : { ...s, pending: [...s.pending, ...ops] };

  const syncEnabled = isSyncConfigured(state);
  const hasSample = useMemo(() => state.txs.some((t) => isDemoId(t.id)), [state.txs]);

  const sync = useCallback(async () => {
    const s = stateRef.current;
    if (!isSyncConfigured(s)) return false;
    if (syncing.current) return false;
    syncing.current = true;
    setSyncStatus('syncing');
    const sent = s.pending;
    try {
      const res =
        s.syncProvider === 'folder'
          ? await syncWithFolder(directoryIO(s.folderUri), sent)
          : await callSheet(s.sheetUrl, s.token, sent);
      setState((cur) => {
        const remaining = cur.pending.slice(sent.length);
        const sheetHasCategories = res.categories.length > 0;
        // An older script knows nothing about budgets, so keep the ones set on this phone
        const sheetCategories = res.categoriesHaveBudget
          ? res.categories
          : res.categories.map((c) => {
              const budget = cur.categories.find((l) => l.id === c.id)?.budget;
              return budget ? { ...c, budget } : c;
            });
        const base = {
          txs: res.transactions,
          categories: sheetHasCategories ? sheetCategories : cur.categories,
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
      setSyncError(s.syncProvider === 'folder' ? friendlyFolderError(e) : e?.message || 'Could not reach the sheet.');
      setSyncStatus('error');
      return false;
    } finally {
      syncing.current = false;
    }
  }, []);

  // Identifies the current sync target, so switching target triggers a fresh pull
  const syncTarget = syncEnabled ? `${state.syncProvider}|${state.folderUri}|${state.sheetUrl}` : '';

  // Push whenever something is queued (or a sync target gets connected)
  useEffect(() => {
    if (hydrated && syncTarget && state.pending.length > 0) sync();
  }, [hydrated, syncTarget, state.pending.length, sync]);

  // Pull on launch and whenever the app returns to the foreground
  useEffect(() => {
    if (!hydrated || !syncTarget) return;
    sync();
    const sub = AppState.addEventListener('change', (st) => st === 'active' && sync());
    return () => sub.remove();
  }, [hydrated, syncTarget, sync]);

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

  const setSettings = useCallback((p: Partial<Pick<Persisted, 'currency' | 'lastBackup' | 'themeMode'>>) => {
    setState((s) => ({ ...s, ...p }));
  }, []);

  const restoreAll = useCallback((txs: Transaction[], categories: Category[], recurring?: Recurring[]) => {
    setState((s) =>
      queue(
        { ...s, txs, categories, recurring: recurring ?? s.recurring, pending: [] },
        { kind: 'replaceAll', transactions: txs, categories },
      ),
    );
  }, []);

  const saveRecurring = useCallback((r: Recurring) => {
    setState((s) => ({
      ...s,
      recurring: s.recurring.some((x) => x.id === r.id) ? s.recurring.map((x) => (x.id === r.id ? r : x)) : [...s.recurring, r],
    }));
  }, []);

  // Stopping a rule keeps the transactions it already created
  const deleteRecurring = useCallback((id: string) => {
    setState((s) => ({ ...s, recurring: s.recurring.filter((x) => x.id !== id) }));
  }, []);

  // Create anything that has come due. Returns the same state object when nothing is due, so this can't loop.
  const createDueRecurring = useCallback(() => {
    setState((s) => {
      const due = runRecurring(s.recurring, s.txs, todayISO());
      if (!due) return s;
      return queue(
        { ...s, recurring: due.rules, txs: [...s.txs, ...due.created] },
        ...due.created.map((tx): Op => ({ kind: 'upsert', tx })),
      );
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    createDueRecurring();
    const sub = AppState.addEventListener('change', (st) => st === 'active' && createDueRecurring());
    return () => sub.remove();
  }, [hydrated, state.recurring, createDueRecurring]);

  /**
   * Start syncing through a folder. If the folder already holds data (a second phone joining),
   * both sets are merged so nothing from either side is lost. Throws a readable error if the
   * folder's data file is damaged, in which case nothing changes.
   */
  const connectFolder = useCallback(async (uri: string, label: string) => {
    const remote = await readFolder(directoryIO(uri));
    setState((s) => {
      const local = { txs: s.txs, categories: s.categories };
      const merged = remote ? mergeData(local, remote) : local;
      return {
        ...s,
        syncProvider: 'folder',
        folderUri: uri,
        folderLabel: label,
        sheetUrl: '',
        token: '',
        txs: merged.txs,
        categories: merged.categories,
        pending: [{ kind: 'replaceAll', transactions: merged.txs, categories: merged.categories }],
      };
    });
  }, []);

  /** Advanced: sync with the user's own Google Apps Script web app. Existing sheet rows stay; local entries are added to them. */
  const connectScript = useCallback((url: string, token: string) => {
    setState((s) => ({
      ...s,
      syncProvider: 'script',
      sheetUrl: url,
      token,
      folderUri: '',
      folderLabel: '',
      pending: [
        ...s.txs.map((tx): Op => ({ kind: 'upsert', tx })),
        { kind: 'categories', categories: s.categories },
      ],
    }));
  }, []);

  /** Back to phone-only. Data stays on the phone; whatever was already uploaded is not touched. */
  const disconnectSync = useCallback(() => {
    setState((s) => ({ ...s, syncProvider: 'none', sheetUrl: '', token: '', folderUri: '', folderLabel: '', pending: [], lastSync: null }));
    setSyncError('');
    setSyncStatus('idle');
  }, []);

  /** Removes everything this app stores on the phone and disconnects sync. Files already in a sync folder or sheet are not touched. */
  const eraseAll = useCallback(() => {
    // A clean slate: the welcome tour shows again, like a fresh install
    setState((s) => ({ ...initial, onboarded: false, themeMode: s.themeMode }));
    setSyncError('');
    setSyncStatus('idle');
  }, []);

  const completeOnboarding = useCallback(() => setState((s) => ({ ...s, onboarded: true })), []);
  /** Adds a realistic set of example data (for trying the app). Safe to call again; it never duplicates. */
  const loadSample = useCallback(() => {
    setState((s) => {
      if (s.txs.some((t) => isDemoId(t.id))) return s;
      const demo = buildSampleData();
      const categories = withDemoBudgets(s.categories);
      return queue(
        { ...s, txs: [...s.txs, ...demo.txs], categories, recurring: [...s.recurring, ...demo.recurring] },
        ...demo.txs.map((tx): Op => ({ kind: 'upsert', tx })),
        { kind: 'categories', categories },
      );
    });
  }, []);

  /** Removes only the example data. Anything you added yourself is kept. */
  const removeSample = useCallback(() => {
    setState((s) => {
      const gone = s.txs.filter((t) => isDemoId(t.id));
      const categories = withoutDemoBudgets(s.categories);
      return queue(
        { ...s, txs: s.txs.filter((t) => !isDemoId(t.id)), categories, recurring: s.recurring.filter((r) => !isDemoId(r.id)) },
        ...gone.map((t): Op => ({ kind: 'delete', id: t.id })),
        { kind: 'categories', categories },
      );
    });
  }, []);

  /** Shows the welcome tour again without touching any data. */
  const replayIntro = useCallback(() => setState((s) => ({ ...s, onboarded: false })), []);

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
      saveRecurring,
      deleteRecurring,
      restoreAll,
      syncEnabled,
      connectFolder,
      connectScript,
      disconnectSync,
      eraseAll,
      completeOnboarding,
      replayIntro,
      loadSample,
      removeSample,
      hasSample,
      sync,
      iconFor,
    }),
    [state, loaded, month, filters, syncStatus, syncError, syncEnabled, addTx, updateTx, deleteTx, saveCategory, deleteCategory, setSettings, saveRecurring, deleteRecurring, restoreAll, connectFolder, connectScript, disconnectSync, eraseAll, completeOnboarding, replayIntro, loadSample, removeSample, hasSample, sync, iconFor],
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
