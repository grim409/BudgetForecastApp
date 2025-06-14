import React from 'react';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { BudgetProvider } from './src/context/BudgetContext';
import AppNavigator from './src/navigation';
import AuthNavigator from './src/navigation/AuthNavigator';

function Root() {
  const { user, loading } = useAuth();
  if (loading) {
    return null;
  }
  return user ? (
    <BudgetProvider>
      <AppNavigator />
    </BudgetProvider>
  ) : (
    <AuthNavigator />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}
