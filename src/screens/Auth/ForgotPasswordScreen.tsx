import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import Input from "../../components/Input";
import Button from "../../components/Button";
import { normalize } from "../../utils/orientation";
import { Fonts } from "../../themes";
import { show } from "../../components/Toast";
import { validateEmail } from "../../utils/helpers/Validation";
import Loader from "../../utils/helpers/Loader";
import { useAppDispatch, useAppSelector } from "../../store";
import { forgotPasswordRequest } from "../../store/slice/auth.slice";
import { AuthStackParamList } from "../../types";

type Props = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { loading, status } = useAppSelector(state => state.auth);

  const [email, setEmail] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: normalize(600),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: normalize(600),
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Navigate to VerifyOtp on success
  useEffect(() => {
    if (status === "auth/forgotPasswordSuccess") {
      setTimeout(() => {
        navigation.navigate("VerifyOtp", { email: email.trim() });
      }, normalize(500));
    }
  }, [status, navigation, email]);

  const handleSendOtp = () => {
    if (!email) return show("Please enter your email", 2000, "top");
    if (!validateEmail(email.trim()))
      return show("Please enter a valid email address", 2000, "top");

    dispatch(
      forgotPasswordRequest({
        email: email.trim().toLowerCase(),
      })
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      <LinearGradient
        colors={["#6A11CB", "#2575FC"]}
        style={styles.gradient}
      />

      <Loader visible={loading} />

      <KeyboardAwareScrollView
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View
          style={[
            styles.wrapper,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.title}>Forgot Password?</Text>

          <Text style={styles.subtitle}>
            Enter your email address and we'll send you an OTP to reset your password
          </Text>

          <View style={styles.card}>
            <Text style={styles.label}>Email Address</Text>

            <Input
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />

            <View style={styles.sendOtpBtnContainer}>
              <Button
                title={loading ? "Sending OTP..." : "Send OTP"}
                onPress={handleSendOtp}
                disabled={loading}
              />
            </View>

            <TouchableOpacity
              style={styles.backLinkContainer}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backLink}>
                Remember your password?{" "}
                <Text style={styles.backLinkHighlight}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  gradient: {
    ...StyleSheet.absoluteFillObject,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },

  wrapper: {
    paddingHorizontal: normalize(26),
    paddingBottom: normalize(20),
  },

  title: {
    fontSize: normalize(32),
    fontFamily: Fonts.Inter_Bold,
    color: "#fff",
    textAlign: "center",
  },

  subtitle: {
    fontSize: normalize(14),
    fontFamily: Fonts.Inter_Regular,
    color: "rgba(255,255,255,0.78)",
    textAlign: "center",
    marginTop: normalize(8),
    marginBottom: normalize(24),
    lineHeight: normalize(20),
  },

  card: {},

  label: {
    fontSize: normalize(12),
    fontFamily: Fonts.Inter_SemiBold,
    color: "rgba(255,255,255,0.7)",
    marginBottom: normalize(8),
    textTransform: "uppercase",
    letterSpacing: normalize(0.5),
  },

  sendOtpBtnContainer: {
    marginTop: normalize(24),
  },

  backLinkContainer: {
    marginTop: normalize(16),
  },

  backLink: {
    textAlign: "center",
    fontSize: normalize(14),
    fontFamily: Fonts.Inter_Regular,
    color: "rgba(255,255,255,0.9)",
  },

  backLinkHighlight: {
    fontFamily: Fonts.Inter_SemiBold,
    color: "#fff",
  },
});
