import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useAppDispatch, useAppSelector } from '../../store';
import { endCall } from '../../store/slice/call.slice';
import { normalize } from '../../utils/orientation';
import LinearGradient from 'react-native-linear-gradient';
import { getChannel, releaseChannel } from '../../utils/helpers/socket';

export default function OutgoingCallScreen() {
  const dispatch = useAppDispatch();
  const { remoteUser, callType, isGroup, groupName, conversationId, channelName } = useAppSelector((s) => s.call);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Listen for decline from receiver via Pusher client event
  useEffect(() => {
    if (!conversationId) return;
    const chName = `private-conversation-${conversationId}`;
    const ch = getChannel(chName);

    const onDeclined = (data: any) => {
      if (data?.channelName === channelName) {
        dispatch(endCall());
      }
    };
    ch.bind('client-call_declined', onDeclined);

    return () => {
      ch.unbind('client-call_declined', onDeclined);
      releaseChannel(chName);
    };
  }, [conversationId, channelName, dispatch]);

  const name = isGroup ? groupName || 'Group Call' : remoteUser?.name || 'Unknown';
  const avatar = !isGroup ? remoteUser?.avatar : null;

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <Text style={styles.callTypeText}>
          {callType === 'video' ? 'Video Call' : 'Voice Call'}
        </Text>
        <Text style={styles.callingText}>Calling...</Text>

        <View style={styles.avatarSection}>
          <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <FontAwesome6 name={isGroup ? 'users' : 'user'} iconStyle="solid" size={normalize(48)} color="#fff" />
            </View>
          )}
        </View>

        <Text style={styles.name}>{name}</Text>

        <TouchableOpacity style={styles.endBtn} onPress={() => dispatch(endCall())}>
          <FontAwesome6 name="phone-slash" iconStyle="solid" size={normalize(28)} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: normalize(60) },
  callTypeText: { fontSize: normalize(14), color: 'rgba(255,255,255,0.6)', letterSpacing: 1 },
  callingText: { fontSize: normalize(16), color: 'rgba(255,255,255,0.8)', marginTop: normalize(4) },
  avatarSection: { alignItems: 'center', justifyContent: 'center', width: normalize(160), height: normalize(160) },
  pulseRing: {
    position: 'absolute', width: normalize(160), height: normalize(160),
    borderRadius: normalize(80), backgroundColor: 'rgba(255,255,255,0.1)',
  },
  avatar: { width: normalize(120), height: normalize(120), borderRadius: normalize(60) },
  avatarPlaceholder: {
    width: normalize(120), height: normalize(120), borderRadius: normalize(60),
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
  },
  name: { fontSize: normalize(28), fontWeight: '700', color: '#fff', textAlign: 'center' },
  endBtn: {
    width: normalize(70), height: normalize(70), borderRadius: normalize(35),
    backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#EF4444', shadowOpacity: 0.5, shadowRadius: 10, elevation: 8,
  },
});
