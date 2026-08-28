import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDays, format } from 'date-fns';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import type { BudgetState } from '../lib/forecast';
import { STORAGE_KEY, loadPersistedState } from '../lib/persistence';
import { fetchRemoteBudget, saveRemoteBudget } from '../lib/remoteBudget';
import { useAuth } from './AuthContext';

export type { BudgetState, OneOffPurchase, RecurringItem } from '../lib/forecast';

export type BudgetMode = 'demo' | 'cloud';
export type SyncStatus = 'idle' | 'loading' | 'saving' | 'error';

export function createDemoState(): BudgetState {
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
  mode: BudgetMode;
  syncStatus: SyncStatus;
  syncError: string | null;
  retrySync: () => void;
}

const BudgetContext = createContext<BudgetContextValue | null>(null);

export function BudgetProvider({ children }: React.PropsWithChildren) {
  const { status: authStatus, userId, isOwner } = useAuth();

  // Cloud mode requires BOTH a session and the approved identity. Anyone else
  // stays in demo mode, and the database would refuse them regardless.
  const mode: BudgetMode = authStatus === 'signed-in' && isOwner && userId ? 'cloud' : 'demo';

  const [state, setState] = useState<BudgetState>(() => createDemoState());
  const [ready, setReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  // Identifies which source the in-memory state came from. Writes are only ever
  // flushed back to that same source, so demo edits cannot reach the database
  // and cloud data cannot be written into browser storage.
  const loadedFor = useRef<string | null>(null);
  const target = mode === 'cloud' ? `cloud:${userId}` : 'demo';

  useEffect(() => {
    if (authStatus === 'loading') return;

    let active = true;
    loadedFor.current = null;

    const load = async (): Promise<BudgetState> => {
      if (mode === 'cloud' && userId) {
        const remote = await fetchRemoteBudget(userId);
        // A first-time owner starts from the sample budget rather than a blank
        // screen; it only becomes real data once they change something.
        return remote ?? createDemoState();
      }
      const local = await loadPersistedState(AsyncStorage);
      return local ?? createDemoState();
    };

    load()
      .then((loaded) => {
        if (!active) return;
        setState(loaded);
        loadedFor.current = target;
        setSyncStatus('idle');
        setSyncError(null);
        setReady(true);
      })
      .catch((error: unknown) => {
        if (!active) return;
        // Never fall back to demo data in cloud mode: silently showing sample
        // numbers as if they were real, then saving them, would destroy data.
        setSyncStatus('error');
        setSyncError(error instanceof Error ? error.message : 'Could not load your budget.');
        setReady(true);
      });

    return () => {
      active = false;
    };
  }, [authStatus, mode, target, userId, reloadToken]);

  useEffect(() => {
    if (!ready) return;
    // Only persist state that was loaded for the current target.
    if (loadedFor.current !== target) return;

    let active = true;

    if (mode === 'cloud' && userId) {
      saveRemoteBudget(userId, state)
        .then(() => {
          if (active) {
            setSyncStatus('idle');
            setSyncError(null);
          }
        })
        .catch((error: unknown) => {
          if (!active) return;
          setSyncStatus('error');
          setSyncError(error instanceof Error ? error.message : 'Could not save your budget.');
        });
    } else {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);
    }

    return () => {
      active = false;
    };
  }, [mode, ready, state, target, userId]);

  const resetDemo = useCallback(() => {
    const demo = createDemoState();
    setState(demo);
    // The effect above writes it to whichever store is active.
  }, []);

  const retrySync = useCallback(() => setReloadToken((token) => token + 1), []);

  return (
    <BudgetContext.Provider
      value={{ state, setState, resetDemo, mode, syncStatus, syncError, retrySync }}
    >
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const context = useContext(BudgetContext);
  if (!context) throw new Error('useBudget must be used inside BudgetProvider');
  return context;
}
