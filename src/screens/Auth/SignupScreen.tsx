import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  StatusBar,
  Image,
  Modal,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import ImagePicker from "react-native-image-crop-picker";
import FontAwesome6 from "@react-native-vector-icons/fontawesome6";

import Input from "../../components/Input";
import Button from "../../components/Button";
import { normalize } from "../../utils/orientation";
import { Fonts } from "../../themes";
import { show } from "../../components/Toast";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  signUpRequest,
  googleSignInRequest,
} from "../../store/slice/auth.slice";
import Loader from "../../utils/helpers/Loader";
import { signInWithGoogle } from "../../utils/googleSignIn";

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../types";

type Props = NativeStackScreenProps<AuthStackParamList, "Signup">;

export default function SignupScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { status, loading } = useAppSelector(state => state.auth);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [photo, setPhoto] = useState<string | null>(null);
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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
    if (status === "auth/signUpSuccess") {
      navigation.navigate("Signin");
    }
  }, [status, navigation]);

  const handleSignUp = () => {
    if (!name.trim()) return show("Please enter your name");
    if (name.trim().length < 5)
      return show("Name should be at least 5 characters");

    if (!email.trim()) return show("Please enter an email address");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim()))
      return show("Please enter a valid email address");

    if (!password || password.length < 6)
      return show("Password must be at least 6 characters");

    if (password !== confirmPassword)
      return show("Passwords do not match");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email.trim().toLowerCase());
    formData.append("password", password);

    if (photo) {
      formData.append("avatar", {
        uri: photo,
        type: "image/jpeg",
        name: "avatar.jpg",
      } as any);
    }

    dispatch(signUpRequest(formData));
  };

  const handleGoogleSignUp = async () => {
    try {
      setGoogleLoading(true);
      show("Signing up with Google...", 1500, "top");

      const result = await signInWithGoogle();

      if (result.success) {
        dispatch(
          googleSignInRequest({
            token: result.data?.data?.idToken,
          })
        );
      } else {
        show(result.message || "Google Sign-Up failed");
        setGoogleLoading(false);
      }
    } catch (error: any) {
      show(error.message || "Google Sign-Up failed");
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Sign up to start your conversation
          </Text>

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

            <TouchableOpacity
              style={styles.uploadPhotoContainer}
              onPress={() => setShowPickerModal(true)}
            >
              {photo ? (
                <View style={styles.previewRow}>
                  <Image source={{ uri: photo }} style={styles.previewImage} />
                  <Text style={styles.uploadPhotoChange}>Change Photo</Text>
                </View>
              ) : (
                <Text style={styles.uploadPhotoLabel}>
                  + Upload Profile Photo
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.signupBtnContainer}>
              <Button title="Sign Up" onPress={handleSignUp} />
            </View>

            <View style={styles.orContainer}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.orLine} />
            </View>

            <TouchableOpacity
              style={styles.googleSignInBtn}
              onPress={handleGoogleSignUp}
              disabled={loading || googleLoading}
            >
              <FontAwesome6
                name="google"
                iconStyle="brand"
                size={normalize(18)}
                color="#fff"
              />
              <Text style={styles.googleSignInText}>
                Sign Up with Google
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signinLinkContainer}
              onPress={() => navigation.navigate("Signin")}
            >
              <Text style={styles.link}>
                Already have an account?
                <Text style={styles.linkHighlight}> Sign in</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAwareScrollView>

      {/* Image Picker Modal */}
      <Modal transparent visible={showPickerModal} animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Choose option</Text>

            <TouchableOpacity style={styles.modalBtn} onPress={pickFromCamera}>
              <Text style={styles.modalBtnText}>📷 Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalBtn} onPress={pickFromGallery}>
              <Text style={styles.modalBtnText}>🖼️ Choose from Library</Text>
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

  card: {},

  uploadPhotoContainer: {
    borderWidth: normalize(1),
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

  signupBtnContainer: {
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
    gap: normalize(8),
  },

  googleSignInText: {
    fontSize: normalize(16),
    fontFamily: Fonts.Inter_SemiBold,
    color: "#fff",
  },

  signinLinkContainer: {
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
    backgroundColor: "#fff",
    borderWidth: normalize(1),
    borderColor: "rgba(255,255,255,0.25)",
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
    borderBottomWidth: normalize(1),
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
  },
});
