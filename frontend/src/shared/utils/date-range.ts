/** YYYY-MM-DD in local calendar (avoids UTC shift from toISOString). */
export function toLocalDateValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseLocalDateValue(value: string): {
  year: number;
  month: number;
  day: number;
} {
  const [year, month, day] = value.split('-').map(Number);
  return { year, month, day };
}

export function buildLocalDateValue(
  year: number,
  month: number,
  day: number,
): string {
  const maxDay = daysInMonth(year, month);
  const clampedDay = Math.min(Math.max(1, day), maxDay);
  return `${year}-${String(month).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function localDayStartIso(dateValue: string): string {
  const { year, month, day } = parseLocalDateValue(dateValue);
  return new Date(year, month - 1, day, 0, 0, 0, 0).toISOString();
}

export function localDayEndIso(dateValue: string): string {
  const { year, month, day } = parseLocalDateValue(dateValue);
  return new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
}

export function formatDateRangeLabel(start: string, end: string): string {
  const startDate = parseLocalDateValue(start);
  const endDate = parseLocalDateValue(end);
  const formatter = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const from = formatter.format(
    new Date(startDate.year, startDate.month - 1, startDate.day),
  );
  const to = formatter.format(
    new Date(endDate.year, endDate.month - 1, endDate.day),
  );
  return `${from} – ${to}`;
}

export interface DateRangePreset {
  id: string;
  label: string;
  resolve: () => { start: string; end: string };
}

export const METRICS_DATE_PRESETS: DateRangePreset[] = [
  {
    id: '7d',
    label: 'Last 7 days',
    resolve: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 6);
      return { start: toLocalDateValue(start), end: toLocalDateValue(end) };
    },
  },
  {
    id: '30d',
    label: 'Last 30 days',
    resolve: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 29);
      return { start: toLocalDateValue(start), end: toLocalDateValue(end) };
    },
  },
  {
    id: '90d',
    label: 'Last 90 days',
    resolve: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 89);
      return { start: toLocalDateValue(start), end: toLocalDateValue(end) };
    },
  },
  {
    id: 'month',
    label: 'This month',
    resolve: () => {
      const end = new Date();
      const start = new Date(end.getFullYear(), end.getMonth(), 1);
      return { start: toLocalDateValue(start), end: toLocalDateValue(end) };
    },
  },
  {
    id: 'all',
    label: 'All time',
    resolve: () => ({
      start: '2026-01-01',
      end: toLocalDateValue(new Date()),
    }),
  },
];
