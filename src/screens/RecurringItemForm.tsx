import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useBudget } from '../context/BudgetContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { v4 as uuidv4 } from 'uuid';

type Props = NativeStackScreenProps<RootStackParamList, 'AddRecurring'>;

export default function RecurringItemForm({ navigation }: Props) {
  const { state, setState } = useBudget();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'credit' | 'debit'>('credit');
  const [interval, setInterval] = useState('1');
  const [unit, setUnit] = useState<'day'|'week'|'month'|'year'>('month');
  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const addItem = () => {
    const newItem = {
      id: uuidv4(),
      title: title.trim(),
      amount: parseFloat(amount),
      type,
      interval: parseInt(interval, 10) || 1,
      unit,
      startDate: startDate.toISOString(),
    };

    setState({
      ...state,
      recurringItems: [...state.recurringItems, newItem],
    });
    navigation.goBack();
  };

  const onChangeDate = (_: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) setStartDate(date);
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

      {/* Title and Amount */}
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

      {/* Interval + Unit */}
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
          onValueChange={val => setUnit(val as any)}
        >
          <Picker.Item label="day(s)" value="day" />
          <Picker.Item label="week(s)" value="week" />
          <Picker.Item label="month(s)" value="month" />
          <Picker.Item label="year(s)" value="year" />
        </Picker>
      </View>

      {/* Start Date */}
      <Text style={styles.label}>Start Date</Text>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Text>{startDate.toDateString()}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChangeDate}
        />
      )}

      {/* Save */}
      <View style={styles.saveButton}>
        <Button
          title="Save"
          onPress={addItem}
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
  smallInput: { width: 60, marginRight: 8 },
  inlineRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  picker: { flex: 1 },
  dateButton: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 4,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  saveButton: { marginTop: 24 },
});
