import type { BudgetState } from './forecast';
import { hasUsableId, isValidPurchase, isValidRecurrence } from './forecast';

export const STORAGE_KEY = '@budget_forecast_state';

// Pre-1.0 builds stored state per shared group under `@budget_state-${groupId}`.
// Read that once so upgrading users keep their budget instead of seeing sample data.
export const LEGACY_GROUP_ID_KEY = '@group_id';
export const legacyStateKey = (groupId: string) => `@budget_state-${groupId}`;

// Minimal slice of AsyncStorage this module needs, so the migration can be
// exercised without pulling react-native into the test environment.
export interface KeyValueStore {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  multiRemove: (keys: string[]) => Promise<void>;
}

// AsyncStorage is localStorage on web — user- and script-editable — and this is
// the only gate between it and the forecast engine, so entries are validated
// individually rather than by shape alone. Invalid entries are dropped instead
// of rejecting the whole budget, so one bad row cannot strand a real budget.
// Ids must be unique as well as present: duplicates collide on edit/delete
// (both rows mutate together) and warn in FlatList's keyExtractor.
function dedupeById<T extends { id: string }>(entries: T[]) {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.id)) return false;
    seen.add(entry.id);
    return true;
  });
}

export function normalizeBudgetState(value: unknown): BudgetState | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<BudgetState>;

  // A corrupt balance recovers to 0, matching buildForecast, rather than
  // discarding an otherwise-usable budget.
  const startingBalance = Number.isFinite(candidate.startingBalance)
    ? (candidate.startingBalance as number)
    : 0;
  if (!Array.isArray(candidate.recurringItems)) return null;
  if (!Array.isArray(candidate.purchases)) return null;

  return {
    startingBalance,
    recurringItems: dedupeById(
      candidate.recurringItems
        .filter(isValidRecurrence)
        .filter(hasUsableId)
        .map((item) => ({
          id: item.id,
          title: typeof item.title === 'string' ? item.title : '',
          amount: item.amount,
          type: item.type,
          startDate: item.startDate,
          ...(item.endDate === undefined ? {} : { endDate: item.endDate }),
          interval: item.interval,
          unit: item.unit,
        })),
    ),
    purchases: dedupeById(
      candidate.purchases
        .filter(isValidPurchase)
        .filter(hasUsableId)
        .map((purchase) => ({
          id: purchase.id,
          title: typeof purchase.title === 'string' ? purchase.title : '',
          amount: purchase.amount,
          plannedDate: purchase.plannedDate,
        })),
    ),
  };
}

export function parseBudgetState(saved: string | null): BudgetState | null {
  if (!saved) return null;
  try {
    const parsed: unknown = JSON.parse(saved);
    return normalizeBudgetState(parsed);
  } catch {
    return null;
  }
}

export async function loadPersistedState(storage: KeyValueStore): Promise<BudgetState | null> {
  const current = parseBudgetState(await storage.getItem(STORAGE_KEY));
  if (current) return current;

  const groupId = await storage.getItem(LEGACY_GROUP_ID_KEY);
  if (!groupId) return null;

  const legacy = parseBudgetState(await storage.getItem(legacyStateKey(groupId)));
  if (!legacy) return null;

  // Only clear the legacy keys once the new key has been written AND read back.
  // If the write fails we return the data anyway and leave the old keys intact,
  // so the next launch can retry the migration instead of losing the budget.
  try {
    await storage.setItem(STORAGE_KEY, JSON.stringify(legacy));
    if (parseBudgetState(await storage.getItem(STORAGE_KEY))) {
      await storage.multiRemove([LEGACY_GROUP_ID_KEY, legacyStateKey(groupId)]);
    }
  } catch {
    // Keep the legacy keys for a future attempt.
  }

  return legacy;
}
