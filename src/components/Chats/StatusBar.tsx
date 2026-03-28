import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { normalize } from '../../utils/orientation';

interface StatusBarProps {
  isTyping: boolean;
  isOnline: boolean;
  lastSeen: number | null;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  isTyping,
  isOnline,
  lastSeen,
}) => {
  const getStatusText = () => {
    if (isTyping) return 'typing...';
    if (isOnline) return 'online';
    if (lastSeen) {
      return `last seen ${new Date(lastSeen).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    }
    return 'offline';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{getStatusText()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: normalize(4),
  },
  text: {
    fontSize: normalize(12),
    color: '#6B7280',
    fontStyle: 'italic',
  },
});