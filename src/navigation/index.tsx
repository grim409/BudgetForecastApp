import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import RecurringItemForm from '../screens/RecurringItemForm';
import { RecurringItem } from '../context/BudgetContext';

export type RootStackParamList = {
  Home: undefined;
  AddRecurring: { item?: RecurringItem };
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
