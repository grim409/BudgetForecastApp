declare module 'victory-native';

declare module '@react-native-async-storage/async-storage' {
  const AsyncStorage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  };
  export default AsyncStorage;
}

declare module '@react-navigation/native' {
  import * as React from 'react';
  export function useNavigation<T = any>(): any;
  export function NavigationContainer(props: { children: React.ReactNode }): JSX.Element;
}

declare module '@react-navigation/native-stack' {
  import * as React from 'react';
  export function createNativeStackNavigator<ParamList = any>(): {
    Navigator: React.ComponentType<any>;
    Screen: React.ComponentType<any>;
  };
}

declare module '@env' {
  export const FIREBASE_API_KEY: string;
  export const FIREBASE_AUTH_DOMAIN: string;
  export const FIREBASE_PROJECT_ID: string;
  export const FIREBASE_STORAGE_BUCKET: string;
  export const FIREBASE_MESSAGING_SENDER_ID: string;
  export const FIREBASE_APP_ID: string;
  export const FIREBASE_MEASUREMENT_ID: string;
}