import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import RecurringItemForm from '../screens/RecurringItemForm';
import { RecurringItem } from '../context/BudgetContext';
import PurchaseListScreen from '../screens/PurchaseListScreen';
import PurchaseFormScreen from '../screens/PurchaseFormScreen';
import { OneOffPurchase } from '../context/BudgetContext';

export type RootStackParamList = {
  Home: undefined;
  AddRecurring: { item?: RecurringItem };
  PurchaseList: undefined;
  AddPurchase: { item?: OneOffPurchase };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home"
          component={HomeScreen}
          options={{ title: 'Budget Forecast' }}
        />
        <Stack.Screen
          name="AddRecurring"
          component={RecurringItemForm}
          options={({ route }) => ({
            title: route.params?.item ? 'Edit Recurring Item' : 'Add Recurring Item',
          })}
        />
        <Stack.Screen
          name="PurchaseList"
          component={PurchaseListScreen}
          options={{ title: 'One-Off Purchases' }}
        />
        <Stack.Screen
          name="AddPurchase"
          component={PurchaseFormScreen}
          options={({ route }) => ({
            title: route.params?.item ? 'Edit Purchase' : 'Add Purchase',
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
