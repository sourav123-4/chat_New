import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { normalize } from '../../utils/orientation';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onImagePress: () => void;
  onVideoPress: () => void;
  replyTo?: { _id: string; text?: string; messageType?: string; senderId?: any } | null;
  onCancelReply?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChangeText,
  onSend,
  onImagePress,
  onVideoPress,
  replyTo,
  onCancelReply,
}) => {
  const replyText = replyTo?.text
    || (replyTo?.messageType === 'image' ? '📷 Photo'
    : replyTo?.messageType === 'video' ? '🎥 Video'
    : replyTo?.messageType === 'call' ? '📞 Call'
    : '...');

  const replySender = typeof replyTo?.senderId === 'object'
    ? replyTo.senderId?.name
    : 'Message';

  return (
    <View style={styles.wrapper}>
      {/* Reply preview */}
      {replyTo && (
        <View style={styles.replyBar}>
          <View style={styles.replyAccent} />
          <View style={styles.replyContent}>
            <Text style={styles.replyName} numberOfLines={1}>{replySender}</Text>
            <Text style={styles.replyText} numberOfLines={1}>{replyText}</Text>
          </View>
          <TouchableOpacity onPress={onCancelReply} style={styles.replyClose}>
            <FontAwesome6 name="xmark" iconStyle="solid" size={normalize(14)} color="#888" />
          </TouchableOpacity>
        </View>
      )}

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
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  replyBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: normalize(12), paddingVertical: normalize(8),
    backgroundColor: '#F8F4FF',
  },
  replyAccent: { width: 3, borderRadius: 2, backgroundColor: '#6A11CB', alignSelf: 'stretch', marginRight: normalize(8) },
  replyContent: { flex: 1 },
  replyName: { fontSize: normalize(12), fontWeight: '700', color: '#6A11CB', marginBottom: 2 },
  replyText: { fontSize: normalize(12), color: '#555' },
  replyClose: { padding: normalize(4) },
  container: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: normalize(10), paddingVertical: normalize(8),
  },
  iconBtn: { padding: normalize(6), marginRight: normalize(2) },
  input: {
    flex: 1, minHeight: normalize(40), maxHeight: normalize(120),
    backgroundColor: '#F5F5F5', borderRadius: normalize(20),
    paddingHorizontal: normalize(14), paddingVertical: normalize(8),
    fontSize: normalize(15), color: '#111',
    marginHorizontal: normalize(6),
  },
  sendBtn: {
    width: normalize(40), height: normalize(40), borderRadius: normalize(20),
    backgroundColor: '#6A11CB', justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#C4B5FD' },
});
