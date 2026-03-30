import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useAppDispatch, useAppSelector } from "../../store";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AppStackParamList } from "../../types";
import Storage from "../../utils/storage";
import { resetAuth } from "../../store/slice/auth.slice";
import { profileDetailsRequest, resetUser } from "../../store/slice/user.slice";
import { show } from "../../components/Toast";
import LinearGradient from "react-native-linear-gradient";
import Header from "../../components/Header";
import { useIsFocused } from "@react-navigation/native";
import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { normalize } from "../../utils/orientation";
import Button from "../../components/Button";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../themes";
import { ProfileSkeleton } from "../../components/SkeletonLoader";
import { clearAllMMKV } from "../../db/mmkv";
import { clearAllMessages } from "../../db/messageRepository";

type Props = NativeStackScreenProps<AppStackParamList, "Profile">;

export default function ProfileScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const isFocused = useIsFocused();
  const { profileDetailsResponse, loading } = useAppSelector(
    state => state.user
  );

  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  // Fetch profile when screen is focused
  useEffect(() => {
    if (isFocused) {
      dispatch(profileDetailsRequest());
    }
  }, [isFocused, dispatch]);

  // Cache-safe avatar update
  useEffect(() => {
    if (profileDetailsResponse?.avatar) {
      setAvatarUri(`${profileDetailsResponse.avatar}?t=${Date.now()}`);
    } else {
      setAvatarUri(null);
    }
  }, [profileDetailsResponse?.avatar]);

  const logout = async () => {
    try {
      clearAllMMKV();
      clearAllMessages();
      await Storage.clearAll();
      dispatch(resetAuth());
      dispatch(resetUser());
      show('Logged out successfully', 2000, 'top');
    } catch (error) {
      show('Logout failed', 2000, 'top');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      {/* <LinearGradient colors={["#6A11CB", "#2575FC"]} style={styles.gradient} /> */}

      <Header showBack={false} title="Profile" />

      {/* <ProfileSkeleton/> */}
      {loading ? (
        <ProfileSkeleton />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.avatarSection}>
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <FontAwesome6 name="user" size={48} color="#fff" />
              </View>
            )}
          </View>

          <View style={styles.card}>
            <View style={styles.infoRow}>
              <FontAwesome6 name="user" size={16} color="#6A11CB" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Full Name</Text>
                <Text style={styles.infoValue}>
                  {profileDetailsResponse?.name || "Not provided"}
                </Text>
              </View>
            </View>

            <View style={[styles.infoRow, { marginTop: normalize(14) }]}>
              <FontAwesome6 name="envelope" size={16} color="#6A11CB" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email Address</Text>
                <Text style={styles.infoValue}>
                  {profileDetailsResponse?.email || "Not provided"}
                </Text>
              </View>
            </View>

            <View style={[styles.infoRow, { marginTop: normalize(14) }]}>
              <FontAwesome6 name="calendar" size={16} color="#6A11CB" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Member Since</Text>
                <Text style={styles.infoValue}>
                  {profileDetailsResponse?.createdAt
                    ? new Date(profileDetailsResponse.createdAt).toLocaleDateString()
                    : "Unknown"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.buttonGroup}>
            <Button
              title="Edit Profile"
              onPress={() => navigation.navigate("EditProfile")}
              style={styles.editButton}
            />
            <TouchableOpacity
              style={styles.changePasswordButton}
              onPress={() => navigation.navigate("ChangePassword")}
            >
              <Text style={styles.changePasswordText}>Change Password</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={logout}
            >
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: normalize(12),
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: normalize(12),
    color: "#999",
    fontWeight: "600",
    marginBottom: normalize(4),
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: normalize(15),
    color: "#111",
    fontWeight: "500",
  },
  buttonGroup: {
    gap: normalize(12),
    marginTop: normalize(12),
  },
  editButton: {
    marginHorizontal: 0,
  },
  changePasswordButton: {
    paddingVertical: normalize(12),
    paddingHorizontal: normalize(16),
    borderRadius: normalize(8),
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FCD34D",
    alignItems: "center",
  },
  changePasswordText: {
    fontSize: normalize(14),
    fontWeight: "600",
    color: "#92400E",
  },
  logoutButton: {
    paddingVertical: normalize(12),
    paddingHorizontal: normalize(16),
    borderRadius: normalize(8),
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
  },
  logoutText: {
    fontSize: normalize(14),
    fontWeight: "600",
    color: "#dc2626",
  },
});
