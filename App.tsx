import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import { NavigationContainer } from '@react-navigation/native';
import { GroupProvider, useGroup } from './src/context/GroupContext';
import { BudgetProvider } from './src/context/BudgetContext';
import AppNavigator from './src/navigation';
import GroupSetupScreen from './src/screens/GroupSetupScreen';

function Root() {
  const { groupId } = useGroup();
  return (
    <NavigationContainer>
      {groupId ? (
        <BudgetProvider groupId={groupId}>
          <AppNavigator />
        </BudgetProvider>
      ) : (
        <GroupSetupScreen />
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GroupProvider>
      <Root />
    </GroupProvider>
  );
}
