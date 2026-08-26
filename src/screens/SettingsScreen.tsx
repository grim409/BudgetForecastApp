import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useBudget } from '../context/BudgetContext';
import { confirmDestructive } from '../lib/dialogs';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const { state, setState, resetDemo } = useBudget();
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
      <View style={styles.reset}>
        <Button
          title="Reset sample budget"
          color="#b91c1c"
          onPress={() => confirmDestructive(
            'Reset sample budget?',
            'This replaces the budget stored on this device.',
            'Reset',
            resetDemo,
          )}
        />
      </View>
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
  reset: { marginTop: 32 },
});
