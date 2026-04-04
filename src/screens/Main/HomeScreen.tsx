import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Header from '../../components/Header';
import { Fonts } from '../../themes';
import { useAppDispatch, useAppSelector } from '../../store';
import { profileDetailsRequest } from '../../store/slice/user.slice';
import { chatListRequest } from '../../store/slice/chat.slice';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { normalize } from '../../utils/orientation';
import { HomeSkeletonLoader } from '../../components/SkeletonLoader';
import { useHomeSocket } from '../../utils/hooks/useHomeSocket';
import { AppStackParamList } from '../../types';
import { TickIcon } from '../../components/TickIcon';
import {
  getChatList, saveChatList, getChatListFetchedAt,
  getUnreadCount, clearUnread, incrementUnread, updateChatLastMessage,
} from '../../db/mmkv';

type HomeNavProp = NativeStackNavigationProp<AppStackParamList>;

const STALE_MS = 5 * 60 * 1000; // 5 minutes

export default function HomeScreen({ navigation }: { navigation: HomeNavProp }) {
  const dispatch = useAppDispatch();
  const isFocused = useIsFocused();
  const { userId } = useAppSelector((s) => s.auth);
  const { loading, chatListResponse } = useAppSelector((s) => s.chat);

  const [chats, setChats] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
  const [rtChats, setRtChats] = useState<Record<string, { lastMessage: any; unreadCount: number }>>({});
  const [refreshing, setRefreshing] = useState(false);

  // ── On focus: load from MMKV instantly, fetch API only if stale ──
  useEffect(() => {
    if (!isFocused) return;

    dispatch(profileDetailsRequest());

    // 1. Load from MMKV instantly
    const local = getChatList();
    if (local.length > 0) {
      setChats(local);
      seedOnlineFromChats(local);
    }

    // 2. Fetch from API only if stale or empty
    const fetchedAt = getChatListFetchedAt();
    const isStale = Date.now() - fetchedAt > STALE_MS;
    if (local.length === 0 || isStale) {
      dispatch(chatListRequest());
    }
  }, [isFocused]);

  // ── When API responds → save to MMKV + update UI ─────────────
  useEffect(() => {
    if (!chatListResponse?.chats) return;
    const apiChats = chatListResponse.chats;
    saveChatList(apiChats);
    setChats(apiChats);
    seedOnlineFromChats(apiChats);
    setRtChats({});
    setRefreshing(false);
  }, [chatListResponse]);

  const seedOnlineFromChats = (chatArr: any[]) => {
    const map: Record<string, boolean> = {};
    chatArr.forEach((chat: any) => {
      chat.userStatus?.forEach((u: any) => { map[u.userId] = u.isOnline; });
    });
    setOnlineUsers(map);
  };

  const chatIds = useMemo(() => chats.map((c: any) => c._id), [chats]);

  const handleUserOnline = useCallback((uid: string) => {
    setOnlineUsers((prev) => ({ ...prev, [uid]: true }));
  }, []);

  const handleUserOffline = useCallback((uid: string) => {
    setOnlineUsers((prev) => ({ ...prev, [uid]: false }));
  }, []);

  const handleNewMessage = useCallback((conversationId: string, message: any) => {
    // Update MMKV
    incrementUnread(conversationId);
    updateChatLastMessage(conversationId, message);

    // Update UI
    setRtChats((prev) => {
      const cur = prev[conversationId];
      return {
        ...prev,
        [conversationId]: {
          lastMessage: message,
          unreadCount: (cur?.unreadCount ?? getUnreadCount(conversationId)),
        },
      };
    });

    // Move chat to top in UI
    setChats((prev) => {
      const idx = prev.findIndex((c: any) => c._id === conversationId);
      if (idx <= 0) return prev;
      const updated = [...prev];
      const [chat] = updated.splice(idx, 1);
      return [chat, ...updated];
    });
  }, []);

  const { typingChats, rtReadChats } = useHomeSocket({
    userId, chatIds,
    onUserOnline: handleUserOnline,
    onUserOffline: handleUserOffline,
    onNewMessage: handleNewMessage,
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    dispatch(chatListRequest());
  }, [dispatch]);

  const getLastMsgText = (msg: any, isTyping: boolean) => {
    if (isTyping) return 'typing...';
    if (!msg) return 'Start a conversation';
    const type = msg.messageType ?? msg.file?.type;
    if (type === 'image') return '📷 Photo';
    if (type === 'video') return '🎥 Video';
    if (type === 'call') {
      const icon = msg.callType === 'video' ? '📹' : '📞';
      if (msg.callStatus === 'missed') return `${icon} Missed call`;
      if (msg.callStatus === 'declined') return `${icon} Declined`;
      return `${icon} ${msg.callType === 'video' ? 'Video' : 'Voice'} call`;
    }
    return msg.text || 'Start a conversation';
  };

  const getLastMsgType = (msg: any) => msg?.messageType ?? msg?.file?.type ?? null;

  const renderItem = ({ item }: any) => {
    const isGroup = item.isGroup;
    const chatUser = isGroup ? null : item.participants?.find((p: any) => p._id !== userId);
    const chatName = isGroup ? item.groupName || 'Group Chat' : chatUser?.name || chatUser?.email || 'User';
    const chatAvatar = chatUser?.avatar ?? null;

    const otherUserStatus = item.userStatus?.find((u: any) => u.userId !== userId);
    const isOnline = chatUser ? (onlineUsers[chatUser._id] ?? otherUserStatus?.isOnline ?? false) : false;
    const isTyping = !!typingChats[item._id];

    const rt = rtChats[item._id];
    const lastMsg = rt?.lastMessage ?? item.lastMessage;
    // unreadCount: realtime override OR from MMKV
    const unreadCount = rt?.unreadCount ?? getUnreadCount(item._id);
    const isMe = item.lastMessageSenderId === userId;
    const msgStatus = rtReadChats[item._id] ?? (rt?.lastMessage?.status ?? item.lastMessageStatus);
    const lastMsgTime = (lastMsg?.createdAt ?? item.lastMessageAt)
      ? new Date(lastMsg?.createdAt ?? item.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';
    const hasUnread = unreadCount > 0;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => {
          // Clear unread
          clearUnread(item._id);
          setRtChats((prev) => ({
            ...prev,
            [item._id]: { lastMessage: lastMsg, unreadCount: 0 },
          }));
          navigation.navigate('Chat', {
            chatId: item._id,
            chatUser: isGroup ? null : {
              ...chatUser, isOnline,
              lastSeen: isOnline ? null : otherUserStatus?.lastSeen ?? null,
            },
            isGroupChat: isGroup,
            groupName: item.groupName,
          });
        }}
      >
        <View style={styles.avatarWrap}>
          {chatAvatar ? (
            <Image source={{ uri: chatAvatar }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <FontAwesome6 name={isGroup ? 'users' : 'user'} iconStyle="solid" size={18} color="#fff" />
            </View>
          )}
          {isOnline && <View style={styles.onlineDot} />}
        </View>

        <View style={styles.cardContent}>
          <View style={styles.row}>
            <Text style={[styles.chatName, hasUnread && styles.chatNameBold]} numberOfLines={1}>
              {chatName}
            </Text>
            <Text style={[styles.time, hasUnread && styles.timeBold]}>{lastMsgTime}</Text>
          </View>
          <View style={styles.row}>
            <View style={styles.previewRow}>
              {isMe && !isTyping && !hasUnread && msgStatus && (
                <View style={{ marginRight: normalize(3) }}>
                  <TickIcon status={msgStatus} theme="dark" />
                </View>
              )}
              {!isTyping && getLastMsgType(lastMsg) === 'image' && (
                <FontAwesome6 name="image" iconStyle="solid" size={normalize(12)} color={hasUnread ? '#6A11CB' : '#aaa'} style={{ marginRight: normalize(3) }} />
              )}
              {!isTyping && getLastMsgType(lastMsg) === 'video' && (
                <FontAwesome6 name="video" iconStyle="solid" size={normalize(12)} color={hasUnread ? '#6A11CB' : '#aaa'} style={{ marginRight: normalize(3) }} />
              )}
              <Text
                style={[styles.preview, hasUnread && styles.previewUnread, isTyping && styles.previewTyping]}
                numberOfLines={1}
              >
                {getLastMsgText(lastMsg, isTyping)}
              </Text>
            </View>
            {hasUnread && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const showSkeleton = loading && chats.length === 0;

  return (
    <SafeAreaView style={styles.safe}>
      <Header showBack={false} title="Chats" />
      {showSkeleton ? (
        <HomeSkeletonLoader />
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item._id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6A11CB']} tintColor="#6A11CB" />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyTitle}>No Chats Yet</Text>
              <Text style={styles.emptySub}>Add friends to start chatting</Text>
            </View>
          }
        />
      )}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddFriends')}>
        <FontAwesome6 name="plus" iconStyle="solid" size={22} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FA' },
  list: { padding: normalize(12), paddingBottom: normalize(80) },
  card: {
    flexDirection: 'row', alignItems: 'center', padding: normalize(12),
    backgroundColor: '#fff', borderRadius: normalize(14), marginBottom: normalize(8),
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  avatarWrap: { position: 'relative', marginRight: normalize(12) },
  avatarImg: { width: normalize(52), height: normalize(52), borderRadius: normalize(26) },
  avatarPlaceholder: { width: normalize(52), height: normalize(52), borderRadius: normalize(26), backgroundColor: '#6A11CB', justifyContent: 'center', alignItems: 'center' },
  onlineDot: { position: 'absolute', bottom: 2, right: 2, width: normalize(13), height: normalize(13), borderRadius: normalize(7), backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#fff' },
  cardContent: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: normalize(3) },
  chatName: { fontSize: normalize(15), fontWeight: '500', color: '#555', flex: 1, marginRight: normalize(8) },
  chatNameBold: { fontWeight: '700', color: '#111' },
  time: { fontSize: normalize(11), color: '#aaa' },
  timeBold: { color: '#6A11CB', fontWeight: '600' },
  previewRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  preview: { fontSize: normalize(13), color: '#aaa', flex: 1 },
  previewUnread: { color: '#111', fontWeight: '600' },
  previewTyping: { color: '#6A11CB', fontStyle: 'italic' },
  badge: { backgroundColor: '#6A11CB', borderRadius: normalize(10), minWidth: normalize(20), height: normalize(20), justifyContent: 'center', alignItems: 'center', paddingHorizontal: normalize(5), marginLeft: normalize(6) },
  badgeText: { color: '#fff', fontSize: normalize(11), fontWeight: '700' },
  fab: { position: 'absolute', bottom: normalize(30), right: normalize(20), width: normalize(56), height: normalize(56), borderRadius: normalize(28), backgroundColor: '#6A11CB', justifyContent: 'center', alignItems: 'center', shadowColor: '#6A11CB', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: normalize(100) },
  emptyIcon: { fontSize: normalize(56), marginBottom: normalize(12) },
  emptyTitle: { fontSize: normalize(18), fontWeight: '600', color: '#111', marginBottom: normalize(6) },
  emptySub: { fontSize: normalize(13), color: '#888', fontFamily: Fonts.DMSans_Regular },
});
