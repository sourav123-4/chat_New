import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ImagePicker from "react-native-image-crop-picker";
import { useAppDispatch, useAppSelector } from "../../store";
import Header from "../../components/Header";
import {
  messegeListRequest,
  messegeSendRequest,
} from "../../store/slice/messege.slice";
import { normalize } from "../../utils/orientation";
import { Colors } from "../../themes";

export default function ChatScreen({ route }) {
  const { chatId, chatUser, isGroupChat, groupName } = route.params;
  const { userId } = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();

  const { messegeListResponse, messegeSendResponse } = useAppSelector(
    state => state.messege
  );

  const flatListRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    dispatch(messegeListRequest({ chatId }));
  }, [chatId]);

  useEffect(() => {
    if (messegeListResponse?.messages) {
      setMessages(messegeListResponse.messages);
      scrollToBottom();
    }
  }, [messegeListResponse]);

  useEffect(() => {
    if (messegeSendResponse?.message) {
      setMessages(prev => [...prev, messegeSendResponse.message]);
      scrollToBottom();
    }
  }, [messegeSendResponse]);

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // TEXT
  const sendText = () => {
    if (!text.trim()) return;

    dispatch(
      messegeSendRequest({
        conversationId: chatId,
        text,
      })
    );
    setText("");
  };

  // IMAGE
  const pickImage = async () => {
    const img = await ImagePicker.openPicker({
      cropping: true,
      compressImageQuality: 0.8,
    });

    const form = new FormData();
    form.append("conversationId", chatId);
    form.append("file", {
      uri: img.path,
      type: img.mime,
      name: "image.jpg",
    } as any);

    dispatch(messegeSendRequest(form));
  };

  // VIDEO
  const pickVideo = async () => {
    const video = await ImagePicker.openPicker({
      mediaType: "video",
    });

    const form = new FormData();
    form.append("conversationId", chatId);
    form.append("file", {
      uri: video.path,
      type: video.mime,
      name: "video.mp4",
    } as any);

    dispatch(messegeSendRequest(form));
  };

  const isMyMessage = (item: any) => {
    const sender =
      typeof item.senderId === "object"
        ? item.senderId._id
        : item.senderId;
    return sender === userId;
  };

  const renderItem = ({ item }: any) => {
    const isMe = isMyMessage(item);
    const timestamp = item.createdAt
      ? new Date(item.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    return (
      <View
        style={[
          styles.messageContainer,
          isMe ? styles.myContainer : styles.otherContainer,
        ]}
      >
        <View
          style={[
            styles.bubble,
            isMe ? styles.myBubble : styles.otherBubble,
          ]}
        >
          {item.messageType === "text" && (
            <>
              <Text style={isMe ? styles.myText : styles.otherText}>
                {item.text}
              </Text>
              <Text style={[styles.timestamp, isMe ? styles.myTimestamp : styles.otherTimestamp]}>
                {timestamp}
              </Text>
            </>
          )}

          {item.messageType === "image" && (
            <>
              <Image source={{ uri: item.file?.url }} style={styles.image} />
              <Text style={[styles.timestamp, isMe ? styles.myTimestamp : styles.otherTimestamp]}>
                {timestamp}
              </Text>
            </>
          )}

          {item.messageType === "video" && (
            <>
              <Text style={{ color: isMe ? "#fff" : "#111", marginBottom: 6 }}>🎥 Video</Text>
              <Text style={[styles.timestamp, isMe ? styles.myTimestamp : styles.otherTimestamp]}>
                {timestamp}
              </Text>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Header 
        showBack 
        title={isGroupChat ? (groupName || "Group Chat") : chatUser?.email || "Chat"} 
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={70}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12, flexGrow: 1 }}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyTitle}>No Messages Yet</Text>
              <Text style={styles.emptySubtitle}>
                Start the conversation by sending a message
              </Text>
            </View>
          )}
        />

        {/* INPUT BAR */}
        <View style={styles.inputRow}>
          <TouchableOpacity onPress={pickImage}>
            <Text style={styles.icon}>📷</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={pickVideo}>
            <Text style={styles.icon}>🎥</Text>
          </TouchableOpacity>

          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Type a message"
            style={styles.input}
            placeholderTextColor={Colors.gray}
          />

          <TouchableOpacity onPress={sendText} style={styles.sendBtn}>
            <Text style={{ color: "#fff" }}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: "row",
    marginVertical: 6,
    paddingHorizontal: 12,
  },
  myContainer: {
    justifyContent: "flex-end",
  },
  otherContainer: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "75%",
    padding: normalize(12),
    borderRadius: 16,
  },
  myBubble: {
    backgroundColor: "#6A11CB",
  },
  otherBubble: {
    backgroundColor: "#E5E7EB",
  },
  myText: {
    color: "#fff",
    fontSize: normalize(14),
  },
  otherText: {
    color: "#111",
    fontSize: normalize(14),
  },
  timestamp: {
    fontSize: normalize(11),
    marginTop: 4,
  },
  myTimestamp: {
    color: "rgba(255,255,255,0.7)",
    textAlign: "right",
  },
  otherTimestamp: {
    color: "#999",
  },
  image: {
    width: normalize(100),
    height: normalize(100),
    borderRadius: 8,
  },
  inputRow: {
    flexDirection: "row",
    padding: normalize(12),
    backgroundColor: "#fff",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: normalize(8),
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 20,
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(8),
    fontSize: normalize(14),
    color: "#111",
  },
  sendBtn: {
    backgroundColor: "#6A11CB",
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(8),
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    fontSize: normalize(22),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: normalize(24),
  },
  emptyIcon: {
    fontSize: normalize(64),
    marginBottom: normalize(16),
  },
  emptyTitle: {
    fontSize: normalize(18),
    fontWeight: "600",
    color: "#111",
    marginBottom: normalize(8),
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: normalize(14),
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
});
