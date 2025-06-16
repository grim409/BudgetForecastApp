import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useGroup } from '../context/GroupContext';

export default function GroupSetupScreen() {
  const { createGroup, joinGroup } = useGroup();
  const [codeInput, setCodeInput] = useState('');
  const [justCreated, setJustCreated] = useState<string | null>(null);

  const handleCreate = () => {
    const id = createGroup();
    Clipboard.setStringAsync(id);
    setJustCreated(id);
    Alert.alert('Group Code Copied', `Your code:\n${id}`);
  };

  return (
    <View style={styles.container}>
      <Button title="Create New Budget Group" onPress={handleCreate} />

      <Text style={styles.or}>— OR —</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter Group Code"
        value={codeInput}
        onChangeText={setCodeInput}
        autoCapitalize="none"
      />

      <Button
        title="Join Existing Group"
        onPress={() => {
          if (codeInput.trim()) {
            joinGroup(codeInput.trim());
            setJustCreated(null);
          } else {
            Alert.alert('Please enter a valid code');
          }
        }}
      />

      {justCreated && (
        <Text style={styles.notice}>
          Code {justCreated} copied to clipboard. Paste it to your spouse!
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, justifyContent: 'center', padding: 16 },
  or:             { textAlign: 'center', marginVertical: 16 },
  input:          { borderWidth: 1, borderColor: '#999', borderRadius: 4, padding: 8, marginBottom: 12 },
  notice:         { marginTop: 16, textAlign: 'center', color: '#007AFF' },
});
