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
import {
  useBudget,
  RecurringItem,
  OneOffPurchase,
} from '../context/BudgetContext';
import { useNavigation } from '@react-navigation/native';

interface HorizonOption {
  label: string;
  unit: 'day' | 'month';
  count: number;
}

const horizonOptions: HorizonOption[] = [
  { label: '1 Week', unit: 'day',   count: 7  },
  { label: '1 Month', unit: 'day',  count: 30 },
  { label: '3 Months', unit: 'month', count: 3 },
  { label: '6 Months', unit: 'month', count: 6 },
  { label: '12 Months', unit: 'month', count: 12 },
  { label: '24 Months', unit: 'month', count: 24 },
];

function getOccurrences(item: RecurringItem, toDate: Date): number {
  const start = new Date(item.startDate);
  if (toDate < start) return 0;

  switch (item.unit) {
    case 'day': {
      const diffDays = Math.floor(
        (toDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );
      return Math.floor(diffDays / item.interval) + 1;
    }
    case 'week': {
      const diffDays = Math.floor(
        (toDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );
      return Math.floor(diffDays / (7 * item.interval)) + 1;
    }
    case 'month': {
      const years = toDate.getFullYear() - start.getFullYear();
      const months =
        years * 12 + (toDate.getMonth() - start.getMonth());
      return Math.floor(months / item.interval) + 1;
    }
    case 'year': {
      const years = toDate.getFullYear() - start.getFullYear();
      return Math.floor(years / item.interval) + 1;
    }
  }
}

export default function HomeScreen() {
  const { state } = useBudget();
  const navigation = useNavigation<any>();
  const screenWidth = Dimensions.get('window').width;

  const [horizon, setHorizon] = useState<HorizonOption>(
    horizonOptions[1] // default 1 Month
  );

  // Calculate monthly & daily net (for label only)
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

  // 1) Label for today
  const todayLabel = isDaily
    ? `${today.getMonth() + 1}/${today.getDate()}`
    : `${today.getMonth() + 1}/${String(today.getFullYear()).slice(-2)}`;

  // 2) Build future data points
  const futureData = Array.from({ length: steps }).map((_, i) => {
    const date = isDaily
      ? new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() + i + 1
        )
      : new Date(
          today.getFullYear(),
          today.getMonth() + i + 1,
          1
        );

    // sum discrete occurrences
    const recurringSum = state.recurringItems.reduce((acc, item) => {
      const occ = getOccurrences(item, date);
      const sign = item.type === 'credit' ? 1 : -1;
      return acc + occ * item.amount * sign;
    }, 0);

    const purchaseSum = purchases
      .filter((p) => new Date(p.plannedDate) <= date)
      .reduce((acc, p) => acc - p.amount, 0);

    return {
      label: isDaily
        ? `${date.getMonth() + 1}/${date.getDate()}`
        : `${date.getMonth() + 1}/${String(
            date.getFullYear()
          ).slice(-2)}`,
      value: state.startingBalance + recurringSum + purchaseSum,
    };
  });

  // 3) Prepend today's point
  const forecastData = [
    { label: todayLabel, value: state.startingBalance },
    ...futureData,
  ];

  const yData = forecastData.map((p) => p.value);
  const xLabels = forecastData.map((p) => p.label);
  const rawWidth = forecastData.length * POINT_WIDTH;
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

  const renderItem = ({
    item,
  }: ListRenderItemInfo<RecurringItem>) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate('AddRecurring', { item })
      }
    >
      <View style={styles.itemRow}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text>
          {item.type === 'credit' ? '+ ' : '- '}
          ${item.amount.toFixed(2)} every {item.interval}{' '}
          {item.unit}(s)
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={state.recurringItems}
      keyExtractor={(i) => i.id}
      renderItem={renderItem}
      contentContainerStyle={{ padding: 16 }}
      ListHeaderComponent={() => (
        <View>
          {/* Projected Net & Settings */}
          <View style={styles.headerRow}>
            <Text style={styles.projectedLabel}>
              Projected Net
            </Text>
            <Text style={styles.projectedValue}>
              ${(isDaily ? dailyNet : totalMonthly).toFixed(2)}
              {isDaily ? ' /day' : ' /month'}
            </Text>
            <Button
              title="⚙️"
              onPress={() =>
                navigation.navigate('Settings')
              }
            />
          </View>

          <View style={{ height: 16 }} />

          <Button
            title="Add Recurring Item"
            onPress={() =>
              navigation.navigate('AddRecurring', {})
            }
          />
          <View style={{ height: 8 }} />
          <Button
            title="One-Off Purchases"
            onPress={() =>
              navigation.navigate('PurchaseList')
            }
          />

          <View style={{ height: 16 }} />

          {/* Horizon Selector */}
          <Text style={styles.label}>Forecast Horizon</Text>
          <View style={styles.pickerRow}>
            <Picker
              selectedValue={horizon.label}
              onValueChange={(label) => {
                const opt =
                  horizonOptions.find(
                    (o) => o.label === label
                  )!;
                setHorizon(opt);
              }}
              mode="dropdown"
              style={styles.picker}
            >
              {horizonOptions.map((o) => (
                <Picker.Item
                  key={o.label}
                  label={o.label}
                  value={o.label}
                />
              ))}
            </Picker>
          </View>

          {/* Chart */}
          <Text style={styles.chartTitle}>
            Balance Forecast ({horizon.label})
          </Text>
          <ScrollView
            horizontal
            contentContainerStyle={
              styles.chartScroll
            }
          >
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
          <Text style={styles.detailTitle}>
            Forecast Details
          </Text>
          {forecastData.map((p) => (
            <View
              key={p.label}
              style={styles.detailRow}
            >
              <Text style={styles.detailLabel}>
                {p.label}
              </Text>
              <Text style={styles.detailValue}>
                ${p.value.toFixed(2)}
              </Text>
            </View>
          ))}

          {/* Recurring Items Header */}
          <Text style={styles.listTitle}>
            Your Recurring Items
          </Text>
        </View>
      )}
      ListEmptyComponent={
        <Text style={styles.emptyText}>
          No items yet.
        </Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  // Header row
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  projectedLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  projectedValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },

  // Picker
  label: { fontSize: 16, marginBottom: 4 },
  pickerRow: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 4,
    marginBottom: 16,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  picker: { width: '100%', color: '#000' },

  // Chart
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  chartScroll: { paddingRight: 16, marginBottom: 16 },
  chartStyle: { borderRadius: 8 },

  // Details
  detailTitle: {
    fontSize: 18,
    fontWeight: '600',
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

  // Recurring items
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
