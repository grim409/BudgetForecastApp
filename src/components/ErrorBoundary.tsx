import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { LEGACY_GROUP_ID_KEY, STORAGE_KEY, legacyStateKey } from '../lib/persistence';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

// Without this, a throw from the render tree leaves a permanent blank screen:
// the initial route is the one that renders the budget, so a user whose stored
// data triggers a crash could never navigate to Settings to reset it.
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  private recover = () => {
    // The legacy keys must go too: if a migration write previously failed they
    // survive on purpose, and clearing only STORAGE_KEY would re-migrate the
    // same crashing data on the next load — an unrecoverable reset loop.
    AsyncStorage.getItem(LEGACY_GROUP_ID_KEY)
      .catch(() => null)
      .then((groupId) => AsyncStorage.multiRemove([
        STORAGE_KEY,
        LEGACY_GROUP_ID_KEY,
        ...(groupId ? [legacyStateKey(groupId)] : []),
      ]))
      .catch(() => undefined)
      .finally(() => this.setState({ error: null }));
  };

  // Not every crash is caused by stored data — offer a non-destructive retry
  // before the option that erases the budget.
  private retry = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>{error.message}</Text>
        <Text style={styles.hint}>
          Resetting clears the budget stored on this device and reloads the sample data.
        </Text>
        <View style={styles.actions}>
          <Button title="Try again" onPress={this.retry} />
        </View>
        <Button title="Reset stored budget" color="#b91c1c" onPress={this.recover} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  message: { fontSize: 14, color: '#b91c1c', marginBottom: 16 },
  hint: { fontSize: 14, color: '#374151', marginBottom: 24 },
  actions: { marginBottom: 16 },
});
