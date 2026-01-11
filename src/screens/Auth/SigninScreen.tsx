import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  StatusBar,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import Input from "../../components/Input";
import Button from "../../components/Button";
import { normalize } from "../../utils/orientation";
import { Fonts } from "../../themes";
import { show } from "../../components/Toast";
import { validateEmail } from "../../utils/helpers/Validation";
import { useAppDispatch, useAppSelector } from "../../store";
import { signInRequest } from "../../store/slice/auth.slice";
import Loader from "../../utils/helpers/Loader";

import { AuthStackParamList } from "../../types";

type Props = NativeStackScreenProps<AuthStackParamList, "Signin">;

export default function SigninScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { status, loading } = useAppSelector(state => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Optional — react to sign-in result
  // useEffect(() => {
  //   if (status === "auth/signInSuccess") {
  //     navigation.replace("SomeScreenAfterLogin");
  //   }
  // }, [status]);

  const handleLogin = () => {
    show("Checking details...", 1500, "top");

    if (!email) return show("Please Enter the email");
    if (!validateEmail(email.trim()))
      return show("Please Enter a valid email address");
    if (!password) return show("Please Enter Your Password !!!");
    if (password.length < 6)
      return show("Password must be 6 letters or more");

    dispatch(signInRequest({ email: email.trim().toLowerCase(), password }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      <LinearGradient colors={["#6A11CB", "#2575FC"]} style={styles.gradient} />
      <Loader visible={loading} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              styles.wrapper,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text style={styles.title}>Welcome Back</Text>

            <Text style={styles.subtitle}>
              Login to continue your conversation
            </Text>

            <View style={styles.card}>
              <Input
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
              />

              <Input
                placeholder="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                isSecureEntry
              />
              <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <View style={{ marginTop: normalize(18) }}>
                <Button title="Login" onPress={handleLogin} />
              </View>

              <TouchableOpacity
                style={{ marginTop: normalize(18) }}
                onPress={() => navigation.navigate("Signup")}
              >
                <Text style={styles.link}>
                  Don’t have an account?{" "}
                  <Text style={styles.linkHighlight}>Sign up</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  gradient: { ...StyleSheet.absoluteFillObject },

  wrapper: {
    flex: 1,
    justifyContent: "center",
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
    fontSize: normalize(15.5),
    color: "rgba(255,255,255,0.78)",
    textAlign: "center",
    marginTop: normalize(6),
    marginBottom: normalize(22),
  },

  card: {
    borderRadius: normalize(18),
  },

  link: {
    textAlign: "center",
    fontSize: normalize(14),
    color: "rgba(255,255,255,0.9)",
  },

  linkHighlight: {
    color: "#fff",
    fontFamily: Fonts.Inter_SemiBold,
  },

  forgotPasswordText: {
    fontSize: normalize(14),
    color: "#fff",
    fontFamily: Fonts.Inter_SemiBold,
    marginTop: normalize(12),
    textAlign: "right",
    textDecorationLine: "underline",
  },
});
