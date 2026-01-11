import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAppSelector } from "../store";
import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import LinearGradient from "react-native-linear-gradient";
import { normalize } from "../utils/orientation";

type Props = {
  title: string;
  showBack?: boolean;
};

const Header: React.FC<Props> = ({ title, showBack = false }) => {
  const navigation: any = useNavigation();
  const { profileDetailsResponse } = useAppSelector(state => state.user);

  const avatar = profileDetailsResponse?.avatar;

  return (
    <LinearGradient
      colors={["#6A11CB", "#6A11CB"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View  style={styles.container}>
      {/* BACK BUTTON */}
      {showBack ? (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.side}>
          <FontAwesome6 name="arrow-left" iconStyle="solid" size={22} color="#fff" />
        </TouchableOpacity>
      ) : (
        <View style={styles.side} />
      )}

      {/* TITLE */}
      <Text style={styles.title}>{title}</Text>

      {/* PROFILE AVATAR WITH GRADIENT RING */}
      <TouchableOpacity
        onPress={() => navigation.navigate("Profile")}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={["#ffffff", "#dbeafe"]}
          style={styles.avatarGradient}
        >
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <FontAwesome6 name="user" iconStyle="solid" size={16} color="#555" />
          )}
        </LinearGradient>
      </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: normalize(10)
  },
  side: {
    width: 32,
    alignItems: "center",
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: normalize(18),
    fontWeight: "600",
    color: "#fff",
  },

  /* Avatar Styles */
  avatarGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4, // Android shadow
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: normalize(16),
    backgroundColor: "#fff",
  },
});

export default Header;
