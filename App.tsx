import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { BudgetProvider } from './src/context/BudgetContext';
import AppNavigator  from './src/navigation';

export default function App() {
  return (
    <BudgetProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </BudgetProvider>
  );
}
