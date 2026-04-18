import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { RTCView, MediaStream } from 'react-native-webrtc';
import { useAppDispatch, useAppSelector } from '../../store';
import { endCall, toggleMute, toggleSpeaker, toggleCamera } from '../../store/slice/call.slice';
import { messegeSendRequest } from '../../store/slice/messege.slice';
import { normalize } from '../../utils/orientation';
import { signalCall, extractConversationId, connectPusher } from '../../utils/helpers/socket';
import { WebRTCService } from '../../utils/helpers/WebRTCService';
import LinearGradient from 'react-native-linear-gradient';

export default function ActiveCallScreen() {
  const dispatch = useAppDispatch();
  const {
    callType, channelName, token, uid,
    remoteUser, isGroup, groupName,
    isMuted, isSpeakerOn, isCameraOff,
    callStartedAt, conversationId, autoAccepted, isCaller,
  } = useAppSelector((s) => s.call);

  const webrtcRef = useRef<WebRTCService | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const isVideo = callType === 'video';
  const resolvedConvId = conversationId || extractConversationId(channelName ?? '');

  const name = isGroup ? groupName || 'Group Call' : remoteUser?.name || 'Unknown';
  const avatar = !isGroup ? remoteUser?.avatar : null;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  useEffect(() => {
    const t = setInterval(() => {
      if (callStartedAt) setElapsed(Math.floor((Date.now() - callStartedAt) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [callStartedAt]);

  // ── Start WebRTC ──────────────────────────────────────────────
  useEffect(() => {
    if (!resolvedConvId) return;

    // autoAccepted=true means receiver accepted from notification = not caller
    // autoAccepted=false + incoming = receiver who accepted in-app
    // The caller always has autoAccepted=false and was the one who initiated
    // We track this via the call slice: startOutgoingCall sets a flag
    const amICaller = isCaller;

    const service = new WebRTCService(
      resolvedConvId,
      isVideo,
      amICaller,
      {
        onRemoteStream: (stream) => {
          console.log('[WebRTC] got remote stream');
          setRemoteStream(stream);
        },
        onCallEnded: () => {
          saveCallMessage('answered');
          dispatch(endCall());
        },
      }
    );

    webrtcRef.current = service;

    service.start().then((stream) => {
      setLocalStream(stream);
    }).catch(e => {
      console.log('[WebRTC] start error:', e);
    });

    return () => {
      service.stop();
      webrtcRef.current = null;
    };
  }, []);

  // ── Pusher: other side ends call ──────────────────────────────
  useEffect(() => {
    if (!resolvedConvId || !channelName) return;
    const pusher = connectPusher();
    const ch = pusher.subscribe(`private-conversation-${resolvedConvId}`);
    const onEnded = () => {
      webrtcRef.current?.stop();
      saveCallMessage('answered');
      dispatch(endCall());
    };
    ch.bind('call_ended', onEnded);
    ch.bind('client-call_ended', onEnded);
    return () => {
      ch.unbind('call_ended', onEnded);
      ch.unbind('client-call_ended', onEnded);
    };
  }, [resolvedConvId, channelName]);

  // ── Sync controls ─────────────────────────────────────────────
  useEffect(() => { webrtcRef.current?.toggleMute(isMuted); }, [isMuted]);
  useEffect(() => { webrtcRef.current?.toggleCamera(isCameraOff); }, [isCameraOff]);
  useEffect(() => { webrtcRef.current?.toggleSpeaker(isSpeakerOn); }, [isSpeakerOn]);

  const saveCallMessage = useCallback((callStatus: string) => {
    const convId = resolvedConvId;
    const dur = callStartedAt ? Math.floor((Date.now() - callStartedAt) / 1000) : 0;
    if (convId) {
      dispatch(messegeSendRequest({
        conversationId: convId, messageType: 'call',
        callType, callStatus, duration: dur,
      }));
    }
  }, [resolvedConvId, callType, callStartedAt, dispatch]);

  const handleEndCall = useCallback(async () => {
    const convId = resolvedConvId;
    const chName = channelName;
    if (convId && chName) {
      try { await signalCall(convId, 'ended', chName); } catch {}
    }
    webrtcRef.current?.stop();
    dispatch(endCall());
    saveCallMessage('answered');
  }, [resolvedConvId, channelName, dispatch, saveCallMessage]);

  return (
    <View style={styles.container}>

      {/* ── Remote video / audio background ── */}
      {isVideo && remoteStream ? (
        <RTCView
          streamURL={remoteStream.toURL()}
          style={styles.full}
          objectFit="cover"
          mirror={false}
        />
      ) : (
        <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.full}>
          <View style={styles.center}>
            {avatar
              ? <Image source={{ uri: avatar }} style={styles.avatar} />
              : <View style={styles.avatarPlaceholder}>
                  <FontAwesome6 name="user" iconStyle="solid" size={normalize(48)} color="#fff" />
                </View>
            }
            <Text style={styles.remoteName}>{name}</Text>
            <Text style={styles.timerText}>
              {remoteStream ? formatTime(elapsed) : 'Connecting...'}
            </Text>
          </View>
        </LinearGradient>
      )}

      {/* ── Local video PiP ── */}
      {isVideo && localStream && !isCameraOff && (
        <RTCView
          streamURL={localStream.toURL()}
          style={styles.localVideo}
          objectFit="cover"
          mirror={true}
          zOrder={1}
        />
      )}

      {/* ── Overlay timer ── */}
      {isVideo && remoteStream && (
        <SafeAreaView style={styles.overlay} edges={['top']}>
          <Text style={styles.overlayName}>{name}</Text>
          <Text style={styles.overlayTimer}>{formatTime(elapsed)}</Text>
        </SafeAreaView>
      )}

      {/* ── Controls ── */}
      <SafeAreaView style={styles.controls} edges={['bottom']}>
        <View style={styles.controlRow}>

          <View style={styles.controlWrap}>
            <TouchableOpacity style={[styles.btn, isMuted && styles.btnActive]} onPress={() => dispatch(toggleMute())}>
              <FontAwesome6 name={isMuted ? 'microphone-slash' : 'microphone'} iconStyle="solid" size={normalize(22)} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.btnLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
          </View>

          <View style={styles.controlWrap}>
            <TouchableOpacity style={[styles.btn, isSpeakerOn && styles.btnActive]} onPress={() => dispatch(toggleSpeaker())}>
              <FontAwesome6 name={isSpeakerOn ? 'volume-high' : 'volume-xmark'} iconStyle="solid" size={normalize(22)} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.btnLabel}>{isSpeakerOn ? 'Speaker' : 'Earpiece'}</Text>
          </View>

          {isVideo && (
            <View style={styles.controlWrap}>
              <TouchableOpacity style={[styles.btn, isCameraOff && styles.btnActive]} onPress={() => dispatch(toggleCamera())}>
                <FontAwesome6 name={isCameraOff ? 'video-slash' : 'video'} iconStyle="solid" size={normalize(22)} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.btnLabel}>{isCameraOff ? 'Cam Off' : 'Camera'}</Text>
            </View>
          )}

          {isVideo && (
            <View style={styles.controlWrap}>
              <TouchableOpacity style={styles.btn} onPress={() => webrtcRef.current?.switchCamera()}>
                <FontAwesome6 name="rotate" iconStyle="solid" size={normalize(22)} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.btnLabel}>Flip</Text>
            </View>
          )}

        </View>

        <TouchableOpacity style={styles.endBtn} onPress={handleEndCall}>
          <FontAwesome6 name="phone-slash" iconStyle="solid" size={normalize(28)} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>

    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  full: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: normalize(16) },
  avatar: { width: normalize(120), height: normalize(120), borderRadius: normalize(60) },
  avatarPlaceholder: {
    width: normalize(120), height: normalize(120), borderRadius: normalize(60),
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
  },
  remoteName: { fontSize: normalize(24), fontWeight: '700', color: '#fff' },
  timerText: { fontSize: normalize(16), color: 'rgba(255,255,255,0.7)' },
  localVideo: {
    position: 'absolute', top: normalize(60), right: normalize(16),
    width: normalize(100), height: normalize(140),
    borderRadius: normalize(12), overflow: 'hidden',
    borderWidth: 2, borderColor: '#fff', zIndex: 10,
  },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: normalize(16), paddingTop: normalize(8) },
  overlayName: { fontSize: normalize(18), fontWeight: '600', color: '#fff' },
  overlayTimer: { fontSize: normalize(14), color: 'rgba(255,255,255,0.7)' },
  controls: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: normalize(24), paddingTop: normalize(20),
  },
  controlRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: normalize(24) },
  controlWrap: { alignItems: 'center', gap: normalize(6) },
  btn: {
    width: normalize(56), height: normalize(56), borderRadius: normalize(28),
    backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center',
  },
  btnActive: { backgroundColor: 'rgba(255,255,255,0.5)' },
  btnLabel: { fontSize: normalize(11), color: 'rgba(255,255,255,0.7)' },
  endBtn: {
    alignSelf: 'center', width: normalize(70), height: normalize(70),
    borderRadius: normalize(35), backgroundColor: '#EF4444',
    justifyContent: 'center', alignItems: 'center', marginBottom: normalize(16),
    shadowColor: '#EF4444', shadowOpacity: 0.5, shadowRadius: 10, elevation: 8,
  },
});
