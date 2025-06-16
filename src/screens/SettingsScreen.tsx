import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
} from 'react-native';
import { useBudget } from '../context/BudgetContext';

export default function SettingsScreen({ navigation }: any) {
  const { state, setState } = useBudget();
  const [input, setInput] = useState(
    state.startingBalance.toString()
  );

  const save = () => {
    const val = parseFloat(input) || 0;
    setState(prev => ({ ...prev, startingBalance: val }));
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Starting Balance</Text>
      <TextInput
        style={styles.input}
        value={input}
        onChangeText={setInput}
        keyboardType="numeric"
        placeholder="0.00"
      />
      <Button title="Save" onPress={save} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 4,
    padding: 8,
    fontSize: 16,
    marginBottom: 16,
  },
});
