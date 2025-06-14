import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

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
  const { user } = useAuth();
  const [state, setState] = useState<BudgetState>(defaultState);

  // Load from Firestore when authenticated, otherwise from AsyncStorage
  useEffect(() => {
    if (user) {
      const ref = doc(db, 'budgets', user.uid);
      const unsub = onSnapshot(ref, (snap) => {
        if (snap.exists()) {
          setState(snap.data() as BudgetState);
        }
      });
      return unsub;
    } else {
      AsyncStorage.getItem(STORAGE_KEY).then((json) => {
        if (json) {
          setState(JSON.parse(json));
        }
      });
    }
  }, [user]);

  // Persist to Firestore when authenticated, otherwise to AsyncStorage
  useEffect(() => {
    if (user) {
      setDoc(doc(db, 'budgets', user.uid), state);
    } else {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, user]);

  return (
    <BudgetContext.Provider value={{ state, setState }}>
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudget = () => useContext(BudgetContext);
