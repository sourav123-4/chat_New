import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { normalize } from '../../utils/orientation';

interface StatusBarProps {
  isTyping: boolean;
  isOnline: boolean;
  lastSeen: string | number | null;
}

const formatLastSeen = (value: string | number) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'offline';
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return `last seen today at ${time}`;
  const day = date.toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  });
  return `last seen ${day} at ${time}`;
};

export const StatusBar: React.FC<StatusBarProps> = ({
  isTyping,
  isOnline,
  lastSeen,
}) => {
  const getStatusText = () => {
    if (isTyping) return 'typing...';
    if (isOnline) return 'online';
    if (lastSeen) {
      return formatLastSeen(lastSeen);
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
