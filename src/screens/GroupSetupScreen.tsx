import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useGroup } from '../context/GroupContext';

export default function GroupSetupScreen() {
  const { createGroup, joinGroup } = useGroup();
  const [code, setCode] = useState('');
  const [shareCode, setShareCode] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <Button
        title="Create New Budget Group"
        onPress={() => {
          const id = createGroup();
          setShareCode(id);
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
            setShareCode(null);
          } else {
            // You could show an inline error here instead
          }
        }}
      />

      {shareCode && (
        <View style={styles.shareContainer}>
          <Text>Your Group Code:</Text>
          <Text selectable style={styles.shareCode}>
            {shareCode}
          </Text>
          <Button
            title="Copy"
            onPress={() => {
              Clipboard.setStringAsync(shareCode);
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, justifyContent: 'center', padding: 16 },
  or:             { textAlign: 'center', marginVertical: 16 },
  input:          { borderWidth: 1, borderColor: '#999', borderRadius: 4, padding: 8, marginBottom: 12 },
  shareContainer: { marginTop: 24, alignItems: 'center' },
  shareCode:      { fontSize: 16, fontWeight: 'bold', marginVertical: 8 },
});
