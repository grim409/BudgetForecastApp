import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useBudget } from '../context/BudgetContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { v4 as uuidv4 } from 'uuid';

type Props = NativeStackScreenProps<RootStackParamList, 'AddRecurring'>;

export default function RecurringItemForm({ navigation }: Props) {
  const { state, setState } = useBudget();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');

  const addItem = () => {
    const newItem = {
      id: uuidv4(),
      title,
      amount: parseFloat(amount),
      frequency: 'monthly' as const,
      startDate: new Date().toISOString(),
    };
    setState({
      ...state,
      income: [...state.income, newItem],
    });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Salary"
      />

      <Text style={styles.label}>Amount</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        placeholder="e.g. 5000"
      />

      <Button
        title="Save"
        onPress={addItem}
        disabled={!title.trim() || !amount.trim()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  label: { fontSize: 16, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
  },
});
