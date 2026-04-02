import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import LinearGradient from 'react-native-linear-gradient';
import { useAppDispatch, useAppSelector } from '../../store';
import { clearCallHistory, CallHistoryItem } from '../../store/slice/call.slice';
import { normalize } from '../../utils/orientation';

export default function CallHistoryScreen() {
  const dispatch = useAppDispatch();
  const history = useAppSelector((s) => s.call.history);

  const formatDuration = (s?: number) => {
    if (!s) return '';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getIcon = (item: CallHistoryItem) => {
    if (item.status === 'missed') return { name: 'phone-missed', color: '#EF4444' };
    if (item.direction === 'outgoing') return { name: 'phone-arrow-up-right', color: '#22C55E' };
    return { name: 'phone-arrow-down-left', color: '#6A11CB' };
  };

  const renderItem = useCallback(({ item }: { item: CallHistoryItem }) => {
    const icon = getIcon(item);
    return (
      <View style={styles.item}>
        <View style={styles.avatarWrap}>
          {item.callerAvatar
            ? <Image source={{ uri: item.callerAvatar }} style={styles.avatar} />
            : <View style={styles.avatarPlaceholder}>
                <FontAwesome6 name="user" iconStyle="solid" size={normalize(18)} color="#fff" />
              </View>
          }
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>{item.callerName}</Text>
          <View style={styles.row}>
            <FontAwesome6 name={icon.name} iconStyle="solid" size={normalize(11)} color={icon.color} />
            <Text style={[styles.sub, { color: item.status === 'missed' ? '#EF4444' : '#666' }]}>
              {'  '}{item.status === 'missed' ? 'Missed' : item.direction === 'outgoing' ? 'Outgoing' : 'Incoming'}
              {item.duration ? `  ·  ${formatDuration(item.duration)}` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.right}>
          <Text style={styles.time}>{formatTime(item.timestamp)}</Text>
          <FontAwesome6
            name={item.callType === 'video' ? 'video' : 'phone'}
            iconStyle="solid"
            size={normalize(14)}
            color="#9ca3af"
          />
        </View>
      </View>
    );
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#6A11CB', '#6A11CB']} style={styles.header}>
        <Text style={styles.headerTitle}>Call History</Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={() => dispatch(clearCallHistory())} style={styles.clearBtn}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={history.length === 0 && styles.emptyContainer}
        ListEmptyComponent={
          <View style={styles.empty}>
            <FontAwesome6 name="phone-slash" iconStyle="solid" size={normalize(48)} color="#d1d5db" />
            <Text style={styles.emptyText}>No call history yet</Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
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
  clearBtn: { padding: normalize(6) },
  clearText: { fontSize: normalize(14), color: 'rgba(255,255,255,0.85)' },
  item: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: normalize(16), paddingVertical: normalize(12),
  },
  avatarWrap: { marginRight: normalize(12) },
  avatar: { width: normalize(46), height: normalize(46), borderRadius: normalize(23) },
  avatarPlaceholder: {
    width: normalize(46), height: normalize(46), borderRadius: normalize(23),
    backgroundColor: '#6A11CB', justifyContent: 'center', alignItems: 'center',
  },
  info: { flex: 1 },
  name: { fontSize: normalize(15), fontWeight: '600', color: '#111', marginBottom: normalize(3) },
  row: { flexDirection: 'row', alignItems: 'center' },
  sub: { fontSize: normalize(12) },
  right: { alignItems: 'flex-end', gap: normalize(4) },
  time: { fontSize: normalize(12), color: '#9ca3af' },
  separator: { height: 1, backgroundColor: '#f3f4f6', marginLeft: normalize(74) },
  emptyContainer: { flex: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: normalize(12), paddingTop: normalize(120) },
  emptyText: { fontSize: normalize(15), color: '#9ca3af' },
});
