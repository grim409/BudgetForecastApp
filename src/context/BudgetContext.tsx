import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RecurringItem {
  id: string;
  title: string;
  amount: number;
  frequency: 'monthly' | 'weekly' | 'yearly';
  startDate: string;
}
export interface OneOffPurchase {
  id: string;
  title: string;
  amount: number;
  plannedDate: string;
}
export interface BudgetState {
  income: RecurringItem[];
  fixedExpenses: RecurringItem[];
  miscExpenses: RecurringItem[];
  purchases: OneOffPurchase[];
}

const STORAGE_KEY = '@budget_state';
const defaultState: BudgetState = {
  income: [],
  fixedExpenses: [],
  miscExpenses: [],
  purchases: [],
};

const BudgetContext = createContext<{
  state: BudgetState;
  setState: React.Dispatch<React.SetStateAction<BudgetState>>;
}>({ state: defaultState, setState: () => {} });

export const BudgetProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [state, setState] = useState<BudgetState>(defaultState);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(json => {
      if (json) setState(JSON.parse(json));
    });
  }, []);

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
