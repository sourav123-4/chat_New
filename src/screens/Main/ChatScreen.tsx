import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ImagePicker from 'react-native-image-crop-picker';
import { useAppDispatch, useAppSelector } from '../../store';
import Header from '../../components/Header';
import {
  messegeListRequest,
  messegeSendRequest,
} from '../../store/slice/messege.slice';
import { normalize } from '../../utils/orientation';
import { downloadFile } from '../../utils/helpers';
import { DateHeader } from '../../components/Chats/DateHeader';
import { MessageBubble } from '../../components/Chats/MessageBubble';
import { StatusBar } from '../../components/Chats/StatusBar';
import { MediaModal } from '../../components/Chats/MediaModal';
import { ChatInput } from '../../components/Chats/ChatInput';
import { useSocket } from '../../utils/hooks/useSocket';
import { getSocket } from '../../utils/helpers/socket';

export default function ChatScreen({ route }) {
  const { chatId, chatUser, isGroupChat, groupName } = route.params;
  const { userId } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const { messegeListResponse, messegeSendResponse } = useAppSelector(
    (state) => state.messege
  );

  const flatListRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [playVideoUrl, setPlayVideoUrl] = useState<string | null>(null);
  const [viewImageUrl, setViewImageUrl] = useState<string | null>(null);

  // Status states for 1-on-1 chats
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<number | null>(null);

  // Helper functions
  const createTempMessage = useCallback(
    (data: Partial<any>) => {
      const tempId = `temp-${Date.now()}`;
      return {
        _id: tempId,
        tempId,
        senderId: userId,
        createdAt: new Date().toISOString(),
        status: 'sending',
        ...data,
      };
    },
    [userId]
  );


  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const isMyMessage = useCallback(
    (item: any) => {
      const sender =
        typeof item.senderId === 'object' ? item.senderId._id : item.senderId;
      return sender === userId;
    },
    [userId]
  );

  useEffect(() => {
    const socket = getSocket();

    if (chatId) {
      socket.emit("join_conversation", chatId);
    }

    return () => {
      socket.emit("leave_conversation", chatId); // optional
    };
  }, [chatId]);

  // Socket handlers
  const handleMessageReceived = useCallback(
    (message: any) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
      scrollToBottom();
    },
    [scrollToBottom]
  );

  const handleMessageDelivered = useCallback(({ messageId }: any) => {
    setMessages((prev) =>
      prev.map((m) =>
        m._id === messageId ? { ...m, status: 'delivered' } : m
      )
    );
  }, []);

  const handleMessageRead = useCallback(({ messageId }: any) => {
    setMessages((prev) =>
      prev.map((m) => (m._id === messageId ? { ...m, status: 'read' } : m))
    );
  }, []);

  const handleUserOnline = useCallback(
    ({ userId: onlineUserId }: any) => {
      if (onlineUserId === chatUser?._id) {
        setIsOnline(true);
        setLastSeen(null);
      }
    },
    [chatUser]
  );

  const handleUserOffline = useCallback(
    ({ userId: offlineUserId, lastSeen: lastSeenTime }: any) => {
      if (offlineUserId === chatUser?._id) {
        setIsOnline(false);
        setLastSeen(lastSeenTime);
      }
    },
    [chatUser]
  );

  const handleTypingIndicator = useCallback(
    ({ userId: typingUserId }: any) => {
      if (typingUserId === chatUser?._id) {
        setIsTyping(true);
      }
    },
    [chatUser]
  );

  const handleStopTypingIndicator = useCallback(
    ({ userId: typingUserId }: any) => {
      if (typingUserId === chatUser?._id) {
        setIsTyping(false);
      }
    },
    [chatUser]
  );

  // Socket hook
  const { emitMessageRead, handleTypingWithTimeout, emitStopTyping } = useSocket({
    userId,
    chatId,
    onMessageReceived: handleMessageReceived,
    onMessageDelivered: handleMessageDelivered,
    onMessageRead: handleMessageRead,
    onUserOnline: !isGroupChat ? handleUserOnline : undefined,
    onUserOffline: !isGroupChat ? handleUserOffline : undefined,
    onTyping: !isGroupChat ? handleTypingIndicator : undefined,
    onStopTyping: !isGroupChat ? handleStopTypingIndicator : undefined,
  });

  // Load initial messages
  useEffect(() => {
    dispatch(messegeListRequest({ chatId }));
  }, [chatId, dispatch]);

  // Update messages from API response
  useEffect(() => {
    if (messegeListResponse?.messages) {
      setMessages(messegeListResponse.messages);
      scrollToBottom();
    }
  }, [messegeListResponse, scrollToBottom]);

  // Handle sent message response
  useEffect(() => {
    if (messegeSendResponse?.message) {
      setMessages((prev) =>
        prev.map((m) =>
          m.status === 'sending'
            ? messegeSendResponse.message
            : m
        )
      );
      scrollToBottom();
    }
  }, [messegeSendResponse, scrollToBottom]);
  // useEffect(() => {
  //   if (chatId) {
  //     // join socket room for this conversation
  //     socket.emit("join_conversation", chatId);
  //   }

  //   return () => {
  //     socket.emit("leave_conversation", chatId); // optional
  //   };
  // }, [chatId]);




  // Mark messages as read
  useEffect(() => {
    const unreadMessages = messages.filter(
      (m) => !isMyMessage(m) && m.status !== 'read'
    );

    if (unreadMessages.length > 0) {
      unreadMessages.forEach((m) => emitMessageRead({
        messageId: m._id,
        conversationId: chatId,
      }));
    }
  }, [messages.length]); // 👈 important


  // Handle text input with typing indicator
  const handleTextChange = useCallback(
    (value: string) => {
      handleTypingWithTimeout(() => setText(value));
    },
    [handleTypingWithTimeout]
  );

  // Send text message
  const sendText = useCallback(() => {
    if (!text.trim()) return;

    const tempMsg = createTempMessage({
      messageType: 'text',
      text: text.trim(),
    });

    setMessages((prev) => [...prev, tempMsg]);
    scrollToBottom();

    dispatch(
      messegeSendRequest({
        conversationId: chatId,
        text: text.trim(),
      })
    );

    setText('');
    emitStopTyping();
    const socket = getSocket();

    socket.emit("send_message", {
      conversationId: chatId,
      text: text.trim(),
      messageType: "text",
    });
  }, [text, createTempMessage, scrollToBottom, dispatch, chatId, emitStopTyping]);

  // Pick and send image
  const pickImage = useCallback(async () => {
    try {
      const img = await ImagePicker.openPicker({
        cropping: true,
        compressImageQuality: 0.8,
        mediaType: 'photo',
      });

      const tempMsg = createTempMessage({
        messageType: 'image',
        file: { url: img.path },
      });

      setMessages((prev) => [...prev, tempMsg]);
      scrollToBottom();

      const form = new FormData();
      form.append('conversationId', chatId);
      form.append('file', {
        uri: img.path,
        type: img.mime,
        name: 'image.jpg',
      } as any);

      dispatch(messegeSendRequest(form));
    } catch (error) {
      console.log('Image picker cancelled or error:', error);
    }
  }, [createTempMessage, scrollToBottom, chatId, dispatch]);

  // Pick and send video
  const pickVideo = useCallback(async () => {
    try {
      const video = await ImagePicker.openPicker({
        mediaType: 'video',
      });

      const tempMsg = createTempMessage({
        messageType: 'video',
        file: { url: video.path },
      });

      setMessages((prev) => [...prev, tempMsg]);
      scrollToBottom();

      const form = new FormData();
      form.append('conversationId', chatId);
      form.append('file', {
        uri: video.path,
        type: video.mime,
        name: 'video.mp4',
      } as any);

      dispatch(messegeSendRequest(form));
    } catch (error) {
      console.log('Video picker cancelled or error:', error);
    }
  }, [createTempMessage, scrollToBottom, chatId, dispatch]);

  // Check if new day
  const isNewDay = useCallback((current: any, previous?: any) => {
    if (!previous) return true;
    const currDate = new Date(current.createdAt).toDateString();
    const prevDate = new Date(previous.createdAt).toDateString();
    return currDate !== prevDate;
  }, []);

  // Render message item
  const renderItem = useCallback(
    ({ item, index }: any) => {
      const showDateHeader = isNewDay(item, messages[index - 1]);
      const isMe = isMyMessage(item);

      return (
        <>
          {showDateHeader && <DateHeader date={item.createdAt} />}
          <View
            style={[
              styles.messageWrapper,
              isMe ? styles.myMessageWrapper : styles.otherMessageWrapper,
            ]}
          >
            <MessageBubble
              message={item}
              isMyMessage={isMe}
              isGroupChat={isGroupChat}
              onImagePress={setViewImageUrl}
              onVideoPress={setPlayVideoUrl}
              onDownload={downloadFile}
            />
          </View>
        </>
      );
    },
    [messages, isNewDay, isMyMessage, isGroupChat]
  );

  // Empty state
  const renderEmptyState = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>💬</Text>
        <Text style={styles.emptyTitle}>No Messages Yet</Text>
        <Text style={styles.emptySubtitle}>
          Start the conversation by sending a message
        </Text>
      </View>
    ),
    []
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        showBack
        title={
          isGroupChat ? groupName || 'Group Chat' : chatUser?.email || 'Chat'
        }
        showProfile={false}
        showThreedot={true}
        onThreedotPress={() => setShowMenu(!showMenu)}
      />

      {!isGroupChat && (
        <StatusBar
          isTyping={isTyping}
          isOnline={isOnline}
          lastSeen={lastSeen}
        />
      )}

      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.messagesContainer}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.flatListContent}
            ListEmptyComponent={renderEmptyState}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
          />

          {/* Video Modal */}
          <MediaModal
            visible={!!playVideoUrl}
            url={playVideoUrl}
            type="video"
            onClose={() => setPlayVideoUrl(null)}
          />

          {/* Image Modal */}
          <MediaModal
            visible={!!viewImageUrl}
            url={viewImageUrl}
            type="image"
            onClose={() => setViewImageUrl(null)}
          />
        </View>

        {/* Input Bar */}
        <ChatInput
          value={text}
          onChangeText={handleTextChange}
          onSend={sendText}
          onImagePress={pickImage}
          onVideoPress={pickVideo}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    marginVertical: 4,
    paddingHorizontal: 8,
  },
  myMessageWrapper: {
    alignItems: 'flex-end',
  },
  otherMessageWrapper: {
    alignItems: 'flex-start',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: normalize(24),
    minHeight: 400,
  },
  emptyIcon: {
    fontSize: normalize(64),
    marginBottom: normalize(16),
  },
  emptyTitle: {
    fontSize: normalize(18),
    fontWeight: '600',
    color: '#111',
    marginBottom: normalize(8),
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: normalize(14),
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});