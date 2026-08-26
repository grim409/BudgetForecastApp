import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
} from 'react-native';
import { randomUUID } from 'expo-crypto';
import DateField from '../components/DateField';
import { confirmDestructive, notify } from '../lib/dialogs';
import { isValidDateValue, parseDate } from '../lib/forecast';
import { useBudget, OneOffPurchase } from '../context/BudgetContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';


type Props = NativeStackScreenProps<RootStackParamList, 'AddPurchase'>;

export default function PurchaseFormScreen({ route, navigation }: Props) {
  const { state, setState } = useBudget();
  const existing = route.params?.item;

  const [title, setTitle] = useState(existing?.title ?? '');
  const [amount, setAmount] = useState(
    existing ? existing.amount.toString() : ''
  );
  // Parse with the engine's oracle, not `new Date` — see parseDate's comment.
  const [plannedDate, setPlannedDate] = useState<Date>(() =>
    existing && isValidDateValue(existing.plannedDate) ? parseDate(existing.plannedDate) : new Date()
  );

  const save = () => {
    const parsedAmount = Number(amount);
    if (!title.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      notify('Enter a title and an amount greater than zero.');
      return;
    }
    // toISOString throws RangeError on an Invalid Date, and this runs in an
    // onPress handler, which no error boundary can catch.
    if (Number.isNaN(plannedDate.getTime())) {
      notify('Please choose a valid planned date.');
      return;
    }

    const newPurchase: OneOffPurchase = {
      id: existing?.id ?? randomUUID(),
      title: title.trim(),
      amount: parsedAmount,
      plannedDate: plannedDate.toISOString(),
    };

    setState({
      ...state,
      purchases: existing
        ? state.purchases.map((p) =>
            p.id === existing.id ? newPurchase : p
          )
        : [...state.purchases, newPurchase],
    });

    navigation.goBack();
  };

  const remove = () => {
    confirmDestructive(
      'Delete Purchase',
      'Are you sure you want to delete this purchase?',
      'Delete',
      () => {
        setState({
          ...state,
          purchases: state.purchases.filter((p) => p.id !== existing!.id),
        });
        navigation.goBack();
      },
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. New TV"
      />

      <Text style={styles.label}>Amount</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        placeholder="e.g. 1500"
      />

      <Text style={styles.label}>Planned Date</Text>
      <DateField
        accessibilityLabel="Planned date"
        value={plannedDate}
        onChange={setPlannedDate}
      />

      <View style={styles.buttonsRow}>
        {existing && (
          <Button title="Delete" color="red" onPress={remove} />
        )}
        <Button
          title={existing ? 'Save Changes' : 'Add Purchase'}
          onPress={save}
          disabled={!title.trim() || !amount.trim()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  label: { fontSize: 16, marginVertical: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 4,
    padding: 8,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
});
