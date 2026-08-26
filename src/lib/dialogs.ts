import { Alert, Platform } from 'react-native';

// React Native Web implements Alert.alert as a no-op, so every message and
// destructive confirmation silently disappears in the browser build. Route
// through the DOM dialogs on web and keep the native Alert everywhere else.

export function notify(message: string, title = 'Budget Forecast') {
  if (Platform.OS === 'web') {
    window.alert(message);
    return;
  }
  Alert.alert(title, message);
}

export function confirmDestructive(
  title: string,
  message: string,
  confirmLabel: string,
  onConfirm: () => void,
) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }

  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}
