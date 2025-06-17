import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBudget, setBudget } from '../firebaseRest';

export interface RecurringItem {
  id: string;
  title: string;
  amount: number;
  type: 'credit' | 'debit';
  startDate: string;
  endDate?: string;
  interval: number;
  unit: 'day' | 'week' | 'month' | 'year';
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
  lastRolloverDate?: string; 
}

const defaultState: BudgetState = {
  startingBalance: 0,
  recurringItems: [],
  purchases: [],
};

const STORAGE_KEY = '@budget_state';

interface BudgetProviderProps {
  groupId: string;
  children: React.ReactNode;
}

const BudgetContext = createContext<{
  state: BudgetState;
  setState: React.Dispatch<React.SetStateAction<BudgetState>>;
}>({
  state: defaultState,
  setState: () => {},
});

function getOccurrences(item: RecurringItem, toDate: Date): number {
  const start = new Date(item.startDate);
  if (toDate < start) return 0;
  switch (item.unit) {
    case 'day': {
      const diffDays = Math.floor(
        (toDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );
      return Math.floor(diffDays / item.interval) + 1;
    }
    case 'week': {
      const diffDays = Math.floor(
        (toDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );
      return Math.floor(diffDays / (7 * item.interval)) + 1;
    }
    case 'month': {
      const years = toDate.getFullYear() - start.getFullYear();
      const months = years * 12 + (toDate.getMonth() - start.getMonth());
      return Math.floor(months / item.interval) + 1;
    }
    case 'year': {
      const years = toDate.getFullYear() - start.getFullYear();
      return Math.floor(years / item.interval) + 1;
    }
  }
}

function getNextStartDate(item: RecurringItem, toDate: Date): string {
  const start = new Date(item.startDate);
  const occ = getOccurrences(item, toDate);
  const next = new Date(start);
  switch (item.unit) {
    case 'day':
      next.setDate(next.getDate() + occ * item.interval);
      break;
    case 'week':
      next.setDate(next.getDate() + occ * item.interval * 7);
      break;
    case 'month':
      next.setMonth(next.getMonth() + occ * item.interval);
      break;
    case 'year':
      next.setFullYear(next.getFullYear() + occ * item.interval);
      break;
  }
  return next.toISOString();
}

export function BudgetProvider({
  groupId,
  children,
}: BudgetProviderProps) {
  const [state, setState] = useState<BudgetState>(defaultState);
  const initialized = useRef(false);

  useEffect(() => {
    // load local cache
    AsyncStorage.getItem(`${STORAGE_KEY}-${groupId}`)
      .then((json) => {
        if (json) {
          try {
            const local = JSON.parse(json);
            setState({ ...defaultState, ...local });
          } catch (e) {
            console.error('Failed to parse local cache', e);
          }
        }
      })
      .catch((err) => console.error('AsyncStorage getItem failed', err));

    getBudget(groupId)
      .then((data) => {
        let loaded: BudgetState = data
          ? { ...defaultState, ...data }
          : defaultState;

        const today = new Date();
        const todayStr = today.toISOString().slice(0, 10);

        if (loaded.lastRolloverDate !== todayStr) {
          // compute new opening balance
          let bal = loaded.startingBalance;

          // apply past recurring occurrences
          loaded.recurringItems.forEach((item) => {
            const end = item.endDate ? new Date(item.endDate) : null;
            const countDate =
              end && end < today ? end : today;
            const occ = getOccurrences(item, countDate);
            const sign = item.type === 'credit' ? 1 : -1;
            bal += occ * item.amount * sign;
          });

          // apply past one-off purchases
          loaded.purchases.forEach((p) => {
            if (new Date(p.plannedDate) <= today) {
              bal -= p.amount;
            }
          });

          // advance recurring items
          const nextRecurring = loaded.recurringItems.flatMap(
            (item) => {
              const end = item.endDate
                ? new Date(item.endDate)
                : null;
              const nextDate = getNextStartDate(item, today);
              if (end && new Date(nextDate) > end) {
                // no future occurrences
                return [];
              }
              return [{ ...item, startDate: nextDate }];
            }
          );

          // drop past one-offs
          const futurePurchases = loaded.purchases.filter(
            (p) => new Date(p.plannedDate) > today
          );

          loaded = {
            startingBalance: bal,
            recurringItems: nextRecurring,
            purchases: futurePurchases,
            lastRolloverDate: todayStr,
          };
        }

        setState(loaded);
      })
      .catch((err) => console.error('GET budget failed', err))
      .finally(() => {
        initialized.current = true;
      });
  }, [groupId]);

  useEffect(() => {
    if (!initialized.current) return;
    console.log('📡 REST setBudget', state);
    setBudget(groupId, state).catch((err) =>
      console.error('PATCH budget failed', err)
    );
    AsyncStorage.setItem(
      `${STORAGE_KEY}-${groupId}`,
      JSON.stringify(state)
    ).catch((err) =>
      console.error('AsyncStorage setItem failed', err)
    );
  }, [state, groupId]);

  return (
    <BudgetContext.Provider value={{ state, setState }}>
      {children}
    </BudgetContext.Provider>
  );
}

export const useBudget = () => useContext(BudgetContext);
