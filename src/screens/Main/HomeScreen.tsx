import React, { useEffect, useRef, useState } from "react";
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
import { Colors, Fonts } from "../../themes";
import { useAppDispatch, useAppSelector } from "../../store";
import { profileDetailsRequest } from "../../store/slice/user.slice";
import Loader from "../../utils/helpers/Loader";
import { chatListRequest } from "../../store/slice/chat.slice";
import Button from "../../components/Button";
import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { normalize } from "../../utils/orientation";
import { connectSocket } from "../../utils/helpers/socket";

export default function HomeScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const isFocused = useIsFocused();

  const { userId } = useAppSelector((state) => state.auth);
  const { loading, chatListResponse } = useAppSelector((state) => state.chat);

  const socketRef = useRef<any>(null);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});

  /* ---------------- FETCH DATA ---------------- */
  useEffect(() => {
    if (isFocused) {
      dispatch(profileDetailsRequest());
      dispatch(chatListRequest());
    }
  }, [isFocused, dispatch]);

  /* ---------------- INIT ONLINE STATE ---------------- */
  useEffect(() => {
    if (chatListResponse?.chats) {
      const map: Record<string, boolean> = {};

      chatListResponse.chats.forEach((chat: any) => {
        chat.userStatus?.forEach((u: any) => {
          map[u.userId] = u.isOnline;
        });
      });

      setOnlineUsers(map);
    }
  }, [chatListResponse]);

  /* ---------------- SOCKET: ONLINE / OFFLINE ---------------- */
  useEffect(() => {
    if (!userId) return;

    const socket = connectSocket();
    socketRef.current = socket;

    // ✅ authenticate socket
    socket.emit("setup", userId);

    socket.on("user_online", ({ userId: onlineId }) => {
      setOnlineUsers((prev) => ({ ...prev, [onlineId]: true }));
    });

    socket.on("user_offline", ({ userId: offlineId }) => {
      setOnlineUsers((prev) => ({ ...prev, [offlineId]: false }));
    });

    return () => {
      socket.off("user_online");
      socket.off("user_offline");
      socket.disconnect();
    };
  }, [userId]);

  console.log("online users===>",onlineUsers)

  /* ---------------- RENDER ITEM ---------------- */
  const renderItem = ({ item }: any) => {
    const isGroupChat = item.isGroup;

    let chatName = "";
    let chatAvatar = null;
    let chatUser: any = null;

    if (isGroupChat) {
      chatName = item.groupName || "Group Chat";
    } else {
      chatUser = item.participants.find((p: any) => p._id !== userId);
      chatName = chatUser?.name || chatUser?.email || "User";
      chatAvatar = chatUser?.avatar;
    }

    const isOnline = chatUser ? onlineUsers[chatUser._id] : false;

    const lastMessage = item.lastMessage?.text || "Start first message";
    const lastMessageTime = item.lastMessage?.createdAt
      ? new Date(item.lastMessage.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    const status = item.lastMessageStatus; // sent | delivered | read
    const isMe = item.lastMessageSenderId === userId;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate("Chat", {
            chatId: item._id,
            chatUser: isGroupChat ? null : chatUser,
            isGroupChat,
            groupName: item.groupName,
          })
        }
      >
        {/* AVATAR */}
        <View style={styles.avatar}>
          {chatAvatar ? (
            <Image source={{ uri: chatAvatar }} style={styles.avatarImg} />
          ) : (
            <FontAwesome6 name="user" size={18} color="#fff" />
          )}

          {isOnline && <View style={styles.onlineDot} />}
        </View>

        {/* CONTENT */}
        <View style={{ flex: 1 }}>
          <View style={styles.header}>
            <Text style={styles.title}>{chatName}</Text>
            <Text style={styles.time}>{lastMessageTime}</Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {isMe && (
              <Text
                style={[
                  styles.tick,
                  status === "read" && styles.tickRead,
                ]}
              >
                {status === "sent" && "✓"}
                {status === "delivered" && "✓✓"}
                {status === "read" && "✓✓"}
              </Text>
            )}

            <Text style={styles.message} numberOfLines={1}>
              {lastMessage}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <Loader visible={loading} />

      <Header showBack={false} title="Home" />

      <FlatList
        data={chatListResponse?.chats || []}
        keyExtractor={(item) => item._id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No chats available</Text>
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("AddFriends")}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}


/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  list: { padding: 16 },

  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: normalize(12),
    backgroundColor: "#fff",
    borderRadius: normalize(12),
    marginBottom: normalize(10),
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

  avatarImg: {
    width: normalize(42),
    height: normalize(42),
    borderRadius: normalize(21),
  },

  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 15,
    height: 15,
    borderRadius: 25,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#fff",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  title: { fontSize: 15, fontWeight: "600" },
  time: { fontSize: 12, color: "#999" },

  message: { fontSize: 13, color: "#777" },

  tick: {
    fontSize: 12,
    color: "#9CA3AF",
    marginRight: 4,
  },

  tickRead: {
    color: "#2563EB",
  },

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
  },

  fabText: { fontSize: normalize(28), color: "#fff" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: normalize(50) },
  emptyText: { fontSize: normalize(16), color: "#999", fontFamily: Fonts.DMSans_SemiBold },
});
