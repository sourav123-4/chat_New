import React, { useRef } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Easing,
  StyleProp,
  ViewStyle,
} from "react-native";
import { normalize } from "../utils/orientation";
import { Fonts } from "../themes";

interface ButtonProps {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: "primary" | "secondary" | "outline";
  disabled?: boolean;
}

export default function Button({
  title,
  onPress,
  style,
  variant = "primary",
  disabled = false,
}: ButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.timing(scale, {
      toValue: 0.96,
      duration: 120,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start();
  };

  const pressOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 120,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        disabled={disabled}
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={onPress}
        style={[
          styles.base,
          variant === "primary" && styles.primary,
          variant === "secondary" && styles.secondary,
          variant === "outline" && styles.outline,
          disabled && styles.disabled,
          style,
        ]}
      >
        <Text
          style={[
            styles.text,
            variant === "outline" && styles.outlineText,
          ]}
        >
          {title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: normalize(12),
    borderRadius: normalize(14),
    alignItems: "center",
    justifyContent: "center",
  },

  /* Variants */
  primary: {
    backgroundColor: "#6A11CB",
  },
  secondary: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#6A11CB",
  },
  disabled: {
    opacity: 0.55,
  },

  text: {
    fontSize: normalize(16),
    fontFamily: Fonts.Inter_Bold,
    color: "#fff",
  },
  outlineText: {
    color: "#6A11CB",
  },
});
