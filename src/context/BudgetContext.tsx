// src/context/BudgetContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

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

/** Props for the BudgetProvider, including the groupId and children */
interface BudgetProviderProps {
  groupId: string;
  children: React.ReactNode;
}

/** Context to hold the budget state & setter */
const BudgetContext = createContext<{
  state: BudgetState;
  setState: React.Dispatch<React.SetStateAction<BudgetState>>;
}>({
  state: defaultState,
  setState: () => {},
});

/**
 * Provides budget state synchronized to Firestore under budgets/{groupId},
 * with local AsyncStorage caching.
 */
export function BudgetProvider({ groupId, children }: BudgetProviderProps) {
  const [state, setState] = useState<BudgetState>(defaultState);

  // 1) Subscribe to Firestore doc for this group
  useEffect(() => {
    const ref = doc(db, 'budgets', groupId);
    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setState(snap.data() as BudgetState);
      } else {
        // initialize if absent
        setDoc(ref, defaultState);
      }
    });
    return unsubscribe;
  }, [groupId]);

  // 2) Persist to Firestore and AsyncStorage on any change
  useEffect(() => {
    const ref = doc(db, 'budgets', groupId);
    setDoc(ref, state);
    AsyncStorage.setItem(`${STORAGE_KEY}-${groupId}`, JSON.stringify(state));
  }, [state, groupId]);

  return (
    <BudgetContext.Provider value={{ state, setState }}>
      {children}
    </BudgetContext.Provider>
  );
}

/** Hook to consume the budget context */
export const useBudget = () => useContext(BudgetContext);
