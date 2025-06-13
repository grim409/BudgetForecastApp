import React, { useState } from 'react';
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
  const [startDate, setStartDate] = useState<Date>(
    existing ? new Date(existing.startDate) : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  const save = () => {
    const newItem: RecurringItem = {
      id: existing?.id ?? uuidv4(),
      title: title.trim(),
      amount: parseFloat(amount),
      type,
      interval: parseInt(interval, 10) || 1,
      unit,
      startDate: startDate.toISOString(),
    };

    if (existing) {
      // update
      setState({
        ...state,
        recurringItems: state.recurringItems.map((i) =>
          i.id === existing.id ? newItem : i
        ),
      });
    } else {
      // add
      setState({
        ...state,
        recurringItems: [...state.recurringItems, newItem],
      });
    }
    navigation.goBack();
  };

  const remove = () => {
    Alert.alert(
      'Delete',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setState({
              ...state,
              recurringItems: state.recurringItems.filter(
                (i) => i.id !== existing!.id
              ),
            });
            navigation.goBack();
          },
        },
      ],
      { cancelable: true }
    );
  };

  const onChangeDate = (_: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) setStartDate(date);
  };

  return (
    <View style={styles.container}>
      {/* Credit / Debit */}
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
  inlineRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
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
