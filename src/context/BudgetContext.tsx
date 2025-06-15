import * as React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
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

const STORAGE_KEY = '@budget_state';
const SHARED_DOC_ID = 'shared';

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

  // Subscribe to the shared Firestore document
  useEffect(() => {
    const ref = doc(db, 'budgets', SHARED_DOC_ID);
    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setState(snap.data() as BudgetState);
      } else {
        // Initialize it if absent
        setDoc(ref, defaultState);
      }
    });
    return unsubscribe;
  }, []);

  // Persist to Firestore (and AsyncStorage) on any change
  useEffect(() => {
    const ref = doc(db, 'budgets', SHARED_DOC_ID);
    setDoc(ref, state);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return (
    <BudgetContext.Provider value={{ state, setState }}>
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudget = () => useContext(BudgetContext);
