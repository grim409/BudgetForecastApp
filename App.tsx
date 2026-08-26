import { NavigationContainer } from '@react-navigation/native';

import ErrorBoundary from './src/components/ErrorBoundary';
import { BudgetProvider } from './src/context/BudgetContext';
import AppNavigator from './src/navigation';

export default function App() {
  return (
    <ErrorBoundary>
      <BudgetProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </BudgetProvider>
    </ErrorBoundary>
  );
}
