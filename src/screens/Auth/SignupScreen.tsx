import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  StatusBar,
  ScrollView,
  Image,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import ImagePicker from "react-native-image-crop-picker";

import Input from "../../components/Input";
import Button from "../../components/Button";
import { normalize } from "../../utils/orientation";
import { Fonts } from "../../themes";
import { show } from "../../components/Toast";
import { useAppDispatch, useAppSelector } from "../../store";
import { signUpRequest } from "../../store/slice/auth.slice";
import Loader from "../../utils/helpers/Loader";

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../types";

type Props = NativeStackScreenProps<AuthStackParamList, "Signup">;

export default function SignupScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { status, loading } = useAppSelector(state => state.auth);

  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const [photo, setPhoto] = useState<string | null>(null);
  const [showPickerModal, setShowPickerModal] = useState<boolean>(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const pickFromGallery = async () => {
    try {
      const image = await ImagePicker.openPicker({
        width: 400,
        height: 400,
        cropping: true,
        compressImageQuality: 0.7,
      });
      setPhoto(image.path);
    } catch {}
    setShowPickerModal(false);
  };

  const pickFromCamera = async () => {
    try {
      const image = await ImagePicker.openCamera({
        width: 400,
        height: 400,
        cropping: true,
        compressImageQuality: 0.7,
      });
      setPhoto(image.path);
    } catch {}
    setShowPickerModal(false);
  };

  useEffect(() => {
    if (!status) return;

    switch (status) {
      case "auth/signUpSuccess":
        navigation.navigate("Signin");
        break;
      case "auth/signUpFailure":
      default:
        break;
    }
  }, [status, navigation]);

  const handleSignUp = () => {
    if (!name.trim()) return show("Please enter your name");
    if (name.trim().length < 5) return show("Name should be at least 5 characters");

    if (!email.trim()) return show("Please enter an email address");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return show("Please enter a valid email address");

    if (!password || password.length < 6)
      return show("Password must be at least 6 characters");

    if (password !== confirmPassword) return show("Passwords do not match");

    const formData = new FormData();

    formData.append("name", name);
    formData.append("email", email.trim().toLowerCase());
    formData.append("password", password);

    // IMPORTANT: file object (not string)
    if (photo) {
      formData.append("avatar", {
        uri: photo,
        type: "image/jpeg",
        name: "avatar.jpg",
      } as any);
    }

    dispatch(signUpRequest(formData));
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
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <Animated.View
            style={[styles.wrapper, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
          >
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to start your conversation</Text>

            <View style={styles.card}>
              <Input placeholder="Full Name" value={name} onChangeText={setName} />

              <Input
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />

              <Input
                placeholder="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                isSecureEntry
              />

              <Input
                placeholder="Confirm Password"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                isSecureEntry
              />

              <TouchableOpacity style={styles.uploadPhotoContainer} onPress={() => setShowPickerModal(true)}>
                {photo ? (
                  <View style={styles.previewRow}>
                    <Image source={{ uri: photo }} style={styles.previewImage} />
                    <Text style={styles.uploadPhotoChange}>Change Photo</Text>
                  </View>
                ) : (
                  <Text style={styles.uploadPhotoLabel}>+ Upload Profile Photo</Text>
                )}
              </TouchableOpacity>

              <View style={{ marginTop: normalize(18) }}>
                <Button title="Sign Up" onPress={handleSignUp} />
              </View>

              <TouchableOpacity style={{ marginTop: normalize(18) }} onPress={() => navigation.navigate("Signin")}>
                <Text style={styles.link}>
                  Already have an account?
                  <Text style={styles.linkHighlight}> Sign in</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* modal */}
      <Modal
        transparent
        animationType="slide"
        visible={showPickerModal}
        onRequestClose={() => setShowPickerModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Choose option</Text>

            <TouchableOpacity style={styles.modalBtn} onPress={pickFromCamera}>
              <Text style={styles.modalBtnText}>📷  Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalBtn} onPress={pickFromGallery}>
              <Text style={styles.modalBtnText}>🖼️  Choose from Library</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowPickerModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  },

  uploadPhotoContainer: {
    // marginTop: normalize(12),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: normalize(12),
    paddingVertical: normalize(14),
    paddingHorizontal: normalize(12),
  },

  uploadPhotoLabel: {
    textAlign: "center",
    color: "#fff",
    fontFamily: Fonts.Inter_SemiBold,
    fontSize: normalize(14.5),
  },

  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(10),
  },

  previewImage: {
    width: normalize(42),
    height: normalize(42),
    borderRadius: normalize(42),
  },

  uploadPhotoChange: {
    color: "#fff",
    fontFamily: Fonts.Inter_SemiBold,
    fontSize: normalize(14.5),
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
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(35, 31, 31, 0.55)",
  },

  modalBox: {
    width: "82%",
    borderRadius: normalize(18),
    paddingVertical: normalize(18),
    paddingHorizontal: normalize(16),

    // glass effect (same as card)
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",

    ...Platform.select({
      android: { elevation: 10, shadowColor: "#000" },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.18,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
      },
    }),
  },

  modalTitle: {
    textAlign: "center",
    color: "#c02222ff",
    fontFamily: Fonts.Inter_Bold,
    fontSize: normalize(16),
    marginBottom: normalize(14),
  },

  modalBtn: {
    paddingVertical: normalize(10),
    borderBottomWidth: 1,
    borderColor: "rgba(107, 21, 21, 0.18)",
  },

  modalBtnText: {
    textAlign: "center",
    color: "#884646ff",
    fontFamily: Fonts.Inter_SemiBold,
    fontSize: normalize(14.5),
  },

  modalCancel: {
    textAlign: "center",
    marginTop: normalize(12),
    color: "rgba(111, 37, 37, 0.75)",
    fontFamily: Fonts.Inter_SemiBold,
  }

});
