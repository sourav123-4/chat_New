import React, { useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";

import Header from "../../components/Header";
import { Colors } from "../../themes";
import { useAppDispatch, useAppSelector } from "../../store";
import { profileDetailsRequest } from "../../store/slice/user.slice";
import Loader from "../../utils/helpers/Loader";
import { chatListRequest } from "../../store/slice/chat.slice";
import Button from "../../components/Button";
import FontAwesome6 from "@react-native-vector-icons/fontawesome6";

import {
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";
import {
  BottomTabNavigationProp,
} from "@react-navigation/bottom-tabs";
import { CompositeNavigationProp } from "@react-navigation/native";
import { AppStackParamList, AppTabParamList } from "../../types";
import { normalize } from "../../utils/orientation";

type HomeNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabParamList, "Home">,
  NativeStackNavigationProp<AppStackParamList>
>;

type Props = {
  navigation: HomeNavProp;
};

export default function HomeScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const isFocused = useIsFocused();
  const { userId } = useAppSelector(state => state.auth)
  const { loading, chatListResponse } = useAppSelector(state => state.chat);

  console.log("chatListResponse",chatListResponse)

  useEffect(() => {
    if (isFocused) {
      dispatch(profileDetailsRequest());
      dispatch(chatListRequest());
    }
  }, [isFocused, dispatch]);

  const renderItem = ({ item }: any) => {
    // Handle group chats vs 1-on-1 chats
    const isGroupChat = item.isGroup;
    let chatName = "";
    let chatAvatar = null;
    let avatarList: string[] = [];

    if (isGroupChat) {
      // Group chat
      chatName = item.groupName || "Group Chat";
      // Get first 3 participant avatars for group display
      avatarList = item.participants
        .slice(0, 3)
        .map((p: any) => p.avatar)
        .filter((a: string) => a);
    } else {
      // 1-on-1 chat
      const chatUser = item.participants.filter((itm: { _id: string }) => itm._id !== userId)[0];
      chatName = chatUser?.name || chatUser?.email || "User";
      chatAvatar = chatUser?.avatar;
    }

    const lastMessage = item.lastMessage?.text || "Start first message";
    const isLastMsgFile = item.lastMessage?.file;
    const lastMessageTime = item.lastMessage?.createdAt
      ? new Date(item.lastMessage.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    const handlePress = () => {
      if (isGroupChat) {
        navigation.navigate("Chat", {
          chatId: item._id,
          chatUser: null,
          isGroupChat: true,
          groupName: item.groupName,
        });
      } else {
        const chatUser = item.participants.filter((itm: { _id: string }) => itm._id !== userId)[0];
        navigation.navigate("Chat", {
          chatId: item._id,
          chatUser: chatUser,
        });
      }
    };

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        style={styles.card}
      >
        {/* Avatar - Single for 1-on-1, Grid for Group */}
        {isGroupChat ? (
          <View style={styles.groupAvatarContainer}>
            {avatarList.length > 0 ? (
              avatarList.map((avatar, index) => (
                <Image
                  key={index}
                  source={{ uri: avatar }}
                  style={[
                    styles.groupAvatarImg,
                    {
                      position: "absolute",
                      zIndex: 3 - index,
                      left: index * 8,
                      top: index * 8,
                    },
                  ]}
                />
              ))
            ) : (
              <FontAwesome6 name="users" size={18} color="#fff" />
            )}
          </View>
        ) : (
          <View style={styles.avatar}>
            {chatAvatar ? (
              <Image
                source={{ uri: chatAvatar }}
                style={{
                  width: normalize(42),
                  height: normalize(42),
                  borderRadius: normalize(21),
                }}
              />
            ) : (
              <FontAwesome6 name="user" size={18} color="#fff" />
            )}
          </View>
        )}

        {/* Text Content */}
        <View style={{ flex: 1 }}>
          <View style={styles.header}>
            <Text style={styles.title}>{chatName}</Text>
            <Text style={styles.time}>{lastMessageTime}</Text>
          </View>
          {isLastMsgFile ? (
            <View style={styles.messageRow}>
              <FontAwesome6 name="image" size={14} color="#777" />
              <Text style={[styles.message, { marginLeft: 4 }]}>Image</Text>
            </View>
          ) : (
            <Text style={styles.message} numberOfLines={1}>
              {lastMessage}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };


  return (
    <SafeAreaView style={styles.safe}>
       <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <Loader visible={loading} />

      <Header showBack={false} title="Home" />

      <FlatList
        contentContainerStyle={styles.list}
        data={chatListResponse.chats}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <FontAwesome6 name="comments" size={48} color="#999" />
              <Text style={styles.emptyText}>No chats yet</Text>
              <Button
                title="Add Friends"
                variant="primary"
                onPress={() => navigation.navigate("AddFriends")}
                style={{ marginTop: normalize(15), paddingHorizontal: normalize(10) }}
              />

            </View>
          ) : null
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("AddFriends")}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },

  /* Chat Card */
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: normalize(12),
    backgroundColor: "#fff",
    borderRadius: normalize(12),
    marginBottom: normalize(10),
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  avatar: {
    width: normalize(50),
    height: normalize(50),
    borderRadius: normalize(25),
    backgroundColor: "#6A11CB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: normalize(12),
  },

  groupAvatarContainer: {
    width: normalize(50),
    height: normalize(50),
    borderRadius: normalize(25),
    backgroundColor: "#6A11CB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: normalize(12),
    position: "relative",
    overflow: "hidden",
  },

  groupAvatarImg: {
    width: normalize(28),
    height: normalize(28),
    borderRadius: normalize(14),
    borderWidth: 1,
    borderColor: "#fff",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: normalize(4),
  },

  title: {
    fontSize: normalize(15),
    fontWeight: "600",
    color: "#111",
    flex: 1,
  },

  time: {
    fontSize: normalize(12),
    color: "#999",
    marginLeft: normalize(8),
  },

  message: {
    marginTop: normalize(2),
    fontSize: normalize(13),
    color: "#777",
  },

  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: normalize(2),
  },

  /* Empty State */
  empty: {
    marginTop: 120,
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: "#777",
  },

  /* Floating Action Button */
  fab: {
    position: "absolute",
    bottom: normalize(40),
    right: normalize(20),
    width: normalize(60),
    height: normalize(60),
    borderRadius: normalize(30),
    backgroundColor: "#6A11CB",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  fabText: {
    fontSize: normalize(28),
    color: "#fff",
    // fontWeight: "bold",
  },
});
