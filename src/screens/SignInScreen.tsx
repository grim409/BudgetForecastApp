import React, { useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { useBudget } from '../context/BudgetContext';

export default function SignInScreen() {
  const { sendMagicLink, verifyCode, signOut, status, email, isOwner, available } = useAuth();
  const { mode } = useBudget();
  const [address, setAddress] = useState('');
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setSending(true);
    try {
      await sendMagicLink(address);
      setSent(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not send the sign-in link.');
    } finally {
      setSending(false);
    }
  };

  const submitCode = async () => {
    setError(null);
    setVerifying(true);
    try {
      await verifyCode(address, code);
      // On success the auth listener swaps this screen for the signed-in view.
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'That code was not accepted.');
    } finally {
      setVerifying(false);
    }
  };

  if (!available) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Demo mode</Text>
        <Text style={styles.body}>
          This build has no backend configured, so it runs entirely in your browser.
          Changes stay on this device and are never uploaded.
        </Text>
      </View>
    );
  }

  if (status === 'signed-in') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Signed in</Text>
        <Text style={styles.body}>{email}</Text>
        {isOwner ? (
          <Text style={styles.ok}>
            Your budget is saved to your private account and syncs across your devices.
          </Text>
        ) : (
          <Text style={styles.warn}>
            This account does not have access to the private budget, so you are seeing
            the demo. Nothing you change here is uploaded.
          </Text>
        )}
        <View style={styles.action}>
          <Button title="Sign out" onPress={() => signOut()} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in</Text>
      <Text style={styles.body}>
        You are using the demo. It starts from sample data and everything stays in this
        browser — nothing is saved to an account.
      </Text>
      <Text style={styles.body}>
        Sign in to load your own budget and sync it across devices. We will email you a
        one-time link; there is no password.
      </Text>

      {sent ? (
        <>
          <Text style={styles.ok}>
            Check your email. Either open the link in this browser, or enter the code
            from the email below — the code works from any browser.
          </Text>
          <Text style={styles.label}>Sign-in code</Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="number-pad"
            placeholder="8-digit code"
            accessibilityLabel="Sign-in code"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.action}>
            {verifying ? (
              <ActivityIndicator />
            ) : (
              <Button title="Verify code" onPress={submitCode} disabled={!code.trim()} />
            )}
          </View>
          <View style={styles.action}>
            <Button title="Use a different email" onPress={() => { setSent(false); setCode(''); setError(null); }} />
          </View>
        </>
      ) : (
        <>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            placeholder="you@example.com"
            accessibilityLabel="Email address"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.action}>
            {sending ? (
              <ActivityIndicator />
            ) : (
              <Button title="Email me a sign-in link" onPress={submit} disabled={!address.trim()} />
            )}
          </View>
        </>
      )}

      <Text style={styles.footnote}>
        Currently in {mode === 'cloud' ? 'private' : 'demo'} mode.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 12 },
  body: { fontSize: 15, color: '#374151', marginBottom: 12, lineHeight: 21 },
  label: { fontSize: 15, marginTop: 8, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
  },
  action: { marginTop: 20 },
  ok: { fontSize: 15, color: '#166534', marginTop: 8, lineHeight: 21 },
  warn: { fontSize: 15, color: '#b45309', marginTop: 8, lineHeight: 21 },
  error: { fontSize: 14, color: '#b91c1c', marginTop: 10 },
  footnote: { fontSize: 13, color: '#6b7280', marginTop: 28 },
});
