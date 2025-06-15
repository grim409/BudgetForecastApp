// declarations.d.ts

// 1) Stub out victory-native (no types shipped)
declare module 'victory-native';

// 2) Minimal AsyncStorage definition
declare module '@react-native-async-storage/async-storage' {
  const AsyncStorage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  };
  export default AsyncStorage;
}

// 3) Minimal React Navigation shims
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
