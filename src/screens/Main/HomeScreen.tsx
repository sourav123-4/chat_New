import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
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

type HomeNavProp = NativeStackNavigationProp<AppStackParamList>;

export default function HomeScreen({ navigation }: { navigation: HomeNavProp }) {
  const dispatch = useAppDispatch();
  const isFocused = useIsFocused();
  const { userId } = useAppSelector((s) => s.auth);
  const { loading, chatListResponse } = useAppSelector((s) => s.chat);

  // online map: { [otherUserId]: boolean }
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});

  // realtime overrides per chatId: { lastMessage, unreadCount }
  const [rtChats, setRtChats] = useState<Record<string, { lastMessage: any; unreadCount: number }>>({});

  // typing per chatId — comes from useHomeSocket
  useEffect(() => {
    if (isFocused) {
      dispatch(profileDetailsRequest());
      dispatch(chatListRequest());
    }
  }, [isFocused, dispatch]);

  // Seed online state from userStatus in API response
  useEffect(() => {
    if (!chatListResponse?.chats) return;
    const map: Record<string, boolean> = {};
    chatListResponse.chats.forEach((chat: any) => {
      // userStatus: [{ userId, isOnline, lastSeen }]
      chat.userStatus?.forEach((u: any) => {
        map[u.userId] = u.isOnline;
      });
    });
    setOnlineUsers(map);
    setRtChats({});
  }, [chatListResponse]);

  const chatIds = useMemo(
    () => (chatListResponse?.chats ?? []).map((c: any) => c._id),
    [chatListResponse]
  );

  const handleUserOnline = useCallback((uid: string) => {
    setOnlineUsers((prev) => ({ ...prev, [uid]: true }));
  }, []);

  const handleUserOffline = useCallback((uid: string) => {
    setOnlineUsers((prev) => ({ ...prev, [uid]: false }));
  }, []);

  const handleNewMessage = useCallback((conversationId: string, message: any) => {
    setRtChats((prev) => {
      const cur = prev[conversationId];
      return {
        ...prev,
        [conversationId]: {
          lastMessage: message,
          unreadCount: (cur?.unreadCount ?? 0) + 1,
        },
      };
    });
  }, []);

  const { typingChats, rtReadChats } = useHomeSocket({
    userId,
    chatIds,
    onUserOnline: handleUserOnline,
    onUserOffline: handleUserOffline,
    onNewMessage: handleNewMessage,
  });

  const getLastMsgText = (msg: any) => {
    if (!msg) return 'Start a conversation';
    const type = msg.messageType ?? msg.file?.type;
    if (type === 'image') return 'Photo';
    if (type === 'video') return 'Video';
    return msg.text || 'Start a conversation';
  };

  const getLastMsgType = (msg: any) => msg?.messageType ?? msg?.file?.type ?? null;

  const renderItem = ({ item }: any) => {
    const isGroup = item.isGroup;
    const chatUser = isGroup
      ? null
      : item.participants?.find((p: any) => p._id !== userId);

    const chatName = isGroup
      ? item.groupName || 'Group Chat'
      : chatUser?.name || chatUser?.email || 'User';
    const chatAvatar = chatUser?.avatar ?? null;

    // Online: check userStatus array — find the OTHER user's status
    const otherUserStatus = item.userStatus?.find((u: any) => u.userId !== userId);
    const isOnline = chatUser ? (onlineUsers[chatUser._id] ?? otherUserStatus?.isOnline ?? false) : false;

    const rt = rtChats[item._id];
    const isTyping = !!typingChats[item._id];

    // Use realtime last message if available, else API fields
    const lastMsg = rt?.lastMessage ?? item.lastMessage;
    const unreadCount = rt?.unreadCount ?? 0;

    // lastMessageSenderId is a plain string in the API response
    const isMe = item.lastMessageSenderId === userId;
    // Use lastMessageStatus — override with instant read if available
    const msgStatus = rtReadChats[item._id] ?? (rt?.lastMessage?.status ?? item.lastMessageStatus);

    const lastMsgTime = (lastMsg?.createdAt ?? item.lastMessageAt)
      ? new Date(lastMsg?.createdAt ?? item.lastMessageAt).toLocaleTimeString([], {
          hour: '2-digit', minute: '2-digit',
        })
      : '';

    const hasUnread = unreadCount > 0;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => {
          // Clear unread locally
          setRtChats((prev) => ({
            ...prev,
            [item._id]: { lastMessage: lastMsg, unreadCount: 0 },
          }));
          navigation.navigate('Chat', {
            chatId: item._id,
            chatUser: isGroup ? null : {
              ...chatUser,
              isOnline,
              lastSeen: isOnline ? null : otherUserStatus?.lastSeen ?? null,
            },
            isGroupChat: isGroup,
            groupName: item.groupName,
          });
        }}
      >
        {/* Avatar + online dot */}
        <View style={styles.avatarWrap}>
          {chatAvatar ? (
            <Image source={{ uri: chatAvatar }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <FontAwesome6
                name={isGroup ? 'users' : 'user'}
                iconStyle="solid"
                size={18}
                color="#fff"
              />
            </View>
          )}
          {isOnline && <View style={styles.onlineDot} />}
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          {/* Row 1: name + time */}
          <View style={styles.row}>
            <Text style={[styles.chatName, hasUnread && styles.chatNameBold]} numberOfLines={1}>
              {chatName}
            </Text>
            <Text style={[styles.time, hasUnread && styles.timeBold]}>{lastMsgTime}</Text>
          </View>

          {/* Row 2: preview + badge */}
          <View style={styles.row}>
            <View style={styles.previewRow}>
              {/* Ticks only when I sent last msg AND no unread messages */}
              {isMe && !isTyping && !hasUnread && msgStatus && (
                <View style={{ marginRight: normalize(3) }}>
                  <TickIcon status={msgStatus} theme="dark" />
                </View>
              )}
              {/* Media icon */}
              {!isTyping && getLastMsgType(lastMsg) === 'image' && (
                <FontAwesome6 name="image" iconStyle="solid" size={normalize(12)} color={hasUnread ? '#6A11CB' : '#aaa'} style={{ marginRight: normalize(3) }} />
              )}
              {!isTyping && getLastMsgType(lastMsg) === 'video' && (
                <FontAwesome6 name="video" iconStyle="solid" size={normalize(12)} color={hasUnread ? '#6A11CB' : '#aaa'} style={{ marginRight: normalize(3) }} />
              )}
              <Text
                style={[
                  styles.preview,
                  hasUnread && styles.previewUnread,
                  isTyping && styles.previewTyping,
                ]}
                numberOfLines={1}
              >
                {isTyping ? 'typing...' : getLastMsgText(lastMsg)}
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

  return (
    <SafeAreaView style={styles.safe}>
      <Header showBack={false} title="Chats" />
      {loading ? (
        <HomeSkeletonLoader />
      ) : (
        <FlatList
          data={chatListResponse?.chats || []}
          keyExtractor={(item) => item._id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
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
    flexDirection: 'row', alignItems: 'center',
    padding: normalize(12), backgroundColor: '#fff',
    borderRadius: normalize(14), marginBottom: normalize(8),
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },

  avatarWrap: { position: 'relative', marginRight: normalize(12) },
  avatarImg: { width: normalize(52), height: normalize(52), borderRadius: normalize(26) },
  avatarPlaceholder: {
    width: normalize(52), height: normalize(52), borderRadius: normalize(26),
    backgroundColor: '#6A11CB', justifyContent: 'center', alignItems: 'center',
  },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: normalize(13), height: normalize(13), borderRadius: normalize(7),
    backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#fff',
  },

  cardContent: { flex: 1 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: normalize(3),
  },
  chatName: { fontSize: normalize(15), fontWeight: '500', color: '#555', flex: 1, marginRight: normalize(8) },
  chatNameBold: { fontWeight: '700', color: '#111' },
  time: { fontSize: normalize(11), color: '#aaa' },
  timeBold: { color: '#6A11CB', fontWeight: '600' },

  previewRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  preview: { fontSize: normalize(13), color: '#aaa', flex: 1 },
  previewUnread: { color: '#111', fontWeight: '600' },
  previewTyping: { color: '#6A11CB', fontStyle: 'italic' },


  badge: {
    backgroundColor: '#6A11CB', borderRadius: normalize(10),
    minWidth: normalize(20), height: normalize(20),
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: normalize(5), marginLeft: normalize(6),
  },
  badgeText: { color: '#fff', fontSize: normalize(11), fontWeight: '700' },

  fab: {
    position: 'absolute', bottom: normalize(30), right: normalize(20),
    width: normalize(56), height: normalize(56), borderRadius: normalize(28),
    backgroundColor: '#6A11CB', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#6A11CB', shadowOpacity: 0.4, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: normalize(100) },
  emptyIcon: { fontSize: normalize(56), marginBottom: normalize(12) },
  emptyTitle: { fontSize: normalize(18), fontWeight: '600', color: '#111', marginBottom: normalize(6) },
  emptySub: { fontSize: normalize(13), color: '#888', fontFamily: Fonts.DMSans_Regular },
});
