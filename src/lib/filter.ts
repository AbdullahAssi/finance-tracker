import { addDays, currentMonthKey, monthRange, shiftMonth, startOfWeek, todayISO } from './format';
import type { Filters, Transaction } from './types';

export function rangeFor(f: Filters, month: string): [string, string] {
  const today = todayISO();
  switch (f.range) {
    case 'today':
      return [today, today];
    case 'week': {
      const start = startOfWeek(today);
      return [start, addDays(start, 6)];
    }
    case 'lastMonth':
      return monthRange(shiftMonth(currentMonthKey(), -1));
    case 'custom':
      return f.from <= f.to ? [f.from, f.to] : [f.to, f.from];
    default:
      return monthRange(month);
  }
}

export function applyFilters(txs: Transaction[], f: Filters, month: string): Transaction[] {
  const [from, to] = rangeFor(f, month);
  return txs.filter(
    (t) =>
      t.date >= from &&
      t.date <= to &&
      (f.type === 'all' || t.type === f.type) &&
      (!f.category || t.category === f.category) &&
      (!f.method || t.method === f.method),
  );
}

/** True when anything beyond the default (selected month, any type) is set. */
export const hasActiveFilters = (f: Filters) => f.range !== 'month' || !!f.category || !!f.method;

export const RANGE_LABELS: Record<Filters['range'], string> = {
  month: 'Selected month',
  today: 'Today',
  week: 'This week',
  lastMonth: 'Last month',
  custom: 'Custom',
};
