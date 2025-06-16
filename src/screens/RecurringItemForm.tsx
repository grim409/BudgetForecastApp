// src/screens/RecurringItemForm.tsx

import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useBudget, RecurringItem } from '../context/BudgetContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { v4 as uuidv4 } from 'uuid';

type Props = NativeStackScreenProps<RootStackParamList, 'AddRecurring'>;

export default function RecurringItemForm({ route, navigation }: Props) {
  const { state, setState } = useBudget();
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
  const [startDate, setStartDate] = useState<Date>(
    existing ? new Date(existing.startDate) : new Date()
  );
  const [showStartPicker, setShowStartPicker] = useState(false);

  // ** end-date picker **
  const [endDate, setEndDate] = useState<Date | undefined>(
    existing?.endDate ? new Date(existing.endDate) : undefined
  );
  const [showEndPicker, setShowEndPicker] = useState(false);

  // set navigation title
  useLayoutEffect(() => {
    navigation.setOptions({
      title: existing ? 'Edit Recurring' : 'New Recurring',
    });
  }, [navigation, existing]);

  // handlers
  const onChangeStart = (_: any, selected?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selected) setStartDate(selected);
  };
  const onChangeEnd = (_: any, selected?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selected) setEndDate(selected);
  };

  const save = () => {
    const parsedAmount = parseFloat(amount);
    const parsedInterval = parseInt(interval, 10);
    if (!title.trim() || isNaN(parsedAmount) || isNaN(parsedInterval)) {
      return Alert.alert('Please fill out all required fields.');
    }

    const newItem: RecurringItem = {
      id: existing?.id ?? uuidv4(),
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
    Alert.alert(
      'Delete',
      'Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setState((prev) => ({
              ...prev,
              recurringItems: prev.recurringItems.filter(
                (i) => i.id !== existing!.id
              ),
            }));
            navigation.goBack();
          },
        },
      ],
      { cancelable: true }
    );
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
          onValueChange={(v) => setUnit(v as any)}
        >
          <Picker.Item label="Day(s)" value="day" />
          <Picker.Item label="Week(s)" value="week" />
          <Picker.Item label="Month(s)" value="month" />
          <Picker.Item label="Year(s)" value="year" />
        </Picker>
      </View>

      {/* Start Date */}
      <Text style={styles.label}>Start Date</Text>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowStartPicker(true)}
      >
        <Text>{startDate.toDateString()}</Text>
      </TouchableOpacity>
      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChangeStart}
        />
      )}

      {/* End Date */}
      <Text style={styles.label}>End Date (optional)</Text>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowEndPicker(true)}
      >
        <Text>
          {endDate
            ? endDate.toDateString()
            : 'No end date (infinite)'}
        </Text>
      </TouchableOpacity>
      {showEndPicker && (
        <DateTimePicker
          value={endDate ?? new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChangeEnd}
        />
      )}

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
  dateButton: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
});
