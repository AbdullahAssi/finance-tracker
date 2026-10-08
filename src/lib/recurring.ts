import { nextInSeries } from './format';
import type { Recurring, Transaction } from './types';

/** Safety cap so a rule with a very old start date can never create an endless loop. */
const MAX_PER_RULE = 400;

/**
 * Creates every transaction that has become due up to `today`, including ones missed while the
 * app was closed, and moves each rule's nextDate forward. Returns null when nothing is due.
 * Ids are derived from rule + date, so running this twice can never create duplicates.
 */
export function runRecurring(
  rules: Recurring[],
  txs: Transaction[],
  today: string,
): { rules: Recurring[]; created: Transaction[] } | null {
  const existing = new Set(txs.map((t) => t.id));
  const created: Transaction[] = [];
  let changed = false;

  const next = rules.map((rule) => {
    if (!rule.active || rule.nextDate > today) return rule;
    let due = rule.nextDate;
    let count = 0;
    while (due <= today && count++ < MAX_PER_RULE) {
      const id = `rec-${rule.id}-${due}`;
      if (!existing.has(id)) {
        existing.add(id);
        created.push({
          id,
          type: rule.type,
          amount: rule.amount,
          date: due,
          category: rule.category,
          method: rule.method,
          note: rule.note,
          updatedAt: Date.now(),
        });
      }
      due = nextInSeries(rule.frequency, rule.anchorDay, due);
    }
    changed = true;
    return { ...rule, nextDate: due };
  });

  return changed ? { rules: next, created } : null;
}
