import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import {
  createAgoraRtcEngine,
  IRtcEngine,
  RtcSurfaceView,
  ChannelProfileType,
  ClientRoleType,
  VideoSourceType,
  RenderModeType,
  RtcConnection,
  UserOfflineReasonType,
} from 'react-native-agora';
import { useAppDispatch, useAppSelector } from '../../store';
import { endCall, toggleMute, toggleSpeaker, toggleCamera } from '../../store/slice/call.slice';
import { messegeSendRequest } from '../../store/slice/messege.slice';
import { normalize } from '../../utils/orientation';
import { AGORA_APP_ID_VALUE } from '../../utils/helpers/agora';
import { signalCall, extractConversationId, connectPusher } from '../../utils/helpers/socket';
import LinearGradient from 'react-native-linear-gradient';

export default function ActiveCallScreen() {
  const dispatch = useAppDispatch();
  const {
    callType, channelName, token, uid,
    remoteUser, isGroup, groupName,
    isMuted, isSpeakerOn, isCameraOff,
    callStartedAt, conversationId,
  } = useAppSelector((s) => s.call);

  const engine = useRef<IRtcEngine | null>(null);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [engineReady, setEngineReady] = useState(false);

  const isVideo = callType === 'video';
  const resolvedConversationId = conversationId || extractConversationId(channelName ?? '');

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (callStartedAt) setElapsed(Math.floor((Date.now() - callStartedAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [callStartedAt]);

  // Phase 1: init engine, register handlers, enable media, startPreview
  useEffect(() => {
    const eng = createAgoraRtcEngine();
    engine.current = eng;

    eng.initialize({ appId: AGORA_APP_ID_VALUE });
    eng.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);

    eng.registerEventHandler({
      onJoinChannelSuccess: (_connection: RtcConnection, _elapsed: number) => {
        console.log('[Agora] joined channel successfully');
        eng.setEnableSpeakerphone(true);
      },
      onUserJoined: (_connection: RtcConnection, rUid: number, _elapsed: number) => {
        console.log('[Agora] remote user joined:', rUid);
        setRemoteUid(rUid);
      },
      onUserOffline: (_connection: RtcConnection, rUid: number, _reason: UserOfflineReasonType) => {
        console.log('[Agora] remote user offline:', rUid);
        setRemoteUid(null);
        // Capture before endCall clears state
        const convId = resolvedConversationId;
        const cType = callType;
        const dur = callStartedAt ? Math.floor((Date.now() - callStartedAt) / 1000) : 0;
        dispatch(endCall());
        if (convId) {
          dispatch(messegeSendRequest({
            conversationId: convId,
            messageType: 'call',
            callType: cType,
            callStatus: 'answered',
            duration: dur,
          }));
        }
      },
      onError: (err: number, msg: string) => {
        console.log('[Agora] error:', err, msg);
      },
    });

    if (isVideo) {
      eng.enableVideo();
      eng.enableAudio();
      eng.startPreview();
    } else {
      eng.enableAudio();
    }

    // Signal React to mount the RtcSurfaceViews
    setEngineReady(true);

    return () => {
      eng.leaveChannel();
      eng.release();
      engine.current = null;
    };
  }, []);

  // Phase 2: join AFTER views are mounted in DOM
  useEffect(() => {
    if (!engineReady || !engine.current) return;
    engine.current.joinChannel(token ?? '', channelName ?? '', uid ?? 0, {
      clientRoleType: ClientRoleType.ClientRoleBroadcaster,
      publishCameraTrack: isVideo,
      publishMicrophoneTrack: true,
      autoSubscribeAudio: true,
      autoSubscribeVideo: isVideo,
    });
  }, [engineReady]);

  // Pusher: other side ends call
  useEffect(() => {
    if (!resolvedConversationId || !channelName) return;
    const pusher = connectPusher();
    const chName = `private-conversation-${resolvedConversationId}`;
    const ch = pusher.subscribe(chName);
    const onEnded = () => {
      engine.current?.leaveChannel();
      dispatch(endCall());
    };
    ch.bind('call_ended', onEnded);
    ch.bind('client-call_ended', onEnded);
    return () => {
      ch.unbind('call_ended', onEnded);
      ch.unbind('client-call_ended', onEnded);
    };
  }, [resolvedConversationId, channelName, dispatch]);

  // Sync controls
  useEffect(() => { engine.current?.muteLocalAudioStream(isMuted); }, [isMuted]);
  useEffect(() => { engine.current?.setEnableSpeakerphone(isSpeakerOn); }, [isSpeakerOn]);
  useEffect(() => {
    if (isVideo) engine.current?.muteLocalVideoStream(isCameraOff);
  }, [isCameraOff]);

  const handleEndCall = useCallback(async () => {
    // Capture before endCall clears state
    const convId = resolvedConversationId;
    const chName = channelName;
    const cType = callType;
    const duration = callStartedAt
      ? Math.floor((Date.now() - callStartedAt) / 1000)
      : 0;

    if (convId && chName) {
      try { await signalCall(convId, 'ended', chName); } catch {}
    }

    engine.current?.leaveChannel();
    dispatch(endCall());

    // Save call message AFTER endCall so it appears in chat
    if (convId) {
      dispatch(messegeSendRequest({
        conversationId: convId,
        messageType: 'call',
        callType: cType,
        callStatus: 'answered',
        duration,
      }));
    }
  }, [dispatch, resolvedConversationId, channelName, callStartedAt, callType]);

  const name = isGroup ? groupName || 'Group Call' : remoteUser?.name || 'Unknown';
  const avatar = !isGroup ? remoteUser?.avatar : null;

  return (
    <View style={styles.container}>

      {isVideo && engineReady ? (
        <View style={styles.full}>
          {/* Remote video — ALWAYS mounted so Agora can render into it */}
          <RtcSurfaceView
            style={styles.full}
            zOrderMediaOverlay={false}
            canvas={{
              uid: remoteUid ?? 0,
              sourceType: VideoSourceType.VideoSourceRemote,
              renderMode: RenderModeType.RenderModeHidden,
            }}
          />

          {/* Avatar overlay — shown on top until remote joins */}
          {remoteUid === null && (
            <View style={styles.avatarOverlay}>
              <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={StyleSheet.absoluteFill} />
              <View style={styles.avatarCenter}>
                {avatar
                  ? <Image source={{ uri: avatar }} style={styles.avatar} />
                  : <View style={styles.avatarPlaceholder}>
                      <FontAwesome6 name={isGroup ? 'users' : 'user'} iconStyle="solid" size={normalize(48)} color="#fff" />
                    </View>
                }
                <Text style={styles.remoteName}>{name}</Text>
                <Text style={styles.timer}>{formatTime(elapsed)}</Text>
              </View>
            </View>
          )}

          {/* Local video PiP — always on top */}
          {!isCameraOff && (
            <RtcSurfaceView
              style={styles.localVideo}
              zOrderMediaOverlay={true}
              canvas={{
                uid: 0,
                sourceType: VideoSourceType.VideoSourceCamera,
                renderMode: RenderModeType.RenderModeHidden,
              }}
            />
          )}
        </View>
      ) : (
        // Audio call or engine not ready
        <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.full}>
          <View style={styles.avatarCenter}>
            {avatar
              ? <Image source={{ uri: avatar }} style={styles.avatar} />
              : <View style={styles.avatarPlaceholder}>
                  <FontAwesome6 name={isGroup ? 'users' : 'user'} iconStyle="solid" size={normalize(48)} color="#fff" />
                </View>
            }
            <Text style={styles.remoteName}>{name}</Text>
            <Text style={styles.timer}>{formatTime(elapsed)}</Text>
          </View>
        </LinearGradient>
      )}

      {/* Overlay name + timer when remote is visible */}
      {isVideo && remoteUid !== null && (
        <SafeAreaView style={styles.overlay} edges={['top']}>
          <Text style={styles.overlayName}>{name}</Text>
          <Text style={styles.overlayTimer}>{formatTime(elapsed)}</Text>
        </SafeAreaView>
      )}

      {/* Controls */}
      <SafeAreaView style={styles.controls} edges={['bottom']}>
        <View style={styles.controlRow}>

          <View style={styles.controlWrap}>
            <TouchableOpacity
              style={[styles.controlBtn, isMuted && styles.active]}
              onPress={() => dispatch(toggleMute())}
            >
              <FontAwesome6 name={isMuted ? 'microphone-slash' : 'microphone'} iconStyle="solid" size={normalize(22)} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
          </View>

          <View style={styles.controlWrap}>
            <TouchableOpacity
              style={[styles.controlBtn, isSpeakerOn && styles.active]}
              onPress={() => dispatch(toggleSpeaker())}
            >
              <FontAwesome6 name={isSpeakerOn ? 'volume-high' : 'volume-xmark'} iconStyle="solid" size={normalize(22)} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.controlLabel}>{isSpeakerOn ? 'Speaker' : 'Earpiece'}</Text>
          </View>

          {isVideo && (
            <View style={styles.controlWrap}>
              <TouchableOpacity
                style={[styles.controlBtn, isCameraOff && styles.active]}
                onPress={() => dispatch(toggleCamera())}
              >
                <FontAwesome6 name={isCameraOff ? 'video-slash' : 'video'} iconStyle="solid" size={normalize(22)} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.controlLabel}>{isCameraOff ? 'Cam Off' : 'Camera'}</Text>
            </View>
          )}

          {isVideo && (
            <View style={styles.controlWrap}>
              <TouchableOpacity style={styles.controlBtn} onPress={() => engine.current?.switchCamera()}>
                <FontAwesome6 name="rotate" iconStyle="solid" size={normalize(22)} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.controlLabel}>Flip</Text>
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
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  localVideo: {
    position: 'absolute', top: normalize(60), right: normalize(16),
    width: normalize(100), height: normalize(140),
    borderRadius: normalize(12), overflow: 'hidden',
    borderWidth: 2, borderColor: '#fff',
  },
  avatarCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: normalize(16) },
  avatar: { width: normalize(120), height: normalize(120), borderRadius: normalize(60) },
  avatarPlaceholder: {
    width: normalize(120), height: normalize(120), borderRadius: normalize(60),
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
  },
  remoteName: { fontSize: normalize(24), fontWeight: '700', color: '#fff' },
  timer: { fontSize: normalize(16), color: 'rgba(255,255,255,0.7)' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: normalize(16), paddingTop: normalize(8) },
  overlayName: { fontSize: normalize(18), fontWeight: '600', color: '#fff' },
  overlayTimer: { fontSize: normalize(14), color: 'rgba(255,255,255,0.7)' },
  controls: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: normalize(24), paddingTop: normalize(20),
  },
  controlRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: normalize(24) },
  controlWrap: { alignItems: 'center', gap: normalize(6) },
  controlBtn: {
    width: normalize(56), height: normalize(56), borderRadius: normalize(28),
    backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center',
  },
  active: { backgroundColor: 'rgba(255,255,255,0.5)' },
  controlLabel: { fontSize: normalize(11), color: 'rgba(255,255,255,0.7)' },
  endBtn: {
    alignSelf: 'center', width: normalize(70), height: normalize(70),
    borderRadius: normalize(35), backgroundColor: '#EF4444',
    justifyContent: 'center', alignItems: 'center', marginBottom: normalize(16),
    shadowColor: '#EF4444', shadowOpacity: 0.5, shadowRadius: 10, elevation: 8,
  },
});
