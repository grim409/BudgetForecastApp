import 'react-native-gesture-handler';
import React from 'react';
import { BudgetProvider } from './src/context/BudgetContext';
import AppNavigator from './src/navigation';
import 'react-native-get-random-values';

export default function App() {
  return (
    <BudgetProvider>
      <AppNavigator />
    </BudgetProvider>
  );
}
