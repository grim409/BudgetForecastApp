import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useBudget } from '../context/BudgetContext';

export default function HomeScreen() {
  const { state } = useBudget();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Projected Balance</Text>
      {/* TODO: replace with real forecast calculation */}
      <Text style={styles.balance}>$0.00</Text>
      <Button title="Add Income" onPress={() => { /* navigate to form */ }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, marginBottom: 16 },
  balance: { fontSize: 32, fontWeight: 'bold', marginBottom: 24 },
});
