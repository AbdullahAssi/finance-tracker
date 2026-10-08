import { DEFAULT_ICON } from './constants';
import { applyOps, type Data } from './ops';
import type { SheetData } from './sheets';
import type { Category, Op, Transaction } from './types';

/** Name of the data file kept in the folder the user picks. */
export const SYNC_FILE_NAME = 'expense-tracker-data.json';

/**
 * The few things folder sync needs from a folder. Android's file API is behind this
 * so the logic below can be tested without a phone.
 */
export interface FolderIO {
  exists(): boolean;
  sizeBytes(): number;
  readText(): Promise<string>;
  writeText(text: string): void;
}

export class FolderDataError extends Error {}

export const utf8Length = (s: string) => {
  let bytes = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 0x80) bytes += 1;
    else if (c < 0x800) bytes += 2;
    else if (c >= 0xd800 && c <= 0xdbff) {
      bytes += 4; // surrogate pair
      i++;
    } else bytes += 3;
  }
  return bytes;
};

export const serialize = (data: Data, now = Date.now()) =>
  JSON.stringify({ app: 'expense-tracker', version: 2, updatedAt: now, transactions: data.txs, categories: data.categories }, null, 1);

/** Reads the file's text. Throws FolderDataError for anything that is not our data, so it is never overwritten. */
export function parse(text: string): Data {
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new FolderDataError('The sync file in this folder is damaged, so it was left untouched.');
  }
  if (json?.app !== 'expense-tracker' || !Array.isArray(json.transactions) || !Array.isArray(json.categories)) {
    throw new FolderDataError('This folder has a file with the same name that is not Expense Tracker data.');
  }
  const txs: Transaction[] = json.transactions.map((t: any) => ({
    id: String(t.id),
    type: t.type === 'income' ? 'income' : 'expense',
    amount: Number(t.amount) || 0,
    date: String(t.date).slice(0, 10),
    category: String(t.category ?? ''),
    method: String(t.method ?? ''),
    note: String(t.note ?? ''),
    updatedAt: Number(t.updatedAt) || 0,
  }));
  const categories: Category[] = json.categories.map((c: any) => {
    const budget = Number(c.budget);
    return { id: String(c.id), name: String(c.name), icon: String(c.icon || DEFAULT_ICON), ...(budget > 0 ? { budget } : {}) };
  });
  return { txs, categories };
}

/**
 * Some Android storage providers do not truncate a file when it is rewritten, so a shorter
 * document would keep stale bytes from the old one at the end. Padding with spaces (which JSON
 * ignores) up to the previous size overwrites every old byte.
 */
export function padToPreviousSize(json: string, previousBytes: number) {
  const missing = previousBytes - utf8Length(json);
  return missing > 0 ? json + ' '.repeat(missing) : json;
}

export async function readFolder(io: FolderIO): Promise<Data | null> {
  if (!io.exists()) return null;
  const text = await io.readText();
  // A brand-new empty file is treated as "no data yet"
  return text.trim() === '' ? null : parse(text);
}

export function writeFolder(io: FolderIO, data: Data) {
  io.writeText(padToPreviousSize(serialize(data), io.exists() ? io.sizeBytes() : 0));
}

/** Same contract as the Google Sheet backend: apply our queued changes, then return everything. */
export async function syncWithFolder(io: FolderIO, ops: Op[]): Promise<SheetData> {
  const remote = await readFolder(io);
  const next = applyOps(remote ?? { txs: [], categories: [] }, ops);
  if (ops.length > 0 || !remote) writeFolder(io, next);
  return { transactions: next.txs, categories: next.categories, categoriesHaveBudget: true };
}
