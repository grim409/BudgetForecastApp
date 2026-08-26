import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  differenceInCalendarYears,
  format,
  parseISO,
} from 'date-fns';

export type RecurrenceUnit = 'day' | 'week' | 'month' | 'year';

export interface RecurringItem {
  id: string;
  title: string;
  amount: number;
  type: 'credit' | 'debit';
  startDate: string;
  endDate?: string;
  interval: number;
  unit: RecurrenceUnit;
}

export interface OneOffPurchase {
  id: string;
  title: string;
  amount: number;
  plannedDate: string;
}

export interface BudgetState {
  startingBalance: number;
  recurringItems: RecurringItem[];
  purchases: OneOffPurchase[];
}

export interface ForecastPoint {
  date: string;
  balance: number;
}

const occurrencesPerMonth: Record<RecurrenceUnit, number> = {
  day: 365 / 12,
  week: 52 / 12,
  month: 1,
  year: 1 / 12,
};

// `new Date('2026-01-01')` is parsed as UTC midnight while every other date in
// the forecast is local, which shifts date-only values a day in UTC-negative
// zones. parseISO treats a date-only string as local midnight instead.
//
// parseISO THROWS on a non-string (it calls .split on its argument), and this
// engine is fed from editable local storage, so anything not a string is turned
// into an Invalid Date here rather than allowed to blow up a caller.
//
// Exported because it must be the ONLY date oracle in the app: `new Date(s)`
// rejects ISO forms parseISO accepts (e.g. "20260101", "2026-W01-1"), so a
// validator and a consumer using different parsers disagree, and a value that
// passes validation then throws at render.
export function parseDate(value: unknown): Date {
  if (typeof value !== 'string') return new Date(Number.NaN);
  try {
    return parseISO(value);
  } catch {
    return new Date(Number.NaN);
  }
}

export function isValidDateValue(value: unknown) {
  return !Number.isNaN(parseDate(value).getTime());
}

// Each occurrence is measured from the original start date rather than from the
// previous (possibly month-end clamped) occurrence, so a recurrence anchored on
// Jan 31 stays on the last day of each month instead of drifting to the 28th.
function occurrenceAt(anchor: Date, unit: RecurrenceUnit, interval: number, index: number) {
  const offset = interval * index;
  if (unit === 'day') return addDays(anchor, offset);
  if (unit === 'week') return addWeeks(anchor, offset);
  if (unit === 'month') return addMonths(anchor, offset);
  return addYears(anchor, offset);
}

// A recurrence must never be enumerated one occurrence at a time: a start date
// far in the past would cost O(horizon - startDate) iterations, and date-fns
// returns an Invalid Date once an offset overflows the ±8.64e15 ms Date range,
// which compares false against everything. Counts are derived arithmetically
// instead, and the interval is bounded so the offsets stay representable.
export const MAX_RECURRENCE_INTERVAL = 1000;

const RECURRENCE_UNITS: readonly RecurrenceUnit[] = ['day', 'week', 'month', 'year'];

export function isValidRecurrence(item: RecurringItem | null | undefined): item is RecurringItem {
  if (!item || typeof item !== 'object') return false;
  if (!RECURRENCE_UNITS.includes(item.unit)) return false;
  if (item.type !== 'credit' && item.type !== 'debit') return false;
  if (!Number.isInteger(item.interval)) return false;
  if (item.interval < 1 || item.interval > MAX_RECURRENCE_INTERVAL) return false;
  if (!Number.isFinite(item.amount)) return false;
  // An unparseable endDate would otherwise be persisted as a `string` that is
  // not one, and throw at render time.
  if (item.endDate !== undefined && Number.isNaN(parseDate(item.endDate).getTime())) return false;
  return !Number.isNaN(parseDate(item.startDate).getTime());
}

// Whole calendar steps of `unit` between two dates — the basis for an O(1)
// estimate of how many occurrences fit before `target`.
function calendarStepsBetween(anchor: Date, target: Date, unit: RecurrenceUnit) {
  if (unit === 'day') return differenceInCalendarDays(target, anchor);
  if (unit === 'week') return Math.trunc(differenceInCalendarDays(target, anchor) / 7);
  if (unit === 'month') return differenceInCalendarMonths(target, anchor);
  return differenceInCalendarYears(target, anchor);
}

// Number of occurrences at or before `target`, counted arithmetically. The
// estimate can be off by one because month/year steps clamp to shorter months
// and because time-of-day is ignored by calendar differences, so it is nudged
// into place by a strictly bounded correction rather than a walk.
const MAX_CORRECTION_STEPS = 4;

function countUpTo(anchor: Date, unit: RecurrenceUnit, interval: number, target: Date) {
  if (target < anchor) return 0;

  const steps = calendarStepsBetween(anchor, target, unit);
  if (!Number.isFinite(steps)) return 0;

  let index = Math.max(0, Math.trunc(steps / interval));

  for (let step = 0; step < MAX_CORRECTION_STEPS; step += 1) {
    const next = occurrenceAt(anchor, unit, interval, index + 1);
    if (Number.isNaN(next.getTime()) || next > target) break;
    index += 1;
  }

  for (let step = 0; step < MAX_CORRECTION_STEPS && index >= 0; step += 1) {
    const current = occurrenceAt(anchor, unit, interval, index);
    if (!Number.isNaN(current.getTime()) && current <= target) break;
    index -= 1;
  }

  return index + 1;
}

function occurrencesBetween(item: RecurringItem, fromExclusive: Date, toInclusive: Date) {
  if (!isValidRecurrence(item)) return 0;

  const anchor = parseDate(item.startDate);
  const endDate = item.endDate ? parseDate(item.endDate) : null;
  if (endDate && Number.isNaN(endDate.getTime())) return 0;
  const limit = endDate && endDate < toInclusive ? endDate : toInclusive;
  if (Number.isNaN(limit.getTime())) return 0;
  if (limit < anchor) return 0;

  // Occurrences in (fromExclusive, limit] = those up to limit minus those
  // already counted at or before fromExclusive.
  const upToLimit = countUpTo(anchor, item.unit, item.interval, limit);
  const upToFrom = countUpTo(anchor, item.unit, item.interval, fromExclusive);

  return Math.max(0, upToLimit - upToFrom);
}

export function isValidPurchase(purchase: OneOffPurchase | null | undefined): purchase is OneOffPurchase {
  if (!purchase || typeof purchase !== 'object') return false;
  if (!Number.isFinite(purchase.amount)) return false;
  return !Number.isNaN(parseDate(purchase.plannedDate).getTime());
}

// A row without a usable id cannot be edited or deleted unambiguously — two of
// them would collide and mutate together — so identity is required too.
export function hasUsableId(entry: { id?: unknown }) {
  return typeof entry.id === 'string' && entry.id.length > 0;
}

// Normalized "per month" rate for the window that starts at asOf: items that
// have not started yet, or whose fixed term already ended, contribute nothing.
export function getMonthlyNet(state: BudgetState, asOf: Date = new Date()) {
  const windowEnd = addMonths(asOf, 1);

  return state.recurringItems.reduce((total, item) => {
    if (!isValidRecurrence(item)) return total;

    const startDate = parseDate(item.startDate);
    if (startDate > windowEnd) return total;

    if (item.endDate) {
      const endDate = parseDate(item.endDate);
      if (Number.isNaN(endDate.getTime()) || endDate < asOf) return total;
    }

    const monthlyAmount = item.amount * occurrencesPerMonth[item.unit] / item.interval;
    return total + (item.type === 'credit' ? monthlyAmount : -monthlyAmount);
  }, 0);
}

export function buildForecast(
  state: BudgetState,
  asOf: Date,
  unit: 'day' | 'month',
  steps: number,
): ForecastPoint[] {
  // A corrupt persisted balance must not turn every point into NaN.
  const startingBalance = Number.isFinite(state.startingBalance) ? state.startingBalance : 0;
  const points: ForecastPoint[] = [{
    date: format(asOf, 'yyyy-MM-dd'),
    balance: startingBalance,
  }];

  for (let index = 1; index <= steps; index += 1) {
    const date = unit === 'day' ? addDays(asOf, index) : addMonths(asOf, index);
    const recurringTotal = state.recurringItems.reduce((total, item) => {
      const occurrences = occurrencesBetween(item, asOf, date);
      if (occurrences === 0) return total;
      const amount = occurrences * item.amount;
      return total + (item.type === 'credit' ? amount : -amount);
    }, 0);
    const purchasesTotal = state.purchases.reduce((total, purchase) => {
      if (!isValidPurchase(purchase)) return total;
      const plannedDate = parseDate(purchase.plannedDate);
      return plannedDate > asOf && plannedDate <= date ? total + purchase.amount : total;
    }, 0);

    points.push({
      date: format(date, 'yyyy-MM-dd'),
      balance: startingBalance + recurringTotal - purchasesTotal,
    });
  }

  return points;
}
