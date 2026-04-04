import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useAppDispatch, useAppSelector } from '../../store';
import { endCall, callConnected } from '../../store/slice/call.slice';
import { messegeSendRequest } from '../../store/slice/messege.slice';
import { normalize } from '../../utils/orientation';
import LinearGradient from 'react-native-linear-gradient';
import { signalCall, extractConversationId } from '../../utils/helpers/socket';

export default function IncomingCallScreen() {
  const dispatch = useAppDispatch();
  const { remoteUser, callType, isGroup, groupName, channelName, conversationId, autoAccepted } =
    useAppSelector((s) => s.call);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Use conversationId from Redux, or extract it from channelName as fallback
  const resolvedConversationId = conversationId || extractConversationId(channelName ?? '');

  useEffect(() => {
    // If accepted from notification action button, skip the screen and go active
    if (autoAccepted) {
      console.log('[IncomingCall] autoAccepted — going straight to active');
      Vibration.cancel();
      dispatch(callConnected());
      return;
    }

    Vibration.vibrate([500, 1000, 500, 1000], true);
    Animated.loop(
      Animated.sequence([
        Animated.timing(slideAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      ])
    ).start();
    return () => Vibration.cancel();
  }, [autoAccepted]);

  const handleDecline = async () => {
    Vibration.cancel();
    const convId = resolvedConversationId;
    const chName = channelName;
    const cType = callType;
    if (convId && chName) {
      try {
        const res = await signalCall(convId, 'declined', chName);
        console.log('[IncomingCall] signalCall declined status:', res.status);
      } catch (e) {
        console.error('[IncomingCall] signalCall declined error:', e);
      }
    }
    dispatch(endCall());
    if (convId) {
      dispatch(messegeSendRequest({
        conversationId: convId,
        messageType: 'call',
        callType: cType,
        callStatus: 'declined',
        duration: 0,
      }));
    }
  };

  const handleAccept = async () => {
    Vibration.cancel();
    console.log('[IncomingCall] Accept — resolvedConversationId:', resolvedConversationId, 'channelName:', channelName);
    if (resolvedConversationId && channelName) {
      try {
        const res = await signalCall(resolvedConversationId, 'accepted', channelName);
        console.log('[IncomingCall] signalCall accepted status:', res.status);
      } catch (e) {
        console.error('[IncomingCall] signalCall accepted error:', e);
      }
    }
    dispatch(callConnected());
  };

  // Don't render if autoAccepted (will transition immediately)
  if (autoAccepted) return null;

  const name = isGroup ? groupName || 'Group Call' : remoteUser?.name || 'Unknown';
  const avatar = !isGroup ? remoteUser?.avatar : null;

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <Text style={styles.incomingText}>
          Incoming {callType === 'video' ? 'Video' : 'Voice'} Call
        </Text>

        <Animated.View style={[styles.avatarSection, { transform: [{ translateX: slideAnim }] }]}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <FontAwesome6 name={isGroup ? 'users' : 'user'} iconStyle="solid" size={normalize(48)} color="#fff" />
            </View>
          )}
        </Animated.View>

        <Text style={styles.name}>{name}</Text>

        <View style={styles.actions}>
          <View style={styles.actionWrap}>
            <TouchableOpacity style={[styles.actionBtn, styles.declineBtn]} onPress={handleDecline}>
              <FontAwesome6 name="phone-slash" iconStyle="solid" size={normalize(28)} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.actionLabel}>Decline</Text>
          </View>

          <View style={styles.actionWrap}>
            <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={handleAccept}>
              <FontAwesome6
                name={callType === 'video' ? 'video' : 'phone'}
                iconStyle="solid"
                size={normalize(28)}
                color="#fff"
              />
            </TouchableOpacity>
            <Text style={styles.actionLabel}>Accept</Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: normalize(60) },
  incomingText: { fontSize: normalize(14), color: 'rgba(255,255,255,0.6)', letterSpacing: 1 },
  avatarSection: { alignItems: 'center' },
  avatar: { width: normalize(130), height: normalize(130), borderRadius: normalize(65) },
  avatarPlaceholder: {
    width: normalize(130), height: normalize(130), borderRadius: normalize(65),
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
  },
  name: { fontSize: normalize(28), fontWeight: '700', color: '#fff', textAlign: 'center' },
  actions: { flexDirection: 'row', gap: normalize(60) },
  actionWrap: { alignItems: 'center', gap: normalize(8) },
  actionBtn: {
    width: normalize(70), height: normalize(70), borderRadius: normalize(35),
    justifyContent: 'center', alignItems: 'center',
    shadowOpacity: 0.5, shadowRadius: 10, elevation: 8,
  },
  declineBtn: { backgroundColor: '#EF4444', shadowColor: '#EF4444' },
  acceptBtn: { backgroundColor: '#22C55E', shadowColor: '#22C55E' },
  actionLabel: { fontSize: normalize(13), color: 'rgba(255,255,255,0.7)' },
});
