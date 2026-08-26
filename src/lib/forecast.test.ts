import { describe, expect, it } from 'vitest';

import {
  buildForecast,
  getMonthlyNet,
  type BudgetState,
} from './forecast';

const emptyBudget: BudgetState = {
  startingBalance: 1000,
  recurringItems: [],
  purchases: [],
};

describe('getMonthlyNet', () => {
  it('normalizes recurring items by how often they occur', () => {
    const state: BudgetState = {
      ...emptyBudget,
      recurringItems: [
        { id: 'salary', title: 'Salary', amount: 2400, type: 'credit', startDate: '2026-01-01', interval: 1, unit: 'month' },
        { id: 'rent', title: 'Rent', amount: 1200, type: 'debit', startDate: '2026-01-01', interval: 1, unit: 'month' },
        { id: 'insurance', title: 'Insurance', amount: 600, type: 'debit', startDate: '2026-01-01', interval: 6, unit: 'month' },
        { id: 'side-work', title: 'Side work', amount: 100, type: 'credit', startDate: '2026-01-01', interval: 2, unit: 'week' },
      ],
    };

    expect(getMonthlyNet(state, new Date('2026-01-01T12:00:00'))).toBeCloseTo(1316.67, 2);
  });

  it('ignores items that have not started yet or whose term already ended', () => {
    const state: BudgetState = {
      ...emptyBudget,
      recurringItems: [
        { id: 'active', title: 'Salary', amount: 2400, type: 'credit', startDate: '2026-01-01', interval: 1, unit: 'month' },
        { id: 'future', title: 'New lease', amount: 900, type: 'debit', startDate: '2027-01-01', interval: 1, unit: 'month' },
        { id: 'expired', title: 'Old loan', amount: 300, type: 'debit', startDate: '2024-01-01', endDate: '2025-06-01', interval: 1, unit: 'month' },
      ],
    };

    expect(getMonthlyNet(state, new Date('2026-01-01T12:00:00'))).toBeCloseTo(2400, 2);
  });
});

describe('buildForecast', () => {
  it('applies recurring items and planned purchases on the correct dates', () => {
    const state: BudgetState = {
      ...emptyBudget,
      recurringItems: [
        { id: 'income', title: 'Income', amount: 100, type: 'credit', startDate: '2026-01-02', interval: 1, unit: 'day' },
      ],
      purchases: [
        { id: 'purchase', title: 'Purchase', amount: 75, plannedDate: '2026-01-03' },
      ],
    };

    expect(buildForecast(state, new Date('2026-01-01T12:00:00'), 'day', 3)).toEqual([
      { date: '2026-01-01', balance: 1000 },
      { date: '2026-01-02', balance: 1100 },
      { date: '2026-01-03', balance: 1125 },
      { date: '2026-01-04', balance: 1225 },
    ]);
  });

  it('stops recurring items after their end date', () => {
    const state: BudgetState = {
      ...emptyBudget,
      recurringItems: [
        { id: 'contract', title: 'Contract', amount: 50, type: 'credit', startDate: '2026-01-01', endDate: '2026-01-02', interval: 1, unit: 'day' },
      ],
    };

    const forecast = buildForecast(state, new Date('2026-01-01T12:00:00'), 'day', 3);

    expect(forecast.map((point) => point.balance)).toEqual([1000, 1050, 1050, 1050]);
  });

  it('anchors month-end recurrences to the start date instead of drifting', () => {
    const state: BudgetState = {
      ...emptyBudget,
      recurringItems: [
        { id: 'rent', title: 'Rent', amount: 100, type: 'debit', startDate: '2026-01-31', interval: 1, unit: 'month' },
      ],
    };

    // Occurrences: Jan 31, Feb 28 (clamped), Mar 31 — not Mar 28.
    const forecast = buildForecast(state, new Date('2026-01-30T12:00:00'), 'day', 61);
    const byDate = new Map(forecast.map((point) => [point.date, point.balance]));

    expect(byDate.get('2026-01-31')).toBe(900);
    expect(byDate.get('2026-02-28')).toBe(800);
    expect(byDate.get('2026-03-30')).toBe(800);
    expect(byDate.get('2026-03-31')).toBe(700);
  });

  it('keeps a leap-day yearly recurrence anchored to February 29', () => {
    const state: BudgetState = {
      ...emptyBudget,
      recurringItems: [
        { id: 'annual', title: 'Annual fee', amount: 100, type: 'debit', startDate: '2024-02-29', interval: 1, unit: 'year' },
      ],
    };

    // 2028 is a leap year, so the occurrence returns to Feb 29 rather than staying on Feb 28.
    const forecast = buildForecast(state, new Date('2028-02-27T12:00:00'), 'day', 3);
    const byDate = new Map(forecast.map((point) => [point.date, point.balance]));

    expect(byDate.get('2028-02-28')).toBe(1000);
    expect(byDate.get('2028-02-29')).toBe(900);
  });

  it('terminates on an absurd recurrence interval instead of looping forever', () => {
    const state: BudgetState = {
      ...emptyBudget,
      recurringItems: [
        { id: 'overflow', title: 'Overflow', amount: 100, type: 'debit', startDate: '2026-01-01', interval: 200000000, unit: 'day' },
        { id: 'huge', title: 'Huge', amount: 100, type: 'debit', startDate: '2026-01-01', interval: 1e21, unit: 'year' },
      ],
    };

    // An out-of-range interval contributes nothing rather than hanging the app.
    const forecast = buildForecast(state, new Date('2026-01-01T12:00:00'), 'month', 12);

    expect(forecast).toHaveLength(13);
    expect(forecast.every((point) => point.balance === 1000)).toBe(true);
    expect(getMonthlyNet(state, new Date('2026-01-01T12:00:00'))).toBe(0);
  }, 5000);

  it('ignores an unparseable end date instead of counting occurrences forever', () => {
    const state: BudgetState = {
      ...emptyBudget,
      recurringItems: [
        { id: 'bad-end', title: 'Bad end', amount: 50, type: 'debit', startDate: '2026-01-01', endDate: 'not-a-date', interval: 1, unit: 'day' },
      ],
    };

    const forecast = buildForecast(state, new Date('2026-01-01T12:00:00'), 'day', 3);

    expect(forecast.every((point) => point.balance === 1000)).toBe(true);
  }, 5000);

  it('skips corrupt items instead of propagating NaN through the chart', () => {
    const state: BudgetState = {
      ...emptyBudget,
      recurringItems: [
        { id: 'good', title: 'Salary', amount: 100, type: 'credit', startDate: '2026-01-02', interval: 1, unit: 'day' },
        { id: 'nan', title: 'Corrupt', amount: Number.NaN, type: 'debit', startDate: '2026-01-02', interval: 1, unit: 'day' },
        { id: 'bad-start', title: 'Bad start', amount: 25, type: 'debit', startDate: 'garbage', interval: 1, unit: 'day' },
      ],
      purchases: [
        { id: 'nan-purchase', title: 'Corrupt purchase', amount: Number.NaN, plannedDate: '2026-01-02' },
      ],
    };

    const forecast = buildForecast(state, new Date('2026-01-01T12:00:00'), 'day', 2);

    expect(forecast.every((point) => Number.isFinite(point.balance))).toBe(true);
    expect(forecast.map((point) => point.balance)).toEqual([1000, 1100, 1200]);
  });

  it('rejects an unknown recurrence unit instead of producing NaN', () => {
    const state: BudgetState = {
      ...emptyBudget,
      recurringItems: [
        { id: 'bad-unit', title: 'Fortnightly', amount: 100, type: 'debit', startDate: '2026-01-01', interval: 1, unit: 'fortnight' as unknown as BudgetState['recurringItems'][number]['unit'] },
      ],
    };

    const asOf = new Date('2026-01-01T12:00:00');

    expect(getMonthlyNet(state, asOf)).toBe(0);
    expect(buildForecast(state, asOf, 'month', 3).every((point) => point.balance === 1000)).toBe(true);
  });

  it('survives null entries in persisted arrays', () => {
    const state = {
      startingBalance: 1000,
      recurringItems: [null],
      purchases: [null],
    } as unknown as BudgetState;

    const asOf = new Date('2026-01-01T12:00:00');

    expect(() => getMonthlyNet(state, asOf)).not.toThrow();
    expect(() => buildForecast(state, asOf, 'day', 3)).not.toThrow();
    expect(buildForecast(state, asOf, 'day', 3).every((point) => point.balance === 1000)).toBe(true);
  });

  it('falls back to zero when the persisted starting balance is corrupt', () => {
    const state = { ...emptyBudget, startingBalance: Number.NaN } as BudgetState;

    const forecast = buildForecast(state, new Date('2026-01-01T12:00:00'), 'day', 2);

    expect(forecast.every((point) => point.balance === 0)).toBe(true);
  });

  it('counts occurrences in constant time for a very old start date', () => {
    const state: BudgetState = {
      ...emptyBudget,
      recurringItems: [
        { id: 'ancient', title: 'Ancient', amount: 1, type: 'debit', startDate: '1900-01-01', interval: 1, unit: 'day' },
      ],
    };

    const started = Date.now();
    const forecast = buildForecast(state, new Date('2026-01-01T12:00:00'), 'day', 30);
    const elapsed = Date.now() - started;

    // Each step adds exactly one daily occurrence regardless of how far back the
    // anchor sits; an enumerating implementation took seconds here.
    expect(forecast[1].balance).toBe(999);
    expect(forecast[30].balance).toBe(970);
    expect(elapsed).toBeLessThan(250);
  });
});