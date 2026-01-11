import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from "react-native";
import { useAppDispatch, useAppSelector } from "../../store";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AppStackParamList } from "../../types";
import { updateProfileRequest } from "../../store/slice/user.slice";
import { show } from "../../components/Toast";
import LinearGradient from "react-native-linear-gradient";
import Header from "../../components/Header";
import Input from "../../components/Input";
import Button from "../../components/Button";
import Loader from "../../utils/helpers/Loader";
import { normalize } from "../../utils/orientation";
import ImagePicker from "react-native-image-crop-picker";
import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { Colors } from "../../themes";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = NativeStackScreenProps<AppStackParamList, "EditProfile">;

export default function EditProfileScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { loading, profileDetailsResponse } = useAppSelector(
    state => state.user
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<any>(null);

  // Initialize form with existing profile data
  useEffect(() => {
    if (profileDetailsResponse) {
      setName(profileDetailsResponse.name || "");
      setEmail(profileDetailsResponse.email || "");
      if (profileDetailsResponse.avatar) {
        setAvatarUri(`${profileDetailsResponse.avatar}?t=${Date.now()}`);
      }
    }
  }, [profileDetailsResponse]);

  const handlePickAvatar = async () => {
    try {
      const image = await ImagePicker.openPicker({
        width: 400,
        height: 400,
        cropping: true,
        compressImageQuality: 0.7,
      });

      setAvatarUri(image.path);
      setAvatarFile({
        uri: image.path,
        type: image.mime,
        name: "avatar.jpg",
      });
    } catch (error) {
      // User cancelled picker
    }
  };

  const handleUpdateProfile = () => {
    const trimmedName = name?.trim();
    const trimmedEmail = email?.trim();

    // Validations
    if (!trimmedName) {
      show("Please enter your name", 2000, "top");
      return;
    }

    if (trimmedName.length < 3) {
      show("Name must be at least 3 characters", 2000, "top");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      show("Please enter a valid email address", 2000, "top");
      return;
    }

    // Build FormData
    const formData = new FormData();
    formData.append("name", trimmedName);
    formData.append("email", trimmedEmail);

    if (avatarFile) {
      formData.append("avatar", avatarFile as any);
    }

    dispatch(updateProfileRequest(formData));
    
    // Navigate back after success
    setTimeout(() => {
      show("Profile updated successfully", 2000, "top");
      navigation.goBack();
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <LinearGradient colors={["#6A11CB", "#2575FC"]} style={styles.gradient} />

      <Header showBack title="Edit Profile" />

      <Loader visible={loading} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <FontAwesome6 name="user" size={48} color="#fff" />
              </View>
            )}
            <TouchableOpacity
              style={styles.changeAvatarBtn}
              onPress={handlePickAvatar}
            >
              <FontAwesome6 name="image" size={16} color="#fff" />
              <Text style={styles.changeAvatarText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            {/* Name Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Full Name</Text>
              {/* <Input
                placeholder="Enter your full name"
                value={name}
                onChangeText={setName}
              /> */}
              <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter Your Name"
            style={styles.input}
            placeholderTextColor={Colors.gray}
          />
            </View>
            {/* Email Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email Address</Text>
               <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Enter Your Email"
            style={styles.input}
            placeholderTextColor={Colors.gray}
            keyboardType="email-address"
          />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonGroup}>
            <Button
              title="Update Profile"
              onPress={handleUpdateProfile}
              disabled={loading}
              style={styles.updateBtn}
            />
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollContent: {
    paddingHorizontal: normalize(16),
    paddingTop: normalize(20),
    paddingBottom: normalize(40),
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: normalize(24),
  },
  avatar: {
    width: normalize(120),
    height: normalize(120),
    borderRadius: normalize(60),
    borderWidth: 3,
    borderColor: "#6A11CB",
    marginBottom: normalize(12),
  },
  avatarPlaceholder: {
    width: normalize(120),
    height: normalize(120),
    borderRadius: normalize(60),
    backgroundColor: "#6A11CB",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#2575FC",
    marginBottom: normalize(12),
  },
  changeAvatarBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(8),
    backgroundColor: "#6A11CB",
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(8),
    borderRadius: normalize(20),
  },
  changeAvatarText: {
    color: "#fff",
    fontSize: normalize(13),
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: normalize(14),
    padding: normalize(16),
    marginBottom: normalize(20),
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  formGroup: {
    marginBottom: normalize(16),
  },
  label: {
    fontSize: normalize(12),
    color: "#999",
    fontWeight: "600",
    marginBottom: normalize(6),
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  buttonGroup: {
    gap: normalize(12),
    marginTop: normalize(12),
  },
  updateBtn: {
    marginHorizontal: 0,
  },
  cancelBtn: {
    paddingVertical: normalize(12),
    paddingHorizontal: normalize(16),
    borderRadius: normalize(8),
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
  },
  cancelText: {
    fontSize: normalize(14),
    fontWeight: "600",
    color: "#666",
  },
    input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: normalize(10),
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(8),
    fontSize: normalize(14),
    color: "#111",
  },
});
