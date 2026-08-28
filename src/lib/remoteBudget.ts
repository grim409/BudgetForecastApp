import type { BudgetState } from './forecast';
import { normalizeBudgetState } from './persistence';
import { BUDGETS_TABLE, supabase } from './supabase';

// Cloud data gets exactly the same validation as local data: it is still just
// a JSON blob, and a malformed row must never reach the forecast engine.
export async function fetchRemoteBudget(userId: string): Promise<BudgetState | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(BUDGETS_TABLE)
    .select('state')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return normalizeBudgetState(data.state);
}

export async function saveRemoteBudget(userId: string, state: BudgetState): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase
    .from(BUDGETS_TABLE)
    .upsert({ user_id: userId, state }, { onConflict: 'user_id' });

  if (error) throw error;
}
