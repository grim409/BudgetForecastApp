import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useBudget } from '../context/BudgetContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';

type HomeNavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const { state } = useBudget();
  const navigation = useNavigation<HomeNavProp>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Projected Balance</Text>
      <Text style={styles.balance}>$0.00</Text>
      <Button title="Add Income" onPress={() => navigation.navigate('AddRecurring')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, marginBottom: 16 },
  balance: { fontSize: 32, fontWeight: 'bold', marginBottom: 24 },
});
