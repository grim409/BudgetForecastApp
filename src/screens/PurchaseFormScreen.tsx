import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useBudget, OneOffPurchase } from '../context/BudgetContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { v4 as uuidv4 } from 'uuid';

type Props = NativeStackScreenProps<RootStackParamList, 'AddPurchase'>;

export default function PurchaseFormScreen({ route, navigation }: Props) {
  const { state, setState } = useBudget();
  const existing = route.params?.item;

  const [title, setTitle] = useState(existing?.title ?? '');
  const [amount, setAmount] = useState(
    existing ? existing.amount.toString() : ''
  );
  const [plannedDate, setPlannedDate] = useState<Date>(
    existing ? new Date(existing.plannedDate) : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  const save = () => {
    const newPurchase: OneOffPurchase = {
      id: existing?.id ?? uuidv4(),
      title: title.trim(),
      amount: parseFloat(amount),
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
    Alert.alert(
      'Delete Purchase',
      'Are you sure you want to delete this purchase?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setState({
              ...state,
              purchases: state.purchases.filter(
                (p) => p.id !== existing!.id
              ),
            });
            navigation.goBack();
          },
        },
      ]
    );
  };

  const onChangeDate = (_: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) setPlannedDate(date);
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
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Text>{plannedDate.toDateString()}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={plannedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChangeDate}
        />
      )}

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
