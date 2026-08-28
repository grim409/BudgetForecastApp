import { NavigationContainer } from '@react-navigation/native';

import ErrorBoundary from './src/components/ErrorBoundary';
import { AuthProvider } from './src/context/AuthContext';
import { BudgetProvider } from './src/context/BudgetContext';
import AppNavigator from './src/navigation';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BudgetProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </BudgetProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
