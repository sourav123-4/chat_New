import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Image, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import LinearGradient from 'react-native-linear-gradient';
import { useAppSelector } from '../../store';
import { normalize } from '../../utils/orientation';
import { BASE_URL } from '@env';

interface CallLog {
  _id: string;
  conversationId: string;
  callType: 'audio' | 'video';
  callStatus: 'answered' | 'missed' | 'declined';
  duration?: number;
  createdAt: string;
  senderId: { _id: string; name: string; avatar?: string };
  // other participant populated from conversation
  otherUser?: { _id: string; name: string; avatar?: string };
}

export default function CallHistoryScreen() {
  const { token, userId } = useAppSelector((s) => s.auth);
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();

  const fetchCallLogs = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await fetch(`${BASE_URL}/api/messages/calls`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setLogs(data?.calls ?? []);
    } catch (e) {
      console.log('[CallHistory] fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  // Refresh every time tab comes into focus
  useEffect(() => {
    if (isFocused) fetchCallLogs();
  }, [isFocused]);

  const formatDuration = (s?: number) => {
    if (!s) return '';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? ` · ${m}m ${sec}s` : ` · ${sec}s`;
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === d.toDateString();
    if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isYesterday) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderItem = useCallback(({ item }: { item: CallLog }) => {
    const isMeSender = item.senderId?._id === userId;
    const isMissed = item.callStatus === 'missed';
    const isDeclined = item.callStatus === 'declined';
    const isVideo = item.callType === 'video';
    const isBad = isMissed || isDeclined;

    // Show the OTHER person — if I sent it show otherUser, else show sender
    const person = isMeSender
      ? (item.otherUser ?? item.senderId)
      : item.senderId;

    const direction = isMeSender ? 'outgoing' : 'incoming';
    const iconColor = isBad ? '#EF4444' : direction === 'outgoing' ? '#22C55E' : '#6A11CB';
    const dirIcon = isBad
      ? 'phone-slash'
      : direction === 'outgoing'
      ? 'phone-arrow-up-right'
      : 'phone-arrow-down-left';
    const label = isMissed
      ? 'Missed'
      : isDeclined
      ? 'Declined'
      : direction === 'outgoing'
      ? 'Outgoing'
      : 'Incoming';

    return (
      <View style={styles.item}>
        <View style={styles.avatarWrap}>
          {person?.avatar
            ? <Image source={{ uri: person.avatar }} style={styles.avatar} />
            : <View style={styles.avatarPlaceholder}>
                <FontAwesome6 name="user" iconStyle="solid" size={normalize(18)} color="#fff" />
              </View>
          }
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>{person?.name ?? 'Unknown'}</Text>
          <View style={styles.subRow}>
            <FontAwesome6 name={dirIcon} iconStyle="solid" size={normalize(11)} color={iconColor} />
            <Text style={[styles.sub, { color: isBad ? '#EF4444' : '#666' }]}>
              {'  '}{label}{formatDuration(item.duration)}
            </Text>
          </View>
        </View>

        <View style={styles.right}>
          <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
          <FontAwesome6
            name={isVideo ? 'video' : 'phone'}
            iconStyle="solid"
            size={normalize(14)}
            color="#9ca3af"
          />
        </View>
      </View>
    );
  }, [userId]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#6A11CB', '#6A11CB']} style={styles.header}>
        <Text style={styles.headerTitle}>Calls</Text>
        <TouchableOpacity onPress={() => fetchCallLogs(true)} style={styles.refreshBtn}>
          <FontAwesome6 name="rotate-right" iconStyle="solid" size={normalize(16)} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6A11CB" />
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={logs.length === 0 ? styles.emptyContainer : undefined}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchCallLogs(true)}
              colors={['#6A11CB']}
              tintColor="#6A11CB"
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <FontAwesome6 name="phone-slash" iconStyle="solid" size={normalize(48)} color="#d1d5db" />
              <Text style={styles.emptyText}>No call history yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    height: normalize(56), flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: normalize(16),
  },
  headerTitle: { fontSize: normalize(18), fontWeight: '700', color: '#fff' },
  refreshBtn: { padding: normalize(6) },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  item: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: normalize(16), paddingVertical: normalize(12),
  },
  avatarWrap: { marginRight: normalize(12) },
  avatar: { width: normalize(48), height: normalize(48), borderRadius: normalize(24) },
  avatarPlaceholder: {
    width: normalize(48), height: normalize(48), borderRadius: normalize(24),
    backgroundColor: '#6A11CB', justifyContent: 'center', alignItems: 'center',
  },
  info: { flex: 1 },
  name: { fontSize: normalize(15), fontWeight: '600', color: '#111', marginBottom: normalize(3) },
  subRow: { flexDirection: 'row', alignItems: 'center' },
  sub: { fontSize: normalize(12) },
  right: { alignItems: 'flex-end', gap: normalize(4) },
  time: { fontSize: normalize(12), color: '#9ca3af' },
  separator: { height: 1, backgroundColor: '#f3f4f6', marginLeft: normalize(72) },
  emptyContainer: { flex: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: normalize(12), paddingTop: normalize(120) },
  emptyText: { fontSize: normalize(15), color: '#9ca3af' },
});
