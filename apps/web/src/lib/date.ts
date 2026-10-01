/** Локальна дата 'YYYY-MM-DD'. Не toISOString(): він дає UTC і біля півночі збивається на день. */
export function todayLocal(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}