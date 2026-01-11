import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import React, { FC, useEffect, useRef } from 'react';
import { normalize } from '../orientation';
import { Colors, Fonts, Icons } from '@app/themes';

type FooterLoaderProps = {
  visible: boolean;
  title?: string;
};

const FooterLoader: FC<FooterLoaderProps> = ({
  title = 'Loading',
  visible,
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const animation = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (visible) {
      startAnimation();
    } else {
      stopAnimation();
    }

    return () => {
      stopAnimation();
    };
  }, [visible]);

  const startAnimation = () => {
    stopAnimation(); // Stop any existing animation first
    
    animation.current = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.current.start();
  };

  const stopAnimation = () => {
    if (animation.current) {
      animation.current.stop();
      animation.current = null;
    }
    spinValue.setValue(0); // Reset rotation
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) return null;

  return (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingText}>{title}</Text>
      <Animated.Image
        source={Icons.app_badging}
        style={[styles.loadingImage, { transform: [{ rotate: spin }] }]}
      />
    </View>
  );
};

export default FooterLoader;

const styles = StyleSheet.create({
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: normalize(15),
  },
  loadingText: {
    color: Colors.night_blue,
    fontSize: normalize(11),
    fontFamily: Fonts.Inter_Regular,
    marginRight: normalize(6), // Added margin to separate text and spinner
  },
  loadingImage: {
    width: normalize(15),
    height: normalize(15),
  },
});