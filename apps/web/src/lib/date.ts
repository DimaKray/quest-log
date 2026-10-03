/** Локальна дата 'YYYY-MM-DD'. Не toISOString(): він дає UTC і біля півночі збивається на день. */
export function todayLocal(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** 'YYYY-MM-DD' -> 'ДД.ММ.РРРР' */
export function formatDay(day: string): string {
  return day.split("-").reverse().join(".");
}

/** ISO-час (з Date.toISOString) -> 'ДД.ММ.РРРР' за локальним часом користувача. */
export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}`;
}