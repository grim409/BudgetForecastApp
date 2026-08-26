import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { format, parseISO } from 'date-fns';
import React, { useMemo, useState } from 'react';
import {
  Button,
  Dimensions,
  FlatList,
  ListRenderItemInfo,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';

import { useBudget } from '../context/BudgetContext';
import { buildForecast, getMonthlyNet, type RecurringItem } from '../lib/forecast';
import type { RootStackParamList } from '../navigation';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'Home'>;

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
];

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export default function HomeScreen() {
  const { state } = useBudget();
  const navigation = useNavigation<Navigation>();
  const [today] = useState(() => new Date());
  const [horizon, setHorizon] = useState(horizonOptions[1]);
  const screenWidth = Dimensions.get('window').width;

  const monthlyNet = useMemo(() => getMonthlyNet(state, today), [state, today]);
  const forecast = useMemo(
    () => buildForecast(state, today, horizon.unit, horizon.count),
    [horizon, state, today],
  );
  const chartWidth = Math.max(forecast.length * 60, screenWidth - 32);
  const chartData = {
    labels: forecast.map((point) => format(parseISO(point.date), horizon.unit === 'day' ? 'M/d' : 'MMM yy')),
    datasets: [{ data: forecast.map((point) => point.balance) }],
  };
  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(22, 101, 52, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(31, 41, 55, ${opacity})`,
    propsForDots: { r: '4', strokeWidth: '1', stroke: '#166534' },
  };

  const renderItem = ({ item }: ListRenderItemInfo<RecurringItem>) => (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={() => navigation.navigate('AddRecurring', { item })}
    >
      <View style={styles.itemRow}>
        <View>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemSchedule}>Every {item.interval} {item.unit}{item.interval === 1 ? '' : 's'}</Text>
        </View>
        <Text style={item.type === 'credit' ? styles.credit : styles.debit}>
          {item.type === 'credit' ? '+' : '-'}{currency.format(item.amount)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={state.recurringItems}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.container}
      ListHeaderComponent={(
        <View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Current balance</Text>
            <Text style={styles.balance}>{currency.format(state.startingBalance)}</Text>
            <Text style={monthlyNet >= 0 ? styles.credit : styles.debit}>
              {monthlyNet >= 0 ? '+' : ''}{currency.format(monthlyNet)} projected each month
            </Text>
          </View>

          <View style={styles.actions}>
            <Button title="Add recurring item" onPress={() => navigation.navigate('AddRecurring', {})} />
            <Button title="Planned purchases" onPress={() => navigation.navigate('PurchaseList')} />
            <Button title="Settings" onPress={() => navigation.navigate('Settings')} />
          </View>

          <Text style={styles.label}>Forecast horizon</Text>
          <View style={styles.pickerFrame}>
            <Picker
              selectedValue={horizon.label}
              onValueChange={(label) => {
                const selected = horizonOptions.find((option) => option.label === label);
                if (selected) setHorizon(selected);
              }}
              style={styles.picker}
            >
              {horizonOptions.map((option) => (
                <Picker.Item key={option.label} label={option.label} value={option.label} />
              ))}
            </Picker>
          </View>

          <Text style={styles.sectionTitle}>Balance forecast</Text>
          <ScrollView horizontal contentContainerStyle={styles.chartScroll}>
            <LineChart
              data={chartData}
              width={chartWidth}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </ScrollView>

          <Text style={styles.sectionTitle}>Forecast details</Text>
          {forecast.map((point) => (
            <View key={point.date} style={styles.detailRow}>
              <Text>{format(parseISO(point.date), 'MMM d, yyyy')}</Text>
              <Text style={styles.detailValue}>{currency.format(point.balance)}</Text>
            </View>
          ))}

          <Text style={styles.sectionTitle}>Recurring items</Text>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.empty}>No recurring items yet.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f5f5ef' },
  summaryCard: { padding: 20, marginBottom: 16, borderRadius: 12, backgroundColor: '#ffffff' },
  summaryLabel: { color: '#6b7280', fontSize: 14 },
  balance: { marginVertical: 4, color: '#111827', fontSize: 34, fontWeight: '700' },
  credit: { color: '#166534', fontWeight: '600' },
  debit: { color: '#b91c1c', fontWeight: '600' },
  actions: { gap: 8, marginBottom: 20 },
  label: { marginBottom: 6, color: '#374151', fontSize: 15, fontWeight: '600' },
  pickerFrame: { marginBottom: 20, overflow: 'hidden', borderColor: '#d1d5db', borderWidth: 1, borderRadius: 8, backgroundColor: '#ffffff' },
  picker: { width: '100%' },
  sectionTitle: { marginTop: 18, marginBottom: 8, color: '#111827', fontSize: 20, fontWeight: '700' },
  chartScroll: { paddingRight: 16 },
  chart: { borderRadius: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomColor: '#e5e7eb', borderBottomWidth: 1 },
  detailValue: { fontWeight: '600' },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, marginBottom: 8, borderRadius: 10, backgroundColor: '#ffffff' },
  itemTitle: { color: '#111827', fontSize: 16, fontWeight: '600' },
  itemSchedule: { marginTop: 3, color: '#6b7280', fontSize: 13 },
  empty: { padding: 24, color: '#6b7280', textAlign: 'center' },
});
