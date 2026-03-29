import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Text,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ImagePicker from 'react-native-image-crop-picker';
import { PermissionsAndroid } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../types';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  messegeListRequest,
  messegeSendRequest,
} from '../../store/slice/messege.slice';
import { normalize } from '../../utils/orientation';
import { downloadFile } from '../../utils/helpers';
import { DateHeader } from '../../components/Chats/DateHeader';
import { MessageBubble } from '../../components/Chats/MessageBubble';
import { MediaModal } from '../../components/Chats/MediaModal';
import { ChatInput } from '../../components/Chats/ChatInput';
import { useSocket } from '../../utils/hooks/useSocket';
import { ChatSkeletonLoader } from '../../components/SkeletonLoader';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import LinearGradient from 'react-native-linear-gradient';

type Props = NativeStackScreenProps<AppStackParamList, 'Chat'>;

export default function ChatScreen({ route, navigation }: Props) {
  const { chatId, chatUser, isGroupChat, groupName } = route.params;
  const { userId } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const { messegeListResponse, messegeSendResponse, hasMore, loadingMore, loading } = useAppSelector(
    (state) => state.messege
  );

  const flatListRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const isLoadingMoreRef = useRef(false);
  const [text, setText] = useState('');
  const [playVideoUrl, setPlayVideoUrl] = useState<string | null>(null);
  const [viewImageUrl, setViewImageUrl] = useState<string | null>(null);

  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<number | null>(null);

  // Seed initial online status from chatUser if available
  useEffect(() => {
    if (chatUser?.isOnline !== undefined) setIsOnline(chatUser.isOnline);
    if (chatUser?.lastSeen) setLastSeen(chatUser.lastSeen);
  }, []);

  const createTempMessage = useCallback(
    (data: Partial<any>) => ({
      _id: `temp-${Date.now()}`,
      senderId: userId,
      createdAt: new Date().toISOString(),
      status: 'sending',
      ...data,
    }),
    [userId]
  );

  const isMyMessage = useCallback(
    (item: any) => {
      const sender = typeof item.senderId === 'object' ? item.senderId._id : item.senderId;
      return sender === userId;
    },
    [userId]
  );

  // ── Pusher handlers ──────────────────────────────────────────────
  const handleMessageReceived = useCallback((message: any) => {
    setMessages((prev) => {
      if (prev.some((m) => m._id === message._id)) return prev;
      return [message, ...prev];
    });
  }, []);

  const handleMessageDelivered = useCallback(({ messageId }: any) => {
    if (messageId) {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, status: 'delivered' } : m))
      );
    } else {
      // bulk — mark all my sent messages as delivered
      setMessages((prev) =>
        prev.map((m) => isMyMessage(m) && m.status === 'sent' ? { ...m, status: 'delivered' } : m)
      );
    }
  }, [isMyMessage]);

  // client-message_read: other user opened chat — mark all my messages as read
  const handleMessageRead = useCallback(() => {
    setMessages((prev) =>
      prev.map((m) => isMyMessage(m) ? { ...m, status: 'read' } : m)
    );
  }, [isMyMessage]);

  const handleUserOnline = useCallback((data: any) => {
    const id = data?.userId ?? data?.id;
    if (id === chatUser?._id) { setIsOnline(true); setLastSeen(null); }
  }, [chatUser?._id]);

  const handleUserOffline = useCallback((data: any) => {
    const id = data?.userId ?? data?.id;
    if (id === chatUser?._id) { setIsOnline(false); setLastSeen(data?.lastSeen ?? null); }
  }, [chatUser?._id]);

  const handleTypingIndicator = useCallback((data: any) => {
    if (data?.userId === chatUser?._id) setIsTyping(true);
  }, [chatUser?._id]);

  const handleStopTypingIndicator = useCallback((data: any) => {
    if (data?.userId === chatUser?._id) setIsTyping(false);
  }, [chatUser?._id]);

  const { emitMessageRead, handleTypingWithTimeout, emitStopTyping } = useSocket({
    userId,
    chatId,
    chatUserId: !isGroupChat ? chatUser?._id : undefined,
    onMessageReceived: handleMessageReceived,
    onMessageDelivered: handleMessageDelivered,
    onMessageRead: handleMessageRead,
    onUserOnline: !isGroupChat ? handleUserOnline : undefined,
    onUserOffline: !isGroupChat ? handleUserOffline : undefined,
    onTyping: !isGroupChat ? handleTypingIndicator : undefined,
    onStopTyping: !isGroupChat ? handleStopTypingIndicator : undefined,
  });

  const LIMIT = 20;

  useEffect(() => {
    setPage(1);
    setMessages([]);
    isLoadingMoreRef.current = false;
    dispatch(messegeListRequest({ conversationId: chatId, page: 1, limit: LIMIT }));
  }, [chatId]);

  useEffect(() => {
    if (!messegeListResponse?.messages) return;
    const incoming = [...messegeListResponse.messages].reverse();
    if (messegeListResponse.page === 1) {
      setMessages(incoming);
    } else {
      setMessages((prev) => {
        const ids = new Set(prev.map((m: any) => m._id));
        return [...prev, ...incoming.filter((m: any) => !ids.has(m._id))];
      });
    }
    isLoadingMoreRef.current = false;
  }, [messegeListResponse]);

  const handleLoadMore = useCallback(() => {
    if (!hasMore || loadingMore || isLoadingMoreRef.current) return;
    isLoadingMoreRef.current = true;
    const next = page + 1;
    setPage(next);
    dispatch(messegeListRequest({ conversationId: chatId, page: next, limit: LIMIT }));
  }, [hasMore, loadingMore, page, chatId, dispatch]);

  useEffect(() => {
    if (!messegeSendResponse?.message) return;
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.status === 'sending');
      if (idx === -1) return prev;
      const updated = [...prev];
      updated[idx] = messegeSendResponse.message;
      return updated;
    });
  }, [messegeSendResponse]);

  // Mark all messages read when messages load or when entering chat
  useEffect(() => {
    if (messages.length > 0) emitMessageRead();
  }, [messages.length === 0 ? 0 : 1, chatId]);

  const handleTextChange = useCallback(
    (value: string) => handleTypingWithTimeout(() => setText(value)),
    [handleTypingWithTimeout]
  );

  const sendText = useCallback(() => {
    if (!text.trim()) return;
    setMessages((prev) => [createTempMessage({ messageType: 'text', text: text.trim() }), ...prev]);
    dispatch(messegeSendRequest({ conversationId: chatId, text: text.trim() }));
    setText('');
    emitStopTyping();
  }, [text, createTempMessage, dispatch, chatId, emitStopTyping]);

  const requestMediaPermission = useCallback(async (type: 'photo' | 'video') => {
    if (Platform.OS !== 'android') return true;
    const permission = Platform.Version >= 33
      ? (type === 'photo' ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES : PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO)
      : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
    const granted = await PermissionsAndroid.request(permission);
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }, []);

  const pickImage = useCallback(async () => {
    try {
      const hasPermission = await requestMediaPermission('photo');
      if (!hasPermission) return;
      const img = await ImagePicker.openPicker({
        mediaType: 'photo',
        compressImageQuality: 0.8,
        cropping: false,
      });
      setMessages((prev) => [createTempMessage({ messageType: 'image', file: { url: img.path } }), ...prev]);
      const form = new FormData();
      form.append('conversationId', chatId);
      form.append('file', { uri: img.path, type: img.mime, name: 'image.jpg' } as any);
      dispatch(messegeSendRequest(form));
    } catch (err: any) {
      console.log("error is ==>",err)
      if (err?.code !== 'E_PICKER_CANCELLED') console.log('pickImage error:', err?.message);
    }
  }, [createTempMessage, chatId, dispatch, requestMediaPermission]);

  const pickVideo = useCallback(async () => {
    try {
      const hasPermission = await requestMediaPermission('video');
      if (!hasPermission) return;
      const video = await ImagePicker.openPicker({ mediaType: 'video' });
      setMessages((prev) => [createTempMessage({ messageType: 'video', file: { url: video.path } }), ...prev]);
      const form = new FormData();
      form.append('conversationId', chatId);
      form.append('file', { uri: video.path, type: video.mime, name: 'video.mp4' } as any);
      dispatch(messegeSendRequest(form));
    } catch (err: any) {
      if (err?.code !== 'E_PICKER_CANCELLED') console.log('pickVideo error:', err?.message);
    }
  }, [createTempMessage, chatId, dispatch, requestMediaPermission]);

  const isNewDay = useCallback((current: any, previous?: any) => {
    if (!previous) return true;
    return new Date(current.createdAt).toDateString() !== new Date(previous.createdAt).toDateString();
  }, []);

  const renderItem = useCallback(
    ({ item, index }: any) => {
      const showDateHeader = isNewDay(item, messages[index + 1]);
      const isMe = isMyMessage(item);
      return (
        <>
          {showDateHeader && <DateHeader date={item.createdAt} />}
          <View style={[styles.messageWrapper, isMe ? styles.myWrapper : styles.otherWrapper]}>
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

  const statusText = isTyping
    ? 'typing...'
    : isOnline
    ? 'online'
    : lastSeen
    ? `last seen ${new Date(lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : '';

  const chatTitle = isGroupChat ? groupName || 'Group Chat' : chatUser?.name || chatUser?.email || 'Chat';
  const chatAvatar = !isGroupChat ? chatUser?.avatar : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Custom Chat Header ── */}
      <LinearGradient colors={['#6A11CB', '#6A11CB']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <FontAwesome6 name="arrow-left" iconStyle="solid" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Avatar */}
        <View style={styles.headerAvatarWrap}>
          {chatAvatar ? (
            <Image source={{ uri: chatAvatar }} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatarPlaceholder}>
              <FontAwesome6 name={isGroupChat ? 'users' : 'user'} iconStyle="solid" size={16} color="#fff" />
            </View>
          )}
          {!isGroupChat && isOnline && <View style={styles.headerOnlineDot} />}
        </View>

        {/* Name + status */}
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>{chatTitle}</Text>
          {!isGroupChat && statusText ? (
            <Text style={[styles.headerStatus, isTyping && styles.headerTyping]}>
              {statusText}
            </Text>
          ) : null}
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.flex1}>
          {loading ? (
            <ChatSkeletonLoader />
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item._id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>💬</Text>
                  <Text style={styles.emptyTitle}>No Messages Yet</Text>
                  <Text style={styles.emptySubtitle}>Start the conversation!</Text>
                </View>
              }
              inverted
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.3}
              ListFooterComponent={
                loadingMore ? (
                  <View style={styles.loadingMore}>
                    <Text style={styles.loadingMoreText}>Loading older messages...</Text>
                  </View>
                ) : null
              }
              // Typing bubble at the top (index 0 = bottom in inverted)
              ListHeaderComponent={
                isTyping ? (
                  <View style={styles.typingBubble}>
                    <Text style={styles.typingDots}>● ● ●</Text>
                  </View>
                ) : null
              }
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              windowSize={10}
            />
          )}
        </View>

        <ChatInput
          value={text}
          onChangeText={handleTextChange}
          onSend={sendText}
          onImagePress={pickImage}
          onVideoPress={pickVideo}
        />
      </KeyboardAvoidingView>

      <MediaModal visible={!!playVideoUrl} url={playVideoUrl} type="video" onClose={() => setPlayVideoUrl(null)} />
      <MediaModal visible={!!viewImageUrl} url={viewImageUrl} type="image" onClose={() => setViewImageUrl(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  flex1: { flex: 1 },

  // Header
  header: {
    height: normalize(60),
    flexDirection: 'row',
    alignItems: 'center',
    // paddingHorizontal: normalize(12),
    gap: normalize(10),
  },
  backBtn: { padding: normalize(4) },
  headerAvatarWrap: { position: 'relative' },
  headerAvatar: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  headerAvatarPlaceholder: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerOnlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: normalize(11),
    height: normalize(11),
    borderRadius: normalize(6),
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#6A11CB',
  },
  headerInfo: { flex: 1 },
  headerName: { fontSize: normalize(16), fontWeight: '600', color: '#fff' },
  headerStatus: { fontSize: normalize(12), color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  headerTyping: { color: '#A5F3FC' },

  // Messages
  listContent: { paddingHorizontal: normalize(12), paddingVertical: normalize(8), flexGrow: 1 },
  messageWrapper: { marginVertical: normalize(3), paddingHorizontal: normalize(4) },
  myWrapper: { alignItems: 'flex-end' },
  otherWrapper: { alignItems: 'flex-start' },

  // Typing bubble
  typingBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8E8E8',
    borderRadius: normalize(18),
    borderBottomLeftRadius: 4,
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(10),
    marginVertical: normalize(3),
    marginHorizontal: normalize(4),
  },
  typingDots: { color: '#888', fontSize: normalize(12), letterSpacing: 3 },

  // Load more
  loadingMore: { alignItems: 'center', paddingVertical: normalize(10) },
  loadingMoreText: { color: '#999', fontSize: normalize(12) },

  // Empty
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: normalize(100) },
  emptyIcon: { fontSize: normalize(56), marginBottom: normalize(12) },
  emptyTitle: { fontSize: normalize(18), fontWeight: '600', color: '#111', marginBottom: normalize(6) },
  emptySubtitle: { fontSize: normalize(13), color: '#888' },
});
