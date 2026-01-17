import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  Platform,
  KeyboardAvoidingView,
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
import Video from "react-native-video";
import Modal from "react-native-modal";
import { downloadFile } from "../../utils/helpers";


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
  const [showMenu, setShowMenu] = useState(false);
  const [playVideoUrl, setPlayVideoUrl] = useState<string | null>(null);
  const [viewImageUrl, setViewImageUrl] = useState<string | null>(null);


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

    // Get sender name and avatar for group chats
    const senderName =
      typeof item.senderId === "object"
        ? item.senderId.name
        : "User";

    const senderAvatar =
      typeof item.senderId === "object"
        ? item.senderId.avatar
        : null;

    // Cloudinary video thumbnail
    const videoThumb =
      item.file?.url
        ?.replace("/video/upload/", "/video/upload/so_0/")
        ?.replace(/\.(mp4|mov|webm)$/, ".jpg");

    const renderMessageFooter = () => (
      <View style={styles.messageFooter}>
        <Text
          style={[
            styles.timestamp,
            isMe ? styles.myTimestamp : styles.otherTimestamp,
          ]}
        >
          {timestamp}
        </Text>
      </View>
    );

    return (
      <View
        style={[
          styles.messageWrapper,
          isMe ? styles.myMessageWrapper : styles.otherMessageWrapper,
        ]}
      >
        {/* GROUP CHAT - OTHER USER */}
        {!isMe && isGroupChat && (
          <View style={styles.senderInfoLeft}>
            {senderAvatar ? (
              <Image source={{ uri: senderAvatar }} style={styles.senderAvatar} />
            ) : (
              <View style={styles.senderAvatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {senderName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}

            <View style={{ marginLeft: 8, flex: 1 }}>
              <View
                style={[
                  styles.bubble,
                  isMe ? styles.myBubble : styles.otherBubble,
                ]}
              >
                <Text style={styles.bubbleSenderName}>{senderName}</Text>

                {item.messageType === "text" && (
                  <>
                    <Text style={styles.otherText}>{item.text}</Text>
                    {renderMessageFooter()}
                  </>
                )}

                {item.messageType === "image" && (
                  <>
                    {/* VIEW IMAGE */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setViewImageUrl(item.file?.url)}
                    >
                      <Image source={{ uri: item.file?.url }} style={styles.image} />
                    </TouchableOpacity>

                    {/* DOWNLOAD IMAGE */}
                    <TouchableOpacity
                      onPress={() => downloadFile(item.file?.url, "image")}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={{
                          color: isMe ? "#fff" : "#111",
                          fontSize: normalize(12),
                          marginTop: normalize(4),
                        }}
                      >
                        ⬇ Download
                      </Text>
                    </TouchableOpacity>

                    {renderMessageFooter()}
                  </>
                )}


                {(item.messageType === "file" ||
                  item.messageType === "video") && (
                    <>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          setPlayVideoUrl(item.file?.url);
                        }}
                      >
                        <View style={styles.videoThumbWrapper}>
                          <Image
                            source={{ uri: videoThumb }}
                            style={styles.videoThumbnail}
                          />
                          <View style={styles.playIconOverlay}>
                            <Text style={styles.playIcon}>▶</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                      {/* DOWNLOAD BUTTON */}
                      <TouchableOpacity
                        onPress={() => downloadFile(item.file?.url,"video")}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={{
                            color: isMe ? "#fff" : "#111",
                            fontSize: normalize(12),
                            marginTop: normalize(4),
                          }}
                        >
                          ⬇ Download
                        </Text>
                      </TouchableOpacity>
                      {renderMessageFooter()}
                    </>
                  )}
              </View>
            </View>
          </View>
        )}

        {/* MY MESSAGE */}
        {isMe && (
          <View style={styles.messageContainer}>
            <View style={[styles.bubble, styles.myBubble]}>
              {item.messageType === "text" && (
                <>
                  <Text style={styles.myText}>{item.text}</Text>
                  {renderMessageFooter()}
                </>
              )}

              {item.messageType === "image" && (
                <>
                  {/* VIEW IMAGE */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setViewImageUrl(item.file?.url)}
                  >
                    <Image source={{ uri: item.file?.url }} style={styles.image} />
                  </TouchableOpacity>

                  {/* DOWNLOAD IMAGE */}
                  <TouchableOpacity
                    onPress={() => downloadFile(item.file?.url, "image")}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        color: isMe ? "#fff" : "#111",
                        fontSize: normalize(12),
                        marginTop: normalize(4),
                      }}
                    >
                      ⬇ Download
                    </Text>
                  </TouchableOpacity>

                  {renderMessageFooter()}
                </>
              )}


              {(item.messageType === "file" ||
                item.messageType === "video") && (
                  <>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        setPlayVideoUrl(item.file?.url);
                      }}
                    >
                      <View style={styles.videoThumbWrapper}>
                        <Image
                          source={{ uri: videoThumb }}
                          style={styles.videoThumbnail}
                        />
                        <View style={styles.playIconOverlay}>
                          <Text style={styles.playIcon}>▶</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                    {/* DOWNLOAD BUTTON */}

                    <TouchableOpacity
                      onPress={() => downloadFile(item.file?.url,"video")}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={{
                          color: isMe ? "#fff" : "#111",
                          fontSize: normalize(12),
                          marginTop: normalize(4),
                        }}
                      >
                        ⬇ Download
                      </Text>
                    </TouchableOpacity>
                    {renderMessageFooter()}
                  </>
                )}
            </View>
          </View>
        )}

        {/* 1-ON-1 OTHER USER */}
        {!isMe && !isGroupChat && (
          <View style={styles.messageContainer}>
            <View style={[styles.bubble, styles.otherBubble]}>
              {item.messageType === "text" && (
                <>
                  <Text style={styles.otherText}>{item.text}</Text>
                  {renderMessageFooter()}
                </>
              )}

              {item.messageType === "image" && (
                <>
                  {/* VIEW IMAGE */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setViewImageUrl(item.file?.url)}
                  >
                    <Image source={{ uri: item.file?.url }} style={styles.image} />
                  </TouchableOpacity>

                  {/* DOWNLOAD IMAGE */}
                  <TouchableOpacity
                    onPress={() => downloadFile(item.file?.url, "image")}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        color: isMe ? "#fff" : "#111",
                        fontSize: normalize(12),
                        marginTop: normalize(4),
                      }}
                    >
                      ⬇ Download
                    </Text>
                  </TouchableOpacity>

                  {renderMessageFooter()}
                </>
              )}


              {(item.messageType === "file" ||
                item.messageType === "video") && (
                  <>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        setPlayVideoUrl(item.file?.url);
                      }}

                    >
                      <View style={styles.videoThumbWrapper}>
                        <Image
                          source={{ uri: videoThumb }}
                          style={styles.videoThumbnail}
                        />
                        <View style={styles.playIconOverlay}>
                          <Text style={styles.playIcon}>▶</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                    {/* DOWNLOAD BUTTON */}

                    <TouchableOpacity
                      onPress={() => downloadFile(item.file?.url,"video")}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={{
                          color: isMe ? "#fff" : "#111",
                          fontSize: normalize(12),
                          marginTop: normalize(4),
                        }}
                      >
                        ⬇ Download
                      </Text>
                    </TouchableOpacity>
                    {renderMessageFooter()}
                  </>
                )}
            </View>
          </View>
        )}
      </View>
    );
  };


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        showBack
        title={isGroupChat ? (groupName || "Group Chat") : chatUser?.email || "Chat"}
        showProfile={false}
        showThreedot={true}
        onThreedotPress={() => setShowMenu(!showMenu)}
      />

      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.messagesContainer}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.flatListContent}
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
          <Modal
            isVisible={!!playVideoUrl}
            onBackdropPress={() => setPlayVideoUrl(null)}
            style={{ margin: 0 }}
          >
            <View style={{ flex: 1, backgroundColor: "#000" }}>
              <Video
                source={{ uri: playVideoUrl! }}
                style={{ flex: 1 }}
                controls
                resizeMode="contain"
                paused={false}
              />

              <TouchableOpacity
                style={{
                  position: "absolute",
                  top: 40,
                  right: 20,
                  padding: 10,
                }}
                onPress={() => setPlayVideoUrl(null)}
              >
                <Text style={{ color: "#fff", fontSize: 18 }}>✕</Text>
              </TouchableOpacity>



            </View>
          </Modal>
          <Modal
            isVisible={!!viewImageUrl}
            onBackdropPress={() => setViewImageUrl(null)}
            style={{ margin: 0 }}
          >
            <View style={{ flex: 1, backgroundColor: "#000" }}>
              <Image
                source={{ uri: viewImageUrl! }}
                style={{ flex: 1, resizeMode: "contain" }}
              />

              <TouchableOpacity
                style={{ position: "absolute", top: 40, right: 20 }}
                onPress={() => setViewImageUrl(null)}
              >
                <Text style={{ color: "#fff", fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </View>
          </Modal>


        </View>

        {/* INPUT BAR - Always visible at bottom */}
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
            multiline
            maxLength={1000}
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
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  flex1: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  flatListContent: {
    padding: 12,
    flexGrow: 1,
  },
  messageWrapper: {
    marginVertical: 8,
    paddingHorizontal: 12,
  },
  myMessageWrapper: {
    alignItems: "flex-end",
  },
  otherMessageWrapper: {
    alignItems: "flex-start",
  },
  senderInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  senderInfoLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  senderAvatar: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(16),
    marginRight: 8,
  },
  senderAvatarPlaceholder: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(16),
    backgroundColor: "#6A11CB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  avatarText: {
    color: "#fff",
    fontSize: normalize(10),
    fontWeight: "700",
  },
  senderName: {
    fontSize: normalize(12),
    fontWeight: "600",
    color: "#6A11CB",
  },
  senderNameAbove: {
    fontSize: normalize(12),
    fontWeight: "600",
    color: "#6A11CB",
    // marginBottom: 4,
  },
  messageContainer: {
    flexDirection: "row",
    // marginVertical: 4,
    paddingHorizontal: 4,
  },
  myContainer: {
    justifyContent: "flex-end",
  },
  otherContainer: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "75%",
    paddingHorizontal: normalize(14),
    paddingVertical: normalize(10),
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  myBubble: {
    backgroundColor: "#6A11CB",
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: "#E8E8E8",
    borderBottomLeftRadius: 4,
  },
  bubbleSenderName: {
    fontSize: normalize(12),
    fontWeight: "600",
    color: "#6A11CB",
    // marginBottom: 6,
  },
  myText: {
    color: "#fff",
    fontSize: normalize(15),
    lineHeight: 20,
  },
  otherText: {
    color: "#111",
    fontSize: normalize(15),
    lineHeight: 20,
  },
  timestamp: {
    fontSize: normalize(11),
    marginTop: 0,
  },
  myTimestamp: {
    color: "rgba(255,255,255,0.75)",
    textAlign: "right",
  },
  otherTimestamp: {
    color: "#888",
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    // marginTop: 6,
    gap: normalize(4),
    justifyContent: "flex-end",
  },
  footerName: {
    fontSize: normalize(11),
    fontWeight: "500",
  },
  myFooterName: {
    color: "rgba(255,255,255,0.75)",
  },
  otherFooterName: {
    color: "#888",
  },
  image: {
    width: normalize(120),
    height: normalize(120),
    borderRadius: 12,
    marginBottom: 6,
  },
  videoContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: normalize(6),
  },
  videoIcon: {
    fontSize: normalize(20),
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
    borderRadius: 24,
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(10),
    fontSize: normalize(14),
    color: "#111",
    backgroundColor: "#f9f9f9",
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: "#6A11CB",
    paddingHorizontal: normalize(20),
    paddingVertical: normalize(10),
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6A11CB",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  icon: {
    fontSize: normalize(24),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: normalize(24),
    minHeight: 400,
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
  videoThumbWrapper: {
    width: normalize(160),
    height: normalize(120),
    borderRadius: normalize(12),
    overflow: "hidden",
    marginBottom: normalize(6),
  },

  videoThumbnail: {
    width: "100%",
    height: "100%",
  },

  playIconOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  playIcon: {
    color: "#fff",
    fontSize: normalize(32),
  },

});