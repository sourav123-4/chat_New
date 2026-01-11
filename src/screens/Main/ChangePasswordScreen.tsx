import React, { useRef, useEffect, useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import Input from "../../components/Input";
import Button from "../../components/Button";
import { normalize } from "../../utils/orientation";
import { Fonts } from "../../themes";
import { show } from "../../components/Toast";
import { validatePassword } from "../../utils/helpers/Validation";
import { AppStackParamList } from "../../types";
import Loader from "../../utils/helpers/Loader";
import { useAppDispatch, useAppSelector } from "../../store";
import { changePasswordRequest } from "../../store/slice/auth.slice";

type Props = NativeStackScreenProps<AppStackParamList, "ChangePassword">;

export default function ChangePasswordScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { loading, status } = useAppSelector(state => state.auth);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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

  // Navigate back to Profile on success
  useEffect(() => {
    if (status === "auth/changePasswordSuccess") {
      setTimeout(() => {
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        navigation.goBack();
      }, 500);
    }
  }, [status, navigation]);

  const handleChangePassword = () => {
    if (!oldPassword) {
      show("Please enter your current password", 2000, "top");
      return;
    }

    if (!newPassword) {
      show("Please enter your new password", 2000, "top");
      return;
    }

    if (newPassword.length < 6) {
      show("New password must be at least 6 characters", 2000, "top");
      return;
    }

    if (newPassword === oldPassword) {
      show("New password must be different from current password", 2000, "top");
      return;
    }

    if (newPassword !== confirmPassword) {
      show("Passwords do not match", 2000, "top");
      return;
    }

    dispatch(changePasswordRequest({
      oldPassword: oldPassword.trim(),
      newPassword: newPassword.trim(),
    }));
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
            <Text style={styles.title}>Change Password</Text>

            <Text style={styles.subtitle}>
              Update your account password to keep your account secure
            </Text>

            <View style={styles.card}>
              <Text style={styles.label}>Current Password</Text>
              <Input
                placeholder="Enter current password"
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry
                isSecureEntry
              />

              <Text style={[styles.label, { marginTop: normalize(16) }]}>
                New Password
              </Text>
              <Input
                placeholder="Enter new password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                isSecureEntry
              />

              <Text style={[styles.label, { marginTop: normalize(16) }]}>
                Confirm Password
              </Text>
              <Input
                placeholder="Confirm new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                isSecureEntry
              />

              <View style={{ marginTop: normalize(24) }}>
                <Button
                  title={loading ? "Changing..." : "Change Password"}
                  onPress={handleChangePassword}
                />
              </View>

              <TouchableOpacity
                style={{ marginTop: normalize(16) }}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.backLink}>
                  Back to <Text style={styles.backLinkHighlight}>Profile</Text>
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
    fontSize: normalize(14),
    color: "rgba(255,255,255,0.78)",
    textAlign: "center",
    marginTop: normalize(8),
    marginBottom: normalize(24),
    lineHeight: 20,
  },

  card: {
    borderRadius: normalize(18),
  },

  label: {
    fontSize: normalize(12),
    color: "rgba(255,255,255,0.7)",
    fontFamily: Fonts.Inter_SemiBold,
    marginBottom: normalize(8),
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  backLink: {
    textAlign: "center",
    fontSize: normalize(13),
    color: "rgba(255,255,255,0.6)",
    fontFamily: Fonts.Inter_SemiBold,
  },

  backLinkHighlight: {
    color: "#fff",
    textDecorationLine: "underline",
  },
});
