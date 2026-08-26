import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDays, format } from 'date-fns';
import React, { createContext, useContext, useEffect, useState } from 'react';

import type { BudgetState } from '../lib/forecast';
import { STORAGE_KEY, loadPersistedState } from '../lib/persistence';

export type { BudgetState, OneOffPurchase, RecurringItem } from '../lib/forecast';

function createDemoState(): BudgetState {
  const today = new Date();
  const date = (offset: number) => format(addDays(today, offset), 'yyyy-MM-dd');

  return {
    startingBalance: 4250,
    recurringItems: [
      { id: 'salary', title: 'Paycheck', amount: 2800, type: 'credit', startDate: date(3), interval: 2, unit: 'week' },
      { id: 'rent', title: 'Rent', amount: 1650, type: 'debit', startDate: date(7), interval: 1, unit: 'month' },
      { id: 'utilities', title: 'Utilities', amount: 180, type: 'debit', startDate: date(10), interval: 1, unit: 'month' },
    ],
    purchases: [
      { id: 'car-service', title: 'Car service', amount: 420, plannedDate: date(18) },
    ],
  };
}

interface BudgetContextValue {
  state: BudgetState;
  setState: React.Dispatch<React.SetStateAction<BudgetState>>;
  resetDemo: () => void;
}

const BudgetContext = createContext<BudgetContextValue | null>(null);

export function BudgetProvider({ children }: React.PropsWithChildren) {
  const [state, setState] = useState<BudgetState>(() => createDemoState());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    loadPersistedState(AsyncStorage)
      .then((saved) => {
        if (active && saved) setState(saved);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);
  }, [ready, state]);

  const resetDemo = () => {
    const demo = createDemoState();
    setState(demo);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(demo)).catch(() => undefined);
  };

  return (
    <BudgetContext.Provider value={{ state, setState, resetDemo }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const context = useContext(BudgetContext);
  if (!context) throw new Error('useBudget must be used inside BudgetProvider');
  return context;
}
