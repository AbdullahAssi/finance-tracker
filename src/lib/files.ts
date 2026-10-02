import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { fmtDate } from './format';
import type { Transaction } from './types';

/** Writes text into the cache folder and opens the Android share sheet for it. */
export async function shareTextFile(name: string, content: string, mimeType: string) {
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  file.write(content);
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device.');
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: name });
}

const csvCell = (v: string | number) => {
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(txs: Transaction[], currency: string) {
  const header = ['Date', 'Type', 'Category / Source', 'Payment Method', 'Note', `Amount (${currency})`];
  const rows = txs.map((t) => [
    fmtDate(t.date),
    t.type === 'income' ? 'Income' : 'Expense',
    t.category,
    t.method,
    t.note,
    (t.type === 'income' ? t.amount : -t.amount).toFixed(2),
  ]);
  // BOM so Excel reads UTF-8 correctly
  return '﻿' + [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
}
