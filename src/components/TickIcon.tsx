import React from 'react';
import { View, StyleSheet } from 'react-native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { normalize } from '../utils/orientation';

interface TickIconProps {
  status: string | undefined;
  theme?: 'light' | 'dark';
}

export const TickIcon: React.FC<TickIconProps> = ({ status, theme = 'light' }) => {
  if (!status || status === 'sending' || status === 'sent') {
    const color = theme === 'light' ? 'rgba(255,255,255,0.6)' : '#9CA3AF';
    return (
      <FontAwesome6
        name="check"
        iconStyle="solid"
        size={normalize(11)}
        color={color}
      />
    );
  }

  if (status === 'delivered' || status === 'read') {
    const isRead = status === 'read';
    const color = isRead
      ? (theme === 'light' ? '#A5F3FC' : '#6A11CB')
      : (theme === 'light' ? 'rgba(255,255,255,0.75)' : '#9CA3AF');

    return (
      <View style={styles.doubleTick}>
        <FontAwesome6
          name="check"
          iconStyle="solid"
          size={normalize(11)}
          color={color}
          style={styles.tick1}
        />
        <FontAwesome6
          name="check"
          iconStyle="solid"
          size={normalize(11)}
          color={color}
          style={styles.tick2}
        />
      </View>
    );
  }

  // Unknown status — show single grey tick
  const color = theme === 'light' ? 'rgba(255,255,255,0.6)' : '#9CA3AF';
  return (
    <FontAwesome6
      name="check"
      iconStyle="solid"
      size={normalize(11)}
      color={color}
    />
  );
};

const styles = StyleSheet.create({
  doubleTick: {
    flexDirection: 'row',
    alignItems: 'center',
    width: normalize(18),
  },
  tick1: {
    position: 'absolute',
    left: 0,
  },
  tick2: {
    position: 'absolute',
    left: normalize(6),
  },
});
