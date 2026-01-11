import React, { useState } from "react";
import {
  TextInput,
  StyleSheet,
  View,
  Platform,
  TouchableOpacity,
  Text,
} from "react-native";
import { normalize } from "../utils/orientation";
import { Fonts } from "../themes";

export default function Input({ ...props }) {
  const [secure, setSecure] = useState(props.isSecureEntry);

  return (
    <View style={styles.inputContainer}>
      <TextInput
        {...props}
        style={styles.input}
        secureTextEntry={secure}
        placeholderTextColor="rgba(255, 255, 255, 0.6)"
      />

      {props.isSecureEntry && (
        <TouchableOpacity
          style={styles.eyeBtn}
          onPress={() => setSecure(!secure)}
        >
          <Text style={styles.eyeText}>
            {secure ? "👁️" : "🙈"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    width: "100%",
    marginBottom: normalize(15),

    paddingHorizontal: normalize(14),
    paddingVertical: Platform.OS === "android" ? normalize(2) : normalize(10),

    borderRadius: normalize(14),
    backgroundColor: "rgba(255, 255, 255, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.22)",

    flexDirection: "row",
    alignItems: "center",
  },

  input: {
    flex: 1,
    color: "#fff",
    fontSize: normalize(15),
    fontFamily: Fonts.Inter_Medium,
    paddingVertical: Platform.OS === "android" ? normalize(10) : 0,
  },

  eyeBtn: {
    paddingHorizontal: normalize(6),
    paddingVertical: normalize(4),
  },

  eyeText: {
    fontSize: normalize(16),
  },
});
