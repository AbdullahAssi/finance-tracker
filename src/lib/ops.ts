import type { Category, Op, Transaction } from './types';

export interface Data {
  txs: Transaction[];
  categories: Category[];
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
