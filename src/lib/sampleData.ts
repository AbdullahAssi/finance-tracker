import { addDays, shiftMonth, todayISO } from './format';
import type { Category, Recurring, Transaction } from './types';

/** Everything created here has this id prefix, so it can be removed without touching real entries. */
export const DEMO_PREFIX = 'demo-';
export const isDemoId = (id: string) => id.startsWith(DEMO_PREFIX);

/** Budgets applied to the matching categories while sample data is loaded. */
export const DEMO_BUDGETS: Record<string, number> = { Food: 600, Groceries: 1200, Bills: 300, Transport: 400, Shopping: 500 };

// Small deterministic generator: the same sample every time, no Math.random
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const EXPENSE_TEMPLATES: { category: string; notes: string[]; min: number; max: number; method: string; perMonth: number }[] = [
  { category: 'Food', notes: ['Lunch', 'Coffee', 'Dinner out', 'Shawarma', 'Breakfast'], min: 15, max: 110, method: 'Cash', perMonth: 9 },
  { category: 'Groceries', notes: ['Weekly shop', 'Supermarket', 'Fruit & veg', 'Bakery'], min: 90, max: 330, method: 'Debit Card', perMonth: 4 },
  { category: 'Transport', notes: ['Taxi', 'Fuel', 'Metro top-up', 'Parking'], min: 20, max: 190, method: 'Credit Card', perMonth: 5 },
  { category: 'Shopping', notes: ['Shoes', 'T-shirts', 'Phone case', 'Gift'], min: 60, max: 380, method: 'Credit Card', perMonth: 2 },
  { category: 'Medical', notes: ['Pharmacy', 'Clinic visit'], min: 40, max: 260, method: 'Debit Card', perMonth: 1 },
  { category: 'Education', notes: ['Online course', 'Books'], min: 80, max: 300, method: 'Bank', perMonth: 1 },
];

export function buildSampleData(today = todayISO()): { txs: Transaction[]; recurring: Recurring[] } {
  const txs: Transaction[] = [];
  const thisMonth = today.slice(0, 7);
  const rand = rng(20261);
  let n = 0;

  const add = (t: Omit<Transaction, 'id' | 'updatedAt'>) => {
    txs.push({ ...t, id: `${DEMO_PREFIX}${n++}`, updatedAt: Date.parse(`${t.date}T12:00:00`) || 0 });
  };

  for (let back = 5; back >= 0; back--) {
    const month = shiftMonth(thisMonth, -back);
    const lastDay = back === 0 ? Number(today.slice(8, 10)) : new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate();
    const day = (d: number) => `${month}-${String(Math.min(Math.max(d, 1), lastDay)).padStart(2, '0')}`;

    add({ type: 'income', amount: 13180, date: day(1), category: 'Salary', method: '', note: 'Monthly salary' });
    if (back % 2 === 1) add({ type: 'income', amount: 1500 + Math.round(rand() * 1500), date: day(14), category: 'Freelance', method: '', note: 'Side project' });
    if (back === 3) add({ type: 'income', amount: 2500, date: day(20), category: 'Bonus', method: '', note: 'Quarterly bonus' });

    add({ type: 'expense', amount: 2900, date: day(1), category: 'Rent', method: 'Bank', note: 'Monthly rent' });
    add({ type: 'expense', amount: 240 + Math.round(rand() * 90), date: day(5), category: 'Bills', method: 'Bank', note: 'Electricity & water' });
    add({ type: 'expense', amount: 1000, date: day(10), category: 'Debt / Installment', method: 'Bank', note: 'Car installment' });

    for (const tpl of EXPENSE_TEMPLATES) {
      // Fewer entries in the current, partly elapsed month
      const count = back === 0 ? Math.max(1, Math.round((tpl.perMonth * lastDay) / 30)) : tpl.perMonth;
      for (let i = 0; i < count; i++) {
        add({
          type: 'expense',
          amount: Math.round((tpl.min + rand() * (tpl.max - tpl.min)) * 2) / 2,
          date: day(1 + Math.floor(rand() * lastDay)),
          category: tpl.category,
          method: tpl.method,
          note: tpl.notes[Math.floor(rand() * tpl.notes.length)],
        });
      }
    }
  }

  // Never in the future, even if the maths above rounds up
  const safe = txs.filter((t) => t.date <= today);

  const recurring: Recurring[] = [
    {
      id: `${DEMO_PREFIX}rent`,
      type: 'expense',
      amount: 2900,
      category: 'Rent',
      method: 'Bank',
      note: 'Monthly rent',
      frequency: 'monthly',
      anchorDay: 1,
      nextDate: `${shiftMonth(thisMonth, 1)}-01`,
      active: true,
    },
    {
      id: `${DEMO_PREFIX}gym`,
      type: 'expense',
      amount: 150,
      category: 'Other',
      method: 'Credit Card',
      note: 'Gym membership',
      frequency: 'weekly',
      anchorDay: 1,
      nextDate: addDays(today, 3),
      active: true,
    },
  ];

  return { txs: safe, recurring };
}

/** Applies the demo budgets to categories that have none; returns the updated list. */
export function withDemoBudgets(categories: Category[]): Category[] {
  return categories.map((c) => (DEMO_BUDGETS[c.name] && !c.budget ? { ...c, budget: DEMO_BUDGETS[c.name] } : c));
}

/** Removes only the budgets that still hold their demo value, so budgets you set yourself survive. */
export function withoutDemoBudgets(categories: Category[]): Category[] {
  return categories.map((c) => {
    if (c.budget && DEMO_BUDGETS[c.name] === c.budget) {
      const { budget: _removed, ...rest } = c;
      return rest;
    }
    return c;
  });
}
