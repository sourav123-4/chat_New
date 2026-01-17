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
import Button from "../../components/Button";
import { normalize } from "../../utils/orientation";
import { Fonts } from "../../themes";
import { show } from "../../components/Toast";
import Loader from "../../utils/helpers/Loader";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  verifyOtpRequest,
  forgotPasswordRequest,
} from "../../store/slice/auth.slice";
import { AuthStackParamList } from "../../types";
import OtpInput from "../../components/OtpInput";

type Props = NativeStackScreenProps<AuthStackParamList, "VerifyOtp">;

export default function VerifyOtpScreen({ navigation, route }: Props) {
  const { email } = route.params;

  const dispatch = useAppDispatch();
  const { loading, status } = useAppSelector(state => state.auth);

  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

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

  // Navigate to ResetPassword on success
  useEffect(() => {
    if (status === "auth/verifyOtpSuccess") {
      setTimeout(() => {
        navigation.navigate("ResetPassword", {
          email,
          otp: otp.trim(),
        });
      }, normalize(500));
    }
  }, [status, navigation, email, otp]);

  // Resend timer
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(t => t - 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  const handleVerifyOtp = () => {
    if (!otp.trim())
      return show("Please enter the OTP", 2000, "top");

    if (otp.trim().length < 4)
      return show("OTP must be at least 4 digits", 2000, "top");

    dispatch(
      verifyOtpRequest({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      })
    );
  };

  const handleResendOtp = () => {
    if (resendTimer > 0) {
      show(`Please wait ${resendTimer}s before resending`, 2000, "top");
      return;
    }

    setOtp("");
    setResendTimer(60);

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
          <Text style={styles.title}>Verify OTP</Text>

          <Text style={styles.subtitle}>
            We've sent an OTP to {email}. Enter it below to verify.
          </Text>

          <View style={styles.card}>
            <Text style={styles.label}>Enter OTP</Text>

            <OtpInput
              length={4}
              value={otp}
              onChange={setOtp}
            />

            <View style={styles.verifyBtnContainer}>
              <Button
                title={loading ? "Verifying..." : "Verify OTP"}
                onPress={handleVerifyOtp}
                disabled={loading}
              />
            </View>

            <TouchableOpacity
              style={styles.resendContainer}
              onPress={handleResendOtp}
              disabled={resendTimer > 0}
            >
              <Text
                style={[
                  styles.resendLink,
                  { opacity: resendTimer > 0 ? 0.5 : 1 },
                ]}
              >
                Didn&apos;t receive OTP?{" "}
                <Text style={styles.resendLinkHighlight}>
                  {resendTimer > 0
                    ? `Resend in ${resendTimer}s`
                    : "Resend"}
                </Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backLinkContainer}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backLink}>Go Back</Text>
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

  verifyBtnContainer: {
    marginTop: normalize(24),
  },

  resendContainer: {
    marginTop: normalize(16),
  },

  resendLink: {
    textAlign: "center",
    fontSize: normalize(13),
    fontFamily: Fonts.Inter_Regular,
    color: "rgba(255,255,255,0.9)",
  },

  resendLinkHighlight: {
    fontFamily: Fonts.Inter_SemiBold,
    color: "#fff",
    textDecorationLine: "underline",
  },

  backLinkContainer: {
    marginTop: normalize(12),
  },

  backLink: {
    textAlign: "center",
    fontSize: normalize(13),
    fontFamily: Fonts.Inter_SemiBold,
    color: "rgba(255,255,255,0.6)",
  },
});
