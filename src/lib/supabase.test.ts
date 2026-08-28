import { describe, expect, it } from 'vitest';

import { isOwnerEmail } from './supabase';

// The owner check is a UI affordance, not the security boundary — row-level
// security in Postgres is authoritative. These tests pin the normalization so
// the UI cannot disagree with the database policy, which matches on
// lower(auth.jwt()->>'email').
describe('isOwnerEmail', () => {
  it('accepts the owner address regardless of case or surrounding whitespace', () => {
    expect(isOwnerEmail('jasong409@pm.me')).toBe(true);
    expect(isOwnerEmail('JasonG409@PM.ME')).toBe(true);
    expect(isOwnerEmail('  jasong409@pm.me  ')).toBe(true);
  });

  it('rejects everyone else, including plus-addressed aliases and lookalikes', () => {
    // A plus alias is a different auth identity and is denied by the RLS policy,
    // so the UI must not claim ownership for it either.
    expect(isOwnerEmail('jasong409+cardsync@pm.me')).toBe(false);
    expect(isOwnerEmail('jason.grimberg@yb-systems.com')).toBe(false);
    expect(isOwnerEmail('jasong409@pm.me.evil.com')).toBe(false);
    expect(isOwnerEmail('attacker@evil.com')).toBe(false);
  });

  it('rejects missing or non-string identities', () => {
    expect(isOwnerEmail(null)).toBe(false);
    expect(isOwnerEmail(undefined)).toBe(false);
    expect(isOwnerEmail('')).toBe(false);
    expect(isOwnerEmail('   ')).toBe(false);
  });
});
