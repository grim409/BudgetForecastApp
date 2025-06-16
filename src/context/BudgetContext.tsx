import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBudget, setBudget } from '../firebaseRest';

export interface RecurringItem {
  id: string;
  title: string;
  amount: number;
  type: 'credit' | 'debit';
  startDate: string;
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
  recurringItems: RecurringItem[];
  purchases: OneOffPurchase[];
}

const defaultState: BudgetState = {
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

export function BudgetProvider({ groupId, children }: BudgetProviderProps) {
  const [state, setState] = useState<BudgetState>(defaultState);

  // 1) Load from AsyncStorage, then fetch from Firestore REST
  useEffect(() => {
    AsyncStorage.getItem(`${STORAGE_KEY}-${groupId}`)
      .then(json => {
        if (json) {
          try {
            setState(JSON.parse(json));
          } catch (e) {
            console.error('Failed to parse local cache', e);
          }
        }
      })
      .catch(err => console.error('AsyncStorage getItem failed', err));

    getBudget(groupId)
      .then(data => {
        if (data) {
          setState(data);
        } else {
          // Initialize remote document if missing
          return setBudget(groupId, defaultState);
        }
      })
      .catch(err => console.error('GET budget failed', err));
  }, [groupId]);

  // 2) Persist any change to Firestore REST and AsyncStorage
  useEffect(() => {
    console.log('📡 REST setBudget', state);
    setBudget(groupId, state).catch(err => console.error('PATCH budget failed', err));

    AsyncStorage.setItem(`${STORAGE_KEY}-${groupId}`, JSON.stringify(state)).catch(err =>
      console.error('AsyncStorage setItem failed', err),
    );
  }, [state, groupId]);

  return (
    <BudgetContext.Provider value={{ state, setState }}>
      {children}
    </BudgetContext.Provider>
  );
}

export const useBudget = () => useContext(BudgetContext);
