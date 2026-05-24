import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useAppDispatch, useAppSelector } from '../../store';
import { endCall, callConnected } from '../../store/slice/call.slice';
import { messegeSendRequest } from '../../store/slice/messege.slice';
import { normalize } from '../../utils/orientation';
import LinearGradient from 'react-native-linear-gradient';
import { connectPusher, signalCall } from '../../utils/helpers/socket';

export default function OutgoingCallScreen() {
  const dispatch = useAppDispatch();
  const { remoteUser, callType, isGroup, groupName, conversationId, channelName } = useAppSelector((s) => s.call);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const closedRef = useRef(false);

  const finishOutgoing = async (callStatus: 'missed' | 'declined') => {
    if (closedRef.current) return;
    closedRef.current = true;

    if (conversationId && channelName) {
      try { await signalCall(conversationId, 'ended', channelName); } catch {}
      dispatch(messegeSendRequest({
        conversationId,
        messageType: 'call',
        callType,
        callStatus,
        duration: 0,
      }));
    }
    dispatch(endCall());
  };

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

  useEffect(() => {
    const timeout = setTimeout(() => {
      finishOutgoing('missed');
    }, 45_000);
    return () => clearTimeout(timeout);
  }, [conversationId, channelName, callType]);

  useEffect(() => {
    console.log('[OutgoingCall] conversationId:', conversationId, 'channelName:', channelName);
    if (!conversationId || !channelName) {
      console.warn('[OutgoingCall] Missing conversationId or channelName — cannot listen for signals');
      return;
    }

    const pusher = connectPusher();
    const chName = `private-conversation-${conversationId}`;
    console.log('[OutgoingCall] Subscribing to Pusher channel:', chName);

    const ch = pusher.subscribe(chName);

    ch.bind('pusher:subscription_succeeded', () => {
      console.log('[OutgoingCall] ✅ Subscribed to:', chName);
    });

    ch.bind('pusher:subscription_error', (err: any) => {
      console.error('[OutgoingCall] ❌ Subscription error:', err);
    });

    // Catch ALL events on this channel for debugging
    ch.bind_global((event: string, data: any) => {
      console.log('[OutgoingCall] 📡 Pusher event received:', event, JSON.stringify(data));
    });

    const onAccepted = (data: any) => {
      console.log('[OutgoingCall] call_accepted received, data:', JSON.stringify(data), 'expected channelName:', channelName);
      closedRef.current = true;
      dispatch(callConnected());
    };

    const onDeclined = (data: any) => {
      console.log('[OutgoingCall] call_declined received, data:', JSON.stringify(data), 'expected channelName:', channelName);
      closedRef.current = true;
      dispatch(endCall());
    };

    const onEnded = (data: any) => {
      console.log('[OutgoingCall] call_ended received:', JSON.stringify(data));
      closedRef.current = true;
      dispatch(endCall());
    };

    ch.bind('call_accepted', onAccepted);
    ch.bind('call_declined', onDeclined);
    ch.bind('call_ended', onEnded);
    ch.bind('client-call_accepted', onAccepted);
    ch.bind('client-call_declined', onDeclined);
    ch.bind('client-call_ended', onEnded);

    return () => {
      ch.unbind_global();
      ch.unbind('call_accepted', onAccepted);
      ch.unbind('call_declined', onDeclined);
      ch.unbind('call_ended', onEnded);
      ch.unbind('client-call_accepted', onAccepted);
      ch.unbind('client-call_declined', onDeclined);
      ch.unbind('client-call_ended', onEnded);
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

        <TouchableOpacity style={styles.endBtn} onPress={() => finishOutgoing('declined')}>
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
