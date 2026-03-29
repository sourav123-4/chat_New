import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { normalize } from '../../utils/orientation';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

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
      <TouchableOpacity onPress={onImagePress} style={styles.iconBtn}>
        <FontAwesome6 name="image" iconStyle="solid" size={normalize(20)} color="#6A11CB" />
      </TouchableOpacity>

      <TouchableOpacity onPress={onVideoPress} style={styles.iconBtn}>
        <FontAwesome6 name="video" iconStyle="solid" size={normalize(20)} color="#6A11CB" />
      </TouchableOpacity>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Type a message..."
        style={styles.input}
        placeholderTextColor="#aaa"
        multiline
        maxLength={1000}
      />

      <TouchableOpacity
        onPress={onSend}
        style={[styles.sendBtn, !value.trim() && styles.sendBtnDisabled]}
        disabled={!value.trim()}
      >
        <FontAwesome6 name="paper-plane" iconStyle="solid" size={normalize(16)} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(8),
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: normalize(6),
  },
  iconBtn: {
    width: normalize(36),
    height: normalize(36),
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: normalize(22),
    paddingHorizontal: normalize(14),
    paddingVertical: normalize(8),
    fontSize: normalize(14),
    color: '#111',
    backgroundColor: '#F8F9FA',
    maxHeight: normalize(100),
  },
  sendBtn: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    backgroundColor: '#6A11CB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6A11CB',
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sendBtnDisabled: {
    backgroundColor: '#C4B5FD',
    shadowOpacity: 0,
    elevation: 0,
  },
});
