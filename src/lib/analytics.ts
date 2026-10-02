import { MONTHS_SHORT, currentMonthKey, shiftMonth, todayISO } from './format';
import type { Transaction } from './types';

export const daysInMonth = (month: string) => {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m, 0).getDate();
};

/** Expense total for each day of the month. The current month stops at today. */
export function dailySeries(txs: Transaction[], month: string): number[] {
  const [y, m] = month.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const expenses = txs.filter((t) => t.type === 'expense' && t.date.startsWith(month));

  let shown = daysInMonth;
  if (month === currentMonthKey()) {
    const lastEntryDay = expenses.reduce((n, t) => Math.max(n, Number(t.date.slice(8, 10))), 0);
    shown = Math.min(daysInMonth, Math.max(Number(todayISO().slice(8, 10)), lastEntryDay));
  }

  const out = Array<number>(shown).fill(0);
  for (const t of expenses) out[Number(t.date.slice(8, 10)) - 1] += t.amount;
  return out;
}

export interface MonthPoint {
  key: string;
  label: string;
  income: number;
  expense: number;
}

/** Income and expense totals for the `count` months ending at `month`. */
export function lastMonths(txs: Transaction[], month: string, count = 6): MonthPoint[] {
  const points: MonthPoint[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const key = shiftMonth(month, -i);
    let income = 0;
    let expense = 0;
    for (const t of txs) {
      if (!t.date.startsWith(key)) continue;
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    }
    points.push({ key, label: MONTHS_SHORT[Number(key.slice(5, 7)) - 1], income, expense });
  }
  return points;
}

export interface Slice {
  name: string;
  value: number;
}

/** Expense by category, largest first; everything past `top` is folded into "Other". */
export function categoryBreakdown(txs: Transaction[], month: string, top = 5): Slice[] {
  const map = new Map<string, number>();
  for (const t of txs) {
    if (t.type === 'expense' && t.date.startsWith(month)) map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
  }
  const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  if (sorted.length <= top + 1) return sorted;
  const rest = sorted.slice(top).reduce((n, s) => n + s.value, 0);
  return [...sorted.slice(0, top), { name: 'Other categories', value: rest }];
}

/** 1, 2, 5 × 10^n ceiling, for friendly axis maximums. */
export function niceMax(v: number) {
  if (v <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / exp;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * exp;
}

export function compact(n: number) {
  const a = Math.abs(n);
  if (a >= 1e6) return `${(n / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
  if (a >= 1e3) return `${(n / 1e3).toFixed(a >= 1e4 ? 0 : 1).replace(/\.0$/, '')}k`;
  return String(Math.round(n));
}
