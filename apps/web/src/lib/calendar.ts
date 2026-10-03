/** Допоміжні функції календаря. Усі дати це рядки 'YYYY-MM-DD'; обчислення в UTC, без помилок літнього часу. */

export const MONTHS = [
  "Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень",
  "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень",
];

/** Для підписів дати: «3 жовтня 2026». */
export const MONTHS_GENITIVE = [
  "січня", "лютого", "березня", "квітня", "травня", "червня",
  "липня", "серпня", "вересня", "жовтня", "листопада", "грудня",
];

/** Тиждень починається з понеділка. */
export const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

export interface Ymd {
  y: number;
  /** місяць 0-11 */
  m0: number;
  d: number;
}

export interface MonthView {
  year: number;
  month0: number;
}

export interface Cell {
  iso: string;
  inMonth: boolean;
}

const pad = (n: number, width = 2) => String(n).padStart(width, "0");

export const toIso = ({ y, m0, d }: Ymd): string =>
  `${pad(y, 4)}-${pad(m0 + 1)}-${pad(d)}`;

/** Розбирає 'YYYY-MM-DD'. Повертає null для сміття й неіснуючих дат (2026-02-30). */
export function parseIso(iso: string): Ymd | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const y = Number(m[1]);
  const m0 = Number(m[2]) - 1;
  const d = Number(m[3]);
  const t = new Date(Date.UTC(y, m0, d));
  const same =
    t.getUTCFullYear() === y && t.getUTCMonth() === m0 && t.getUTCDate() === d;
  return same ? { y, m0, d } : null;
}

function fromUtc(ms: number): Ymd {
  const t = new Date(ms);
  return { y: t.getUTCFullYear(), m0: t.getUTCMonth(), d: t.getUTCDate() };
}

export function addDays(iso: string, delta: number): string {
  const p = parseIso(iso);
  if (!p) throw new Error(`Bad date: ${iso}`);
  return toIso(fromUtc(Date.UTC(p.y, p.m0, p.d + delta)));
}

export function addMonths(view: MonthView, delta: number): MonthView {
  const index = view.year * 12 + view.month0 + delta;
  return { year: Math.floor(index / 12), month0: ((index % 12) + 12) % 12 };
}

/** Той самий день в іншому місяці; якщо такого дня немає (31 -> лютий), останній день місяця. */
export function shiftMonth(iso: string, delta: number): string {
  const p = parseIso(iso);
  if (!p) throw new Error(`Bad date: ${iso}`);
  const { year, month0 } = addMonths({ year: p.y, month0: p.m0 }, delta);
  const lastDay = new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
  return toIso({ y: year, m0: month0, d: Math.min(p.d, lastDay) });
}

/** 6 тижнів по 7 днів (завжди 42 клітинки, щоб висота календаря не стрибала). */
export function monthGrid(year: number, month0: number): Cell[] {
  const offset = (new Date(Date.UTC(year, month0, 1)).getUTCDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, i) => {
    const ymd = fromUtc(Date.UTC(year, month0, 1 - offset + i));
    return { iso: toIso(ymd), inMonth: ymd.m0 === month0 };
  });
}