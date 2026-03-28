import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { normalize } from '../../utils/orientation';

interface DateHeaderProps {
  date: string;
}

export const DateHeader: React.FC<DateHeaderProps> = ({ date }) => {
  const formatDateHeader = (dateStr: string) => {
    const msgDate = new Date(dateStr);
    const today = new Date();

    if (msgDate.toDateString() === today.toDateString()) return 'Today';

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (msgDate.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return msgDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <Text style={styles.text}>{formatDateHeader(date)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: normalize(12),
  },
  bubble: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(6),
    borderRadius: normalize(16),
  },
  text: {
    fontSize: normalize(12),
    color: '#666',
    fontWeight: '500',
  },
});