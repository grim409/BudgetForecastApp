import React from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  FlatList,
  ListRenderItemInfo,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useBudget, RecurringItem } from '../context/BudgetContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { LineChart } from 'react-native-chart-kit';

type HomeNavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const { state } = useBudget();
  const navigation = useNavigation<HomeNavProp>();
  const screenWidth = Dimensions.get('window').width;

  // compute totalMonthly & forecastData as before...
  const totalMonthly = state.recurringItems.reduce((sum, item) => {
    let m = item.amount;
    switch (item.unit) {
      case 'day':   m = (item.amount * item.interval * 365) / 12; break;
      case 'week':  m = (item.amount * item.interval * 52) / 12; break;
      case 'month': m = item.amount * item.interval; break;
      case 'year':  m = (item.amount * item.interval) / 12; break;
    }
    return sum + (item.type === 'credit' ? m : -m);
  }, 0);

  const today = new Date();
  const purchases = state.purchases; // your OneOffPurchase[]

  const forecastData = Array.from({ length: 12 }).map((_, i) => {
    // the first day of month i+1
    const monthDate = new Date(today.getFullYear(), today.getMonth() + i + 1, 1);

    // Recurring balance up through this month
    const recurringBalance = totalMonthly * (i + 1);

    // Sum of all purchases planned on or before this month
    const purchaseImpact = purchases
      .filter((p) => {
        const pd = new Date(p.plannedDate);
        return pd.getFullYear() < monthDate.getFullYear() ||
          (pd.getFullYear() === monthDate.getFullYear() &&
          pd.getMonth() + 1 <= monthDate.getMonth() + 1);
      })
      .reduce((sum, p) => sum - p.amount, 0);

    return {
      label: `${monthDate.getMonth() + 1}/${String(monthDate.getFullYear()).slice(-2)}`,
      // recurring adds, purchases subtract
      value: recurringBalance + purchaseImpact,
    };
  });

  const yData = forecastData.map((p) => p.value);
  const xLabels = forecastData.map((p) => p.label);

  const chartData = { labels: xLabels, datasets: [{ data: yData }] };
  const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(30,144,255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0,0,0, ${opacity})`,
    propsForDots: { r: '4', strokeWidth: '1', stroke: '#1e90ff' },
  };

  const renderItem = ({ item }: ListRenderItemInfo<RecurringItem>) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('AddRecurring', { item })}
    >
      <View style={styles.itemRow}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text>
          {item.type === 'credit' ? '+ ' : '- '}
          ${item.amount.toFixed(2)} every {item.interval} {item.unit}(s)
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={state.recurringItems}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={{ padding: 16 }}
      ListHeaderComponent={() => (
        <View>
          {/* chart and details table as before */}
          <Text style={styles.chartTitle}>Balance Forecast (12 months)</Text>
          <ScrollView horizontal contentContainerStyle={styles.chartScroll}>
            <LineChart
              data={chartData}
              width={xLabels.length * 60}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chartStyle}
            />
          </ScrollView>

          <Text style={styles.detailTitle}>Forecast Details</Text>
          {forecastData.map((p) => (
            <View key={p.label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{p.label}</Text>
              <Text style={styles.detailValue}>${p.value.toFixed(2)}</Text>
            </View>
          ))}

          <Text style={styles.title}>Projected Monthly Net</Text>
          <Text style={styles.balance}>${totalMonthly.toFixed(2)}</Text>
          <Button
            title="Add Recurring Item"
            onPress={() => navigation.navigate('AddRecurring', {})}
          />
          <View style={{ height: 16 }} />
          <Button
            title="One-Off Purchases"
            onPress={() => navigation.navigate('PurchaseList')}
          />
          <Text style={styles.listTitle}>Your Recurring Items</Text>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.emptyText}>No items yet.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  chartTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  chartScroll: { paddingRight: 16, marginBottom: 16 },
  chartStyle: { borderRadius: 8 },
  detailTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  detailLabel: { fontSize: 14 },
  detailValue: { fontSize: 14, fontWeight: '500' },
  title: { fontSize: 22, fontWeight: '600', marginTop: 16, marginBottom: 4 },
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
