import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import RecurringItemForm from '../screens/RecurringItemForm';
import PurchaseListScreen from '../screens/PurchaseListScreen';
import PurchaseFormScreen from '../screens/PurchaseFormScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SignInScreen from '../screens/SignInScreen';
import { RecurringItem, OneOffPurchase } from '../context/BudgetContext';

export type RootStackParamList = {
  Home: undefined;
  AddRecurring: { item?: RecurringItem };
  PurchaseList: undefined;
  AddPurchase: { item?: OneOffPurchase };
  Settings: undefined;
  SignIn: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
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
          title: route.params?.item
            ? 'Edit Recurring Item'
            : 'Add Recurring Item',
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
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Stack.Screen
        name="SignIn"
        component={SignInScreen}
        options={{ title: 'Account' }}
      />
    </Stack.Navigator>
  );
}
