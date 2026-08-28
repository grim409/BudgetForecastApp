import type { Session } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { isOwnerEmail, isSupabaseConfigured, supabase } from '../lib/supabase';

export type AuthStatus = 'loading' | 'signed-out' | 'signed-in';

interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  userId: string | null;
  email: string | null;
  /** True only for the approved owner. UI affordance; the database is authoritative. */
  isOwner: boolean;
  available: boolean;
  sendMagicLink: (email: string) => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function redirectTarget() {
  if (Platform.OS !== 'web') return undefined;
  if (typeof window === 'undefined') return undefined;
  return window.location.origin;
}

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>(isSupabaseConfigured ? 'loading' : 'signed-out');
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session ?? null);
        setStatus(data.session ? 'signed-in' : 'signed-out');
      })
      .catch(() => {
        if (active) setStatus('signed-out');
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      setSession(next ?? null);
      setStatus(next ? 'signed-in' : 'signed-out');
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const email = session?.user?.email ?? null;
    return {
      status,
      session,
      userId: session?.user?.id ?? null,
      email,
      isOwner: isOwnerEmail(email),
      available: isSupabaseConfigured,
      sendMagicLink: async (address: string) => {
        if (!supabase) throw new Error('Sign-in is not configured for this build.');
        const { error } = await supabase.auth.signInWithOtp({
          email: address.trim(),
          options: { emailRedirectTo: redirectTarget() },
        });
        if (error) throw error;
      },
      // The emailed code works in any browser, unlike the PKCE link which must
      // be opened in the browser that requested it.
      verifyCode: async (address: string, code: string) => {
        if (!supabase) throw new Error('Sign-in is not configured for this build.');
        const { error } = await supabase.auth.verifyOtp({
          email: address.trim(),
          token: code.trim(),
          type: 'email',
        });
        if (error) throw error;
      },
      signOut: async () => {
        if (!supabase) return;
        await supabase.auth.signOut();
      },
    };
  }, [session, status]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
