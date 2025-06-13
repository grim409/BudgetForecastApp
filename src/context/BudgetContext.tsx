import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RecurringItem {
  id: string;
  title: string;
  amount: number;
  type: 'credit' | 'debit';
  startDate: string;      // ISO
  interval: number;       // e.g. 1, 2, 3…
  unit: 'day' | 'week' | 'month' | 'year';
}

export interface OneOffPurchase {
  id: string;
  title: string;
  amount: number;
  plannedDate: string;
}

export interface BudgetState {
  recurringItems: RecurringItem[];
  purchases: OneOffPurchase[];
}

const STORAGE_KEY = '@budget_state_v3';

const defaultState: BudgetState = {
  recurringItems: [],
  purchases: [],
};

const BudgetContext = createContext<{
  state: BudgetState;
  setState: React.Dispatch<React.SetStateAction<BudgetState>>;
}>({
  state: defaultState,
  setState: () => {},
});

export const BudgetProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [state, setState] = useState<BudgetState>(defaultState);

  // Load & migrate old data
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(json => {
      if (!json) return;
      try {
        const obj = JSON.parse(json);
        // Detect old shape (no unit/interval)
        if (Array.isArray(obj.recurringItems) && obj.recurringItems.length && !('unit' in obj.recurringItems[0])) {
          const migrated = obj.recurringItems.map((i: any) => ({
            ...i,
            interval: 1,
            unit: 'month' as const,
          }));
          setState({ recurringItems: migrated, purchases: obj.purchases || [] });
        } else {
          setState(obj);
        }
      } catch {
        // ignore bad JSON
      }
    });
  }, []);

  // Persist on change
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return (
    <BudgetContext.Provider value={{ state, setState }}>
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudget = () => useContext(BudgetContext);
