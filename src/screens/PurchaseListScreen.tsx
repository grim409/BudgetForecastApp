import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Button,
  ListRenderItemInfo,
} from 'react-native';
import { useBudget, OneOffPurchase } from '../context/BudgetContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'PurchaseList'>;

export default function PurchaseListScreen() {
  const { state } = useBudget();
  const navigation = useNavigation<NavProp>();

  const renderItem = ({ item }: ListRenderItemInfo<OneOffPurchase>) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('AddPurchase', { item })}
    >
      <View style={styles.itemRow}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text>
          ${item.amount.toFixed(2)} on{' '}
          {new Date(item.plannedDate).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Button
        title="Add One-Off Purchase"
        onPress={() => navigation.navigate('AddPurchase', {})}
      />
      <FlatList
        data={state.purchases}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.empty}>No purchases planned.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  itemTitle: { fontSize: 16 },
  empty: { textAlign: 'center', marginTop: 32, color: '#666' },
});
