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

export function BudgetProvider({
  groupId,
  children,
}: BudgetProviderProps) {
  const [state, setState] = useState<BudgetState>(defaultState);
  const initialized = useRef(false);

  useEffect(() => {
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
        if (data) {
          setState({ ...defaultState, ...data });
        } else {
          // Initialize remote document if it doesn’t exist
          return setBudget(groupId, defaultState);
        }
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
    ).catch((err) => console.error('AsyncStorage setItem failed', err));
  }, [state, groupId]);

  return (
    <BudgetContext.Provider value={{ state, setState }}>
      {children}
    </BudgetContext.Provider>
  );
}

export const useBudget = () => useContext(BudgetContext);
