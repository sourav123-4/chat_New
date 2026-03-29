import React from 'react';
import { View, StyleSheet } from 'react-native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { normalize } from '../utils/orientation';

interface TickIconProps {
  status: 'sending' | 'sent' | 'delivered' | 'read';
  // light = on dark bubble (my message), dark = on light background (home screen)
  theme?: 'light' | 'dark';
}

export const TickIcon: React.FC<TickIconProps> = ({ status, theme = 'light' }) => {
  if (status === 'sending' || status === 'sent') {
    // Single tick
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

  // Double tick — delivered or read
  const isRead = status === 'read';
  const color = isRead
    ? (theme === 'light' ? '#A5F3FC' : '#6A11CB')
    : (theme === 'light' ? 'rgba(255,255,255,0.75)' : '#9CA3AF');

  return (
    <View style={styles.doubleTick}>
      {/* First tick — slightly behind */}
      <FontAwesome6
        name="check"
        iconStyle="solid"
        size={normalize(11)}
        color={color}
        style={styles.tick1}
      />
      {/* Second tick — overlaps */}
      <FontAwesome6
        name="check"
        iconStyle="solid"
        size={normalize(11)}
        color={color}
        style={styles.tick2}
      />
    </View>
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
