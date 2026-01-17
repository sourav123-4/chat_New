import React, { useRef } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { normalize } from "../utils/orientation";
import { Fonts } from "../themes";

type Props = {
  length?: number;
  value: string;
  onChange: (otp: string) => void;
};

export default function OtpInput({
  length = 4,
  value,
  onChange,
}: Props) {
  const inputs = useRef<TextInput[]>([]);

  const handleChange = (text: string, index: number) => {
    const newValue = value.split("");
    newValue[index] = text.replace(/[^0-9]/g, "");
    const otp = newValue.join("").slice(0, length);

    onChange(otp);

    if (text && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (index: number) => {
    if (!value[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      {Array.from({ length }).map((_, index) => (
        <TextInput
          key={index}
          ref={ref => {
            if (ref) inputs.current[index] = ref;
          }}
          style={styles.box}
          keyboardType="number-pad"
          maxLength={1}
          value={value[index] || ""}
          onChangeText={text => handleChange(text, index)}
          onKeyPress={({ nativeEvent }) =>
            nativeEvent.key === "Backspace" && handleBackspace(index)
          }
          autoFocus={index === 0}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: normalize(12),
  },

  box: {
    width: normalize(52),
    height: normalize(56),
    borderRadius: normalize(12),
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: normalize(1),
    borderColor: "rgba(255,255,255,0.3)",
    textAlign: "center",
    fontSize: normalize(20),
    fontFamily: Fonts.Inter_Bold,
    color: "#fff",
  },
});
