// src/screens/RecurringItemForm.tsx

import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { randomUUID } from 'expo-crypto';
import DateField from '../components/DateField';
import { confirmDestructive, notify } from '../lib/dialogs';
import { MAX_RECURRENCE_INTERVAL, isValidDateValue, parseDate } from '../lib/forecast';
import { useBudget, RecurringItem } from '../context/BudgetContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';


type Props = NativeStackScreenProps<RootStackParamList, 'AddRecurring'>;

export default function RecurringItemForm({ route, navigation }: Props) {
  const { setState } = useBudget();
  const existing = route.params?.item;

  // --- form state ---
  const [title, setTitle] = useState(existing?.title ?? '');
  const [amount, setAmount] = useState(
    existing ? existing.amount.toString() : ''
  );
  const [type, setType] = useState<'credit' | 'debit'>(
    existing?.type ?? 'credit'
  );
  const [interval, setInterval] = useState(
    existing ? existing.interval.toString() : '1'
  );
  const [unit, setUnit] = useState<'day' | 'week' | 'month' | 'year'>(
    existing?.unit ?? 'month'
  );

  // start-date picker
  // Must use the engine's parser, not `new Date`: the two disagree on some ISO
  // forms, and a mismatch here renders an Invalid Date that throws on format().
  const [startDate, setStartDate] = useState<Date>(() =>
    existing && isValidDateValue(existing.startDate) ? parseDate(existing.startDate) : new Date()
  );

  // ** end-date picker **
  const [endDate, setEndDate] = useState<Date | undefined>(() =>
    existing?.endDate && isValidDateValue(existing.endDate) ? parseDate(existing.endDate) : undefined
  );

  // set navigation title
  useLayoutEffect(() => {
    navigation.setOptions({
      title: existing ? 'Edit Recurring' : 'New Recurring',
    });
  }, [navigation, existing]);

  const save = () => {
    const parsedAmount = Number(amount);
    const parsedInterval = Number(interval);
    if (
      !title.trim() ||
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0 ||
      !Number.isInteger(parsedInterval) ||
      parsedInterval <= 0 ||
      parsedInterval > MAX_RECURRENCE_INTERVAL
    ) {
      return notify(
        `Enter a title, a positive amount, and a whole-number interval between 1 and ${MAX_RECURRENCE_INTERVAL}.`,
      );
    }
    if (endDate && endDate < startDate) {
      return notify('The end date must be on or after the start date.');
    }
    // toISOString throws RangeError on an Invalid Date, and this runs in an
    // onPress handler, which no error boundary can catch.
    if (Number.isNaN(startDate.getTime())) {
      return notify('Please choose a valid start date.');
    }
    if (endDate && Number.isNaN(endDate.getTime())) {
      return notify('Please choose a valid end date.');
    }

    const newItem: RecurringItem = {
      id: existing?.id ?? randomUUID(),
      title: title.trim(),
      amount: parsedAmount,
      type,
      startDate: startDate.toISOString(),
      ...(endDate && { endDate: endDate.toISOString() }),
      interval: parsedInterval,
      unit,
    };

    setState((prev) => ({
      ...prev,
      recurringItems: existing
        ? prev.recurringItems.map((i) =>
            i.id === newItem.id ? newItem : i
          )
        : [...prev.recurringItems, newItem],
    }));

    navigation.goBack();
  };

  const remove = () => {
    confirmDestructive('Delete', 'Are you sure?', 'Delete', () => {
      setState((prev) => ({
        ...prev,
        recurringItems: prev.recurringItems.filter((i) => i.id !== existing!.id),
      }));
      navigation.goBack();
    });
  };

  return (
    <View style={styles.container}>
      {/* Credit / Debit toggle */}
      <View style={styles.toggleRow}>
        <Button
          title="Credit"
          onPress={() => setType('credit')}
          color={type === 'credit' ? 'green' : undefined}
        />
        <Button
          title="Debit"
          onPress={() => setType('debit')}
          color={type === 'debit' ? 'red' : undefined}
        />
      </View>

      {/* Title & Amount */}
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Amount</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />

      {/* Interval & Unit */}
      <Text style={styles.label}>Every</Text>
      <View style={styles.inlineRow}>
        <TextInput
          style={[styles.input, styles.smallInput]}
          value={interval}
          onChangeText={setInterval}
          keyboardType="numeric"
        />
        <Picker
          selectedValue={unit}
          style={styles.picker}
          onValueChange={(value) => setUnit(value as RecurringItem['unit'])}
        >
          <Picker.Item label="Day(s)" value="day" />
          <Picker.Item label="Week(s)" value="week" />
          <Picker.Item label="Month(s)" value="month" />
          <Picker.Item label="Year(s)" value="year" />
        </Picker>
      </View>

      {/* Start Date */}
      <Text style={styles.label}>Start Date</Text>
      <DateField
        accessibilityLabel="Start date"
        value={startDate}
        onChange={setStartDate}
      />

      {/* End Date */}
      <Text style={styles.label}>End Date (optional)</Text>
      <DateField
        accessibilityLabel="End date"
        placeholder="No end date (infinite)"
        value={endDate}
        onChange={setEndDate}
      />

      {/* Actions */}
      <View style={styles.buttonsRow}>
        {existing && (
          <Button title="Delete" color="red" onPress={remove} />
        )}
        <Button
          title={existing ? 'Save Changes' : 'Add Item'}
          onPress={save}
          disabled={!title.trim() || !amount.trim()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  label: { fontSize: 16, marginVertical: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 4,
    padding: 8,
  },
  inlineRow: { flexDirection: 'row', alignItems: 'center' },
  smallInput: { width: 60, marginRight: 8 },
  picker: { flex: 1 },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
});
