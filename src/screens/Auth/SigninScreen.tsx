import React, { useState, useEffect, useRef } from "react";
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
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import Input from "../../components/Input";
import Button from "../../components/Button";
import { normalize } from "../../utils/orientation";
import { Fonts } from "../../themes";
import { show } from "../../components/Toast";
import { validateEmail } from "../../utils/helpers/Validation";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  signInRequest,
  googleSignInRequest,
} from "../../store/slice/auth.slice";
import Loader from "../../utils/helpers/Loader";
import { signInWithGoogle } from "../../utils/googleSignIn";
import { AuthStackParamList } from "../../types";
import FontAwesome6 from "@react-native-vector-icons/fontawesome6";

type Props = NativeStackScreenProps<AuthStackParamList, "Signin">;

export default function SigninScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector(state => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

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

  const handleLogin = () => {
    if (!email) return show("Please Enter the email");
    if (!validateEmail(email.trim()))
      return show("Please Enter a valid email address");
    if (!password) return show("Please Enter Your Password !!!");
    if (password.length < 6)
      return show("Password must be 6 letters or more");
    dispatch(
      signInRequest({
        email: email.trim().toLowerCase(),
        password,
      })
    );
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      show("Signing in with Google...", 1500, "top");
      const result = await signInWithGoogle();
      if (result.success) {
        dispatch(
          googleSignInRequest({
            token: result.data?.data?.idToken,
          })
        );
      } else {
        show(result.message || "Google Sign-In failed");
        setGoogleLoading(false);
      }
    } catch (error: any) {
      show(error.message || "Google Sign-In failed");
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />
      <LinearGradient
        colors={["#6A11CB", "#2575FC"]}
        style={styles.gradient}
      />
      <Loader visible={loading || googleLoading} />
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
            {/* Forgot Password (text-only clickable) */}
            <View style={styles.forgotPasswordContainer}>
              <TouchableOpacity
                onPress={() => navigation.navigate("ForgotPassword")}
                activeOpacity={0.7}
                hitSlop={{
                  top: normalize(4),
                  bottom: normalize(4),
                  left: normalize(4),
                  right: normalize(4),
                }}
              >
                <Text style={styles.forgotPasswordText}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.loginBtnContainer}>
              <Button title="Login" onPress={handleLogin} />
            </View>
            {/* OR Divider */}
            <View style={styles.orContainer}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.orLine} />
            </View>
            {/* Google Sign-In */}
            <TouchableOpacity
              style={styles.googleSignInBtn}
              onPress={handleGoogleSignIn}
              disabled={loading || googleLoading}
            >
              <FontAwesome6
                name="google"
                iconStyle="brand"
                size={normalize(18)}
                color="#fff"
              />
              <Text style={styles.googleSignInText}>
                Sign In with Google
              </Text>
            </TouchableOpacity>

            {/* Signup */}
            <TouchableOpacity
              style={styles.signupContainer}
              onPress={() => navigation.navigate("Signup")}
            >
              <Text style={styles.link}>
                Don&apos;t have an account?{" "}
                <Text style={styles.linkHighlight}>Sign up</Text>
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
    fontSize: normalize(15.5),
    fontFamily: Fonts.Inter_Regular,
    color: "rgba(255,255,255,0.78)",
    textAlign: "center",
    marginTop: normalize(6),
    marginBottom: normalize(22),
  },
  card: {
    borderRadius: normalize(18),
  },
  forgotPasswordContainer: {
    alignItems: "flex-end",
    marginTop: normalize(12),
  },
  forgotPasswordText: {
    fontSize: normalize(14),
    fontFamily: Fonts.Inter_SemiBold,
    color: "#fff",
    textDecorationLine: "underline",
  },
  loginBtnContainer: {
    marginTop: normalize(18),
  },
  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: normalize(18),
  },
  orLine: {
    flex: 1,
    height: normalize(1),
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  orText: {
    fontSize: normalize(14),
    fontFamily: Fonts.Inter_SemiBold,
    color: "rgba(255,255,255,0.7)",
    marginHorizontal: normalize(10),
  },
  googleSignInBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DB4437",
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
    marginTop: normalize(16),
    gap: normalize(8),
  },
  googleSignInText: {
    fontSize: normalize(16),
    fontFamily: Fonts.Inter_SemiBold,
    color: "#fff",
  },
  signupContainer: {
    marginTop: normalize(18),
  },
  link: {
    textAlign: "center",
    fontSize: normalize(14),
    fontFamily: Fonts.Inter_Regular,
    color: "rgba(255,255,255,0.9)",
  },
  linkHighlight: {
    fontFamily: Fonts.Inter_SemiBold,
    color: "#fff",
  },
});
