import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useGroup } from '../context/GroupContext';

export default function GroupSetupScreen() {
  const { createGroup, joinGroup } = useGroup();
  const [code, setCode] = useState('');

  return (
    <View style={styles.container}>
      <Button
        title="Create New Budget Group"
        onPress={() => {
          const id = createGroup();
          Alert.alert('Your Group Code', id);
        }}
      />
      <Text style={styles.or}>— OR —</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Group Code"
        value={code}
        onChangeText={setCode}
        autoCapitalize="none"
      />
      <Button
        title="Join Existing Group"
        onPress={() => {
          if (code.trim()) {
            joinGroup(code.trim());
          } else {
            Alert.alert('Please enter a valid code');
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16 },
  or:        { textAlign: 'center', marginVertical: 16 },
  input:     { borderWidth: 1, borderColor: '#999', borderRadius: 4, padding: 8, marginBottom: 12 },
});
