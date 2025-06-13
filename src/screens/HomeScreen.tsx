import React from 'react';
import {
  View, Text, Button, StyleSheet, FlatList,
  ListRenderItemInfo,
} from 'react-native';
import { useBudget, RecurringItem } from '../context/BudgetContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';

type HomeNavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const { state } = useBudget();
  const navigation = useNavigation<HomeNavProp>();

  // normalize to a monthly value
  const totalMonthly = state.recurringItems.reduce((sum, item) => {
    let monthly = item.amount;
    switch (item.unit) {
      case 'day':
        monthly = (item.amount * item.interval * 365) / 12;
        break;
      case 'week':
        monthly = (item.amount * item.interval * 52) / 12;
        break;
      case 'month':
        monthly = item.amount * item.interval;
        break;
      case 'year':
        monthly = (item.amount * item.interval) / 12;
        break;
    }
    return sum + (item.type === 'credit' ? monthly : -monthly);
  }, 0);

  const renderItem = ({ item }: ListRenderItemInfo<RecurringItem>) => (
    <View style={styles.itemRow}>
      <Text style={styles.itemTitle}>{item.title}</Text>
      <Text>
        {item.type === 'credit' ? '+ ' : '- '}
        ${item.amount.toFixed(2)} every {item.interval} {item.unit}(s)
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Projected Monthly Net</Text>
      <Text style={styles.balance}>${totalMonthly.toFixed(2)}</Text>

      <Button
        title="Add Recurring Item"
        onPress={() => navigation.navigate('AddRecurring')}
      />

      <Text style={styles.listTitle}>Your Recurring Items</Text>
      <FlatList
        data={state.recurringItems}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.emptyText}>No items yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 8 },
  balance: { fontSize: 28, fontWeight: 'bold', marginBottom: 16 },
  listTitle: { fontSize: 18, marginTop: 24, marginBottom: 8 },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  itemTitle: { fontSize: 16 },
  emptyText: { textAlign: 'center', marginTop: 32, color: '#666' },
});
