import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { normalize } from '../../utils/orientation';
import { Colors } from '../../themes';

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onImagePress: () => void;
  onVideoPress: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChangeText,
  onSend,
  onImagePress,
  onVideoPress,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onImagePress}>
        <Text style={styles.icon}>📷</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onVideoPress}>
        <Text style={styles.icon}>🎥</Text>
      </TouchableOpacity>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Type a message"
        style={styles.input}
        placeholderTextColor={Colors.gray}
        multiline
        maxLength={1000}
      />

      <TouchableOpacity onPress={onSend} style={styles.sendBtn}>
        <Text style={styles.sendText}>Send</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: normalize(12),
    backgroundColor: '#fff',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: normalize(8),
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 24,
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(10),
    fontSize: normalize(14),
    color: '#111',
    backgroundColor: '#f9f9f9',
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: '#6A11CB',
    paddingHorizontal: normalize(20),
    paddingVertical: normalize(10),
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6A11CB',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sendText: {
    color: '#fff',
    fontWeight: '600',
  },
  icon: {
    fontSize: normalize(24),
  },
});