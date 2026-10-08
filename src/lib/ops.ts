import type { Category, Op, Transaction } from './types';

export interface Data {
  txs: Transaction[];
  categories: Category[];
}

/**
 * Combines this phone's data with data already in a sync location (for example a second phone joining a folder).
 * Nothing is lost: transactions are matched by id and the most recently edited copy wins; categories from the
 * sync location win, and categories that only exist here are kept.
 */
export function mergeData(local: Data, remote: Data): Data {
  const byId = new Map<string, Transaction>();
  for (const t of remote.txs) byId.set(t.id, t);
  for (const t of local.txs) {
    const other = byId.get(t.id);
    if (!other || t.updatedAt > other.updatedAt) byId.set(t.id, t);
  }

  const categories = [...remote.categories];
  const known = new Set(categories.map((c) => c.id));
  const names = new Set(categories.map((c) => c.name.toLowerCase()));
  for (const c of local.categories) {
    if (!known.has(c.id) && !names.has(c.name.toLowerCase())) categories.push(c);
  }

  return { txs: [...byId.values()], categories };
}

/** Re-applies queued local changes on top of a snapshot pulled from the sheet. */
export function applyOps(base: Data, ops: Op[]): Data {
  let { txs, categories } = base;
  for (const op of ops) {
    switch (op.kind) {
      case 'upsert': {
        const i = txs.findIndex((t) => t.id === op.tx.id);
        txs = i === -1 ? [...txs, op.tx] : txs.map((t, j) => (j === i ? op.tx : t));
        break;
      }
      case 'delete':
        txs = txs.filter((t) => t.id !== op.id);
        break;
      case 'categories':
        categories = op.categories;
        break;
      case 'replaceAll':
        txs = op.transactions;
        categories = op.categories;
        break;
    }
  }
  return { txs, categories };
}
