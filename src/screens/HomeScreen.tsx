import React, { useState } from 'react';
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
import { Picker } from '@react-native-picker/picker';
import { LineChart } from 'react-native-chart-kit';
import { useBudget, RecurringItem, OneOffPurchase } from '../context/BudgetContext';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation';

interface HorizonOption {
  label: string;
  unit: 'day' | 'month';
  count: number;
}

const horizonOptions: HorizonOption[] = [
  { label: '1 Week', unit: 'day', count: 7 },
  { label: '1 Month', unit: 'day', count: 30 },
  { label: '3 Months', unit: 'month', count: 3 },
  { label: '6 Months', unit: 'month', count: 6 },
  { label: '12 Months', unit: 'month', count: 12 },
  { label: '24 Months', unit: 'month', count: 24 },
];

export default function HomeScreen() {
  const { state } = useBudget();
  const navigation = useNavigation<any>();
  const screenWidth = Dimensions.get('window').width;

  const [horizon, setHorizon] = useState<HorizonOption>(horizonOptions[1]); // default 1 Month

  // compute net
  const totalMonthly = state.recurringItems.reduce((sum, item) => {
    let m = item.amount;
    switch (item.unit) {
      case 'day':
        m = (item.amount * item.interval * 365) / 12;
        break;
      case 'week':
        m = (item.amount * item.interval * 52) / 12;
        break;
      case 'month':
        m = item.amount * item.interval;
        break;
      case 'year':
        m = (item.amount * item.interval) / 12;
        break;
    }
    return sum + (item.type === 'credit' ? m : -m);
  }, 0);
  const dailyNet = totalMonthly / 30;

  const today = new Date();
  const purchases = state.purchases as OneOffPurchase[];
  const isDaily = horizon.unit === 'day';
  const steps = horizon.count;
  const POINT_WIDTH = 60;
  const HORIZ_PADDING = 32;

  const forecastData = Array.from({ length: steps }).map((_, i) => {
    const date = isDaily
      ? new Date(today.getFullYear(), today.getMonth(), today.getDate() + i + 1)
      : new Date(today.getFullYear(), today.getMonth() + i + 1, 1);

    const recurringBalance = isDaily
      ? dailyNet * (i + 1)
      : totalMonthly * (i + 1);

    const purchaseImpact = purchases
      .filter(p => new Date(p.plannedDate) <= date)
      .reduce((sum, p) => sum - p.amount, 0);

    const label = isDaily
      ? `${date.getMonth() + 1}/${date.getDate()}`
      : `${date.getMonth() + 1}/${String(date.getFullYear()).slice(-2)}`;

    return { label, value: recurringBalance + purchaseImpact };
  });

  const yData = forecastData.map(p => p.value);
  const xLabels = forecastData.map(p => p.label);
  const rawWidth = xLabels.length * POINT_WIDTH;
  const chartWidth = Math.max(rawWidth, screenWidth - HORIZ_PADDING);
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
    <TouchableOpacity onPress={() => navigation.navigate('AddRecurring', { item })}>
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
      keyExtractor={i => i.id}
      renderItem={renderItem}
      contentContainerStyle={{ padding: 16 }}
      ListHeaderComponent={() => (
        <View>
          {/* Projected Net & Buttons */}
          <Text style={styles.title}>Projected Net</Text>
          <Text style={styles.balance}>
            ${(isDaily ? dailyNet : totalMonthly).toFixed(2)}{isDaily ? ' per day' : ' per month'}
          </Text>
          <Button title="Add Recurring Item" onPress={() => navigation.navigate('AddRecurring', {})} />
          <View style={{ height: 16 }} />
          <Button title="One-Off Purchases" onPress={() => navigation.navigate('PurchaseList')} />

          {/* Horizon Selector */}
          <Text style={styles.label}>Forecast Horizon</Text>
          <View style={styles.pickerRow}>
            <Picker
              selectedValue={horizon.label}
              onValueChange={label => {
                const opt = horizonOptions.find(o => o.label === label)!;
                setHorizon(opt);
              }}
              mode="dropdown"
              style={styles.picker}
            >
              {horizonOptions.map(o => (
                <Picker.Item key={o.label} label={o.label} value={o.label} />
              ))}
            </Picker>
          </View>

          {/* Chart */}
          <Text style={styles.chartTitle}>Balance Forecast ({horizon.label})</Text>
          <ScrollView horizontal contentContainerStyle={styles.chartScroll}>
            <LineChart
              data={chartData}
              width={chartWidth}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chartStyle}
            />
          </ScrollView>

          {/* Details */}
          <Text style={styles.detailTitle}>Forecast Details</Text>
          {forecastData.map(p => (
            <View key={p.label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{p.label}</Text>
              <Text style={styles.detailValue}>${p.value.toFixed(2)}</Text>
            </View>
          ))}

          {/* Recurring Items Header */}
          <Text style={styles.listTitle}>Your Recurring Items</Text>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.emptyText}>No items yet.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  // Picker
  label:      { fontSize: 16, marginBottom: 4 },
  pickerRow:  {
    width: '100%',
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 4,
    marginBottom: 16,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  picker:     { width: '100%', color: '#000' },

  // Chart
  chartTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  chartScroll:{ paddingRight: 16, marginBottom: 16 },
  chartStyle: { borderRadius: 8 },

  // Details
  detailTitle:{ fontSize: 18, fontWeight: '600', marginBottom: 4 },
  detailRow:  { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderColor: '#eee' },
  detailLabel:{ fontSize: 14 },
  detailValue:{ fontSize: 14, fontWeight: '500' },

  // Projected Net & Buttons
  title:      { fontSize: 22, fontWeight: '600', marginBottom: 4 },
  balance:    { fontSize: 28, fontWeight: 'bold', marginBottom: 16 },

  // Recurring Items
  listTitle:  { fontSize: 18, marginTop: 24, marginBottom: 8 },
  itemRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#ddd' },
  itemTitle:  { fontSize: 16 },
  emptyText:  { textAlign: 'center', marginTop: 32, color: '#666' },
});
