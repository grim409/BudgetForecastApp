import { describe, expect, it } from 'vitest';
import { format } from 'date-fns';

import type { BudgetState } from './forecast';
import { buildForecast, getMonthlyNet, isValidDateValue, parseDate } from './forecast';
import {
  LEGACY_GROUP_ID_KEY,
  STORAGE_KEY,
  legacyStateKey,
  loadPersistedState,
  normalizeBudgetState,
  type KeyValueStore,
} from './persistence';

const savedState: BudgetState = {
  startingBalance: 1234,
  recurringItems: [
    { id: 'rent', title: 'Rent', amount: 900, type: 'debit', startDate: '2026-01-01', interval: 1, unit: 'month' },
  ],
  purchases: [],
};

function createStore(seed: Record<string, string> = {}) {
  const data = new Map(Object.entries(seed));
  const removed: string[] = [];

  const store: KeyValueStore & { data: Map<string, string>; removed: string[] } = {
    data,
    removed,
    getItem: async (key) => data.get(key) ?? null,
    setItem: async (key, value) => {
      data.set(key, value);
    },
    multiRemove: async (keys) => {
      keys.forEach((key) => {
        removed.push(key);
        data.delete(key);
      });
    },
  };

  return store;
}

describe('loadPersistedState', () => {
  it('returns null on a fresh install so the demo budget is shown', async () => {
    await expect(loadPersistedState(createStore())).resolves.toBeNull();
  });

  it('reads the current key when present', async () => {
    const store = createStore({ [STORAGE_KEY]: JSON.stringify(savedState) });

    await expect(loadPersistedState(store)).resolves.toEqual(savedState);
    expect(store.removed).toEqual([]);
  });

  it('migrates a legacy group-scoped budget and clears the old keys', async () => {
    const store = createStore({
      [LEGACY_GROUP_ID_KEY]: 'group-7',
      [legacyStateKey('group-7')]: JSON.stringify(savedState),
    });

    await expect(loadPersistedState(store)).resolves.toEqual(savedState);
    expect(JSON.parse(store.data.get(STORAGE_KEY)!)).toEqual(savedState);
    expect(store.removed).toEqual([LEGACY_GROUP_ID_KEY, legacyStateKey('group-7')]);
    expect(store.data.has(LEGACY_GROUP_ID_KEY)).toBe(false);
  });

  it('prefers the current key over a stale legacy budget', async () => {
    const current: BudgetState = { ...savedState, startingBalance: 42 };
    const store = createStore({
      [STORAGE_KEY]: JSON.stringify(current),
      [LEGACY_GROUP_ID_KEY]: 'group-7',
      [legacyStateKey('group-7')]: JSON.stringify(savedState),
    });

    await expect(loadPersistedState(store)).resolves.toEqual(current);
    expect(store.removed).toEqual([]);
  });

  it('falls back to null on malformed JSON rather than throwing', async () => {
    const store = createStore({ [STORAGE_KEY]: '{not json' });

    await expect(loadPersistedState(store)).resolves.toBeNull();
  });

  it('ignores a legacy entry that is not a budget state', async () => {
    const store = createStore({
      [LEGACY_GROUP_ID_KEY]: 'group-7',
      [legacyStateKey('group-7')]: JSON.stringify({ nope: true }),
    });

    await expect(loadPersistedState(store)).resolves.toBeNull();
    expect(store.data.has(STORAGE_KEY)).toBe(false);
  });

  it('keeps the legacy keys when the migration write fails', async () => {
    const store = createStore({
      [LEGACY_GROUP_ID_KEY]: 'group-7',
      [legacyStateKey('group-7')]: JSON.stringify(savedState),
    });
    store.setItem = async () => {
      throw new Error('quota exceeded');
    };

    // The budget is still returned, and the legacy data survives for a retry.
    await expect(loadPersistedState(store)).resolves.toEqual(savedState);
    expect(store.removed).toEqual([]);
    expect(store.data.get(LEGACY_GROUP_ID_KEY)).toBe('group-7');
  });
});

describe('normalizeBudgetState', () => {
  it('drops invalid recurring items and purchases instead of the whole budget', () => {
    const normalized = normalizeBudgetState({
      startingBalance: 500,
      recurringItems: [
        null,
        { id: 'ok', title: 'Rent', amount: 900, type: 'debit', startDate: '2026-01-01', interval: 1, unit: 'month' },
        { id: 'bad-unit', title: 'Nope', amount: 10, type: 'debit', startDate: '2026-01-01', interval: 1, unit: 'fortnight' },
        { id: 'bad-amount', title: 'Nope', amount: Number.NaN, type: 'debit', startDate: '2026-01-01', interval: 1, unit: 'month' },
        { id: 'huge', title: 'Nope', amount: 10, type: 'debit', startDate: '2026-01-01', interval: 1e9, unit: 'day' },
      ],
      purchases: [
        null,
        { id: 'p-ok', title: 'TV', amount: 400, plannedDate: '2026-02-01' },
        { id: 'p-bad', title: 'Bad', amount: Number.NaN, plannedDate: '2026-02-01' },
      ],
    });

    expect(normalized).not.toBeNull();
    expect(normalized!.recurringItems.map((item) => item.id)).toEqual(['ok']);
    expect(normalized!.purchases.map((purchase) => purchase.id)).toEqual(['p-ok']);
  });

  it('strips unknown legacy keys such as lastRolloverDate', () => {
    const normalized = normalizeBudgetState({
      startingBalance: 100,
      lastRolloverDate: '2025-01-01',
      recurringItems: [],
      purchases: [],
    });

    expect(normalized).toEqual({ startingBalance: 100, recurringItems: [], purchases: [] });
    expect('lastRolloverDate' in normalized!).toBe(false);
  });

  it('rejects a non-object or structurally wrong value', () => {
    expect(normalizeBudgetState(null)).toBeNull();
    expect(normalizeBudgetState({ startingBalance: 1, recurringItems: {}, purchases: [] })).toBeNull();
  });

  it('recovers a corrupt starting balance to zero instead of discarding the budget', () => {
    const normalized = normalizeBudgetState({
      startingBalance: 'x',
      recurringItems: [
        { id: 'ok', title: 'Rent', amount: 900, type: 'debit', startDate: '2026-01-01', interval: 1, unit: 'month' },
      ],
      purchases: [],
    });

    expect(normalized).not.toBeNull();
    expect(normalized!.startingBalance).toBe(0);
    expect(normalized!.recurringItems).toHaveLength(1);
  });

  it('does not throw on non-string date fields, and keeps the other rows', () => {
    const good = { id: 'ok', title: 'Rent', amount: 900, type: 'debit', startDate: '2026-01-01', interval: 1, unit: 'month' };

    const run = () => normalizeBudgetState({
      startingBalance: 500,
      recurringItems: [
        good,
        { ...good, id: 'num-start', startDate: 12345 },
        { ...good, id: 'obj-start', startDate: {} },
        { ...good, id: 'null-start', startDate: null },
        { ...good, id: 'num-end', endDate: 999 },
      ],
      purchases: [
        { id: 'p-ok', title: 'TV', amount: 400, plannedDate: '2026-02-01' },
        { id: 'p-bad', title: 'Bad', amount: 400, plannedDate: 12345 },
      ],
    });

    expect(run).not.toThrow();
    const normalized = run()!;
    expect(normalized.recurringItems.map((item) => item.id)).toEqual(['ok']);
    expect(normalized.purchases.map((purchase) => purchase.id)).toEqual(['p-ok']);
  });

  it('drops rows that have no usable id or an invalid type', () => {
    const normalized = normalizeBudgetState({
      startingBalance: 10,
      recurringItems: [
        { title: 'No id', amount: 5, type: 'debit', startDate: '2026-01-01', interval: 1, unit: 'month' },
        { id: '', title: 'Empty id', amount: 5, type: 'debit', startDate: '2026-01-01', interval: 1, unit: 'month' },
        { id: 'bad-type', title: 'Bad type', amount: 5, type: 'transfer', startDate: '2026-01-01', interval: 1, unit: 'month' },
      ],
      purchases: [{ title: 'No id', amount: 5, plannedDate: '2026-02-01' }],
    });

    expect(normalized).toEqual({ startingBalance: 10, recurringItems: [], purchases: [] });
  });

  it('drops duplicate ids so edit and delete cannot mutate two rows at once', () => {
    const row = { title: 'Rent', amount: 900, type: 'debit', startDate: '2026-01-01', interval: 1, unit: 'month' };
    const normalized = normalizeBudgetState({
      startingBalance: 10,
      recurringItems: [{ ...row, id: 'dup' }, { ...row, id: 'dup', amount: 111 }],
      purchases: [
        { id: 'p', title: 'A', amount: 5, plannedDate: '2026-02-01' },
        { id: 'p', title: 'B', amount: 6, plannedDate: '2026-02-01' },
      ],
    });

    expect(normalized!.recurringItems).toHaveLength(1);
    expect(normalized!.recurringItems[0].amount).toBe(900);
    expect(normalized!.purchases).toHaveLength(1);
    expect(normalized!.purchases[0].title).toBe('A');
  });

  it('survives a malformed row arriving through storage without losing the budget', async () => {
    const store = createStore({
      [STORAGE_KEY]: JSON.stringify({
        startingBalance: 750,
        recurringItems: [
          { id: 'keep', title: 'Rent', amount: 900, type: 'debit', startDate: '2026-01-01', interval: 1, unit: 'month' },
          { id: 'drop', title: 'Broken', amount: 10, type: 'debit', startDate: 12345, interval: 1, unit: 'month' },
        ],
        purchases: [],
      }),
    });

    const loaded = await loadPersistedState(store);

    expect(loaded).not.toBeNull();
    expect(loaded!.startingBalance).toBe(750);
    expect(loaded!.recurringItems.map((item) => item.id)).toEqual(['keep']);
  });
});

describe('forecast engine against malformed persisted rows', () => {
  it('never throws for non-string date fields', () => {
    const state = {
      startingBalance: 1000,
      recurringItems: [
        { id: 'a', title: 'a', amount: 10, type: 'debit', startDate: 12345, interval: 1, unit: 'month' },
        { id: 'b', title: 'b', amount: 10, type: 'debit', startDate: '2026-01-01', endDate: 999, interval: 1, unit: 'month' },
      ],
      purchases: [{ id: 'p', title: 'p', amount: 10, plannedDate: {} }],
    } as unknown as BudgetState;

    const asOf = new Date('2026-01-01T12:00:00');

    expect(() => getMonthlyNet(state, asOf)).not.toThrow();
    expect(() => buildForecast(state, asOf, 'month', 3)).not.toThrow();
    expect(buildForecast(state, asOf, 'month', 3).every((point) => point.balance === 1000)).toBe(true);
  });

  // Regression: the validator and the screens must share ONE date oracle.
  // `parseISO` accepts ISO forms `new Date` rejects, so a value that passed
  // validation used to render an Invalid Date and throw RangeError on format().
  it('any date the validator accepts is safely formattable by the UI', () => {
    const candidates = [
      '20260101',
      '2026-W01-1',
      '2026-01-01T10',
      '2026-W05',
      '2026-01-01',
      '2026-01-01T10:00:00.000Z',
      '2026-02-29',
      'garbage',
      '2026-13-45',
    ];

    let checked = 0;
    for (const candidate of candidates) {
      if (!isValidDateValue(candidate)) continue;
      checked += 1;
      const parsed = parseDate(candidate);
      expect(Number.isNaN(parsed.getTime())).toBe(false);
      // Both the web render path and the save path must be safe.
      expect(() => format(parsed, 'yyyy-MM-dd')).not.toThrow();
      expect(() => parsed.toISOString()).not.toThrow();
    }

    // Guards against a vacuous pass if the validator ever rejects everything.
    // 6 of the 9: '2026-02-29' (not a leap year), 'garbage' and '2026-13-45'
    // are correctly rejected.
    expect(checked).toBe(6);
  });

  it('accepts ISO basic-format dates that the Date constructor rejects', () => {
    // Guards the specific divergence: these must be usable, not merely rejected.
    for (const candidate of ['20260101', '2026-W01-1']) {
      expect(isValidDateValue(candidate)).toBe(true);
      expect(Number.isNaN(new Date(candidate).getTime())).toBe(true);
      expect(() => format(parseDate(candidate), 'yyyy-MM-dd')).not.toThrow();
    }
  });
});
