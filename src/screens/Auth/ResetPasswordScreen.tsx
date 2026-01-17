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
import Loader from "../../utils/helpers/Loader";
import { useAppDispatch, useAppSelector } from "../../store";
import { resetPasswordRequest } from "../../store/slice/auth.slice";
import { AuthStackParamList } from "../../types";

type Props = NativeStackScreenProps<AuthStackParamList, "ResetPassword">;

export default function ResetPasswordScreen({ navigation, route }: Props) {
  const { email, otp } = route.params;

  const dispatch = useAppDispatch();
  const { loading, status } = useAppSelector(state => state.auth);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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

  // Navigate to Signin on success
  useEffect(() => {
    if (status === "auth/resetPasswordSuccess") {
      setTimeout(() => {
        navigation.navigate("Signin");
      }, normalize(500));
    }
  }, [status, navigation]);

  const handleResetPassword = () => {
    if (!newPassword || !confirmPassword)
      return show("Please enter both passwords", 2000, "top");

    if (newPassword.length < 6)
      return show("Password must be at least 6 characters", 2000, "top");

    if (newPassword !== confirmPassword)
      return show("Passwords do not match", 2000, "top");

    dispatch(
      resetPasswordRequest({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword: newPassword.trim(),
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
          <Text style={styles.title}>Reset Password</Text>

          <Text style={styles.subtitle}>
            Enter your new password below to reset your account
          </Text>

          <View style={styles.card}>
            <Text style={styles.label}>New Password</Text>
            <Input
              placeholder="Enter new password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              isSecureEntry
            />

            <Text style={[styles.label, styles.confirmLabel]}>
              Confirm Password
            </Text>
            <Input
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              isSecureEntry
            />

            <View style={styles.resetBtnContainer}>
              <Button
                title={loading ? "Resetting..." : "Reset Password"}
                onPress={handleResetPassword}
                disabled={loading}
              />
            </View>

            <TouchableOpacity
              style={styles.backLinkContainer}
              onPress={() => navigation.navigate("Signin")}
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

  confirmLabel: {
    marginTop: normalize(16),
  },

  resetBtnContainer: {
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
