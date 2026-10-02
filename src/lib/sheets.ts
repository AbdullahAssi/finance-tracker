import type { Category, Op, Transaction } from './types';
import { DEFAULT_ICON } from './constants';

export interface SheetData {
  transactions: Transaction[];
  categories: Category[];
}

const normalizeTx = (r: any): Transaction => ({
  id: String(r.id),
  type: r.type === 'income' ? 'income' : 'expense',
  amount: Number(r.amount) || 0,
  date: String(r.date).slice(0, 10),
  category: String(r.category ?? ''),
  method: String(r.method ?? ''),
  note: String(r.note ?? ''),
  updatedAt: Number(r.updatedAt) || 0,
});

/**
 * Sends queued changes to the Apps Script web app and returns the full sheet contents.
 * An empty `ops` list is a plain pull.
 */
export async function callSheet(url: string, token: string, ops: Op[]): Promise<SheetData> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      // text/plain avoids a CORS preflight, which Apps Script cannot answer
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ token, ops }),
      signal: controller.signal,
    });
    const text = await res.text();
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error('Unexpected reply from the sheet. Re-deploy the script with access set to "Anyone".');
    }
    if (!json.ok) throw new Error(json.error || 'The sheet reported an error.');
    return {
      transactions: (json.transactions as any[]).map(normalizeTx),
      categories: (json.categories as any[]).map((c) => ({
        id: String(c.id),
        name: String(c.name),
        icon: String(c.icon || DEFAULT_ICON),
      })),
    };
  } catch (e: any) {
    if (e?.name === 'AbortError') throw new Error('The sheet took too long to respond.');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
