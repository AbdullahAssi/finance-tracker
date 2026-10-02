const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));

const pad = (n: number) => String(n).padStart(2, '0');

export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayISO = () => toISO(new Date());
export const fromISO = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

/** "2026-10" */
export const monthKey = (s: string) => s.slice(0, 7);
export const currentMonthKey = () => monthKey(todayISO());
export const shiftMonth = (key: string, delta: number) => {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};
export const monthLabel = (key: string) => {
  const [y, m] = key.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
};
export const monthRange = (key: string): [string, string] => {
  const [y, m] = key.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  return [`${key}-01`, `${key}-${pad(last)}`];
};

/** "01 Oct 2026" */
export const fmtDate = (s: string) => {
  const d = fromISO(s);
  return `${pad(d.getDate())} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
};
/** "30 September 2026" */
export const fmtLongDate = (s: string) => {
  const d = fromISO(s);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export const addDays = (s: string, days: number) => {
  const d = fromISO(s);
  d.setDate(d.getDate() + days);
  return toISO(d);
};

/** Monday of the week containing the date. */
export const startOfWeek = (s: string) => {
  const d = fromISO(s);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return toISO(d);
};

export const number = (n: number, decimals = 2) => {
  const [int, frac] = Math.abs(n).toFixed(decimals).split('.');
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (n < 0 ? '-' : '') + (frac ? `${withCommas}.${frac}` : withCommas);
};

export const money = (n: number, currency: string) => `${currency} ${number(n)}`;

/** Parses user-typed amounts; returns NaN when invalid. */
export const parseAmount = (s: string) => {
  const cleaned = s.replace(/,/g, '').trim();
  if (!/^(\d+\.?\d*|\.\d+)$/.test(cleaned)) return NaN;
  return Number(cleaned);
};

export const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
