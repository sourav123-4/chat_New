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
} from 'react-native-agora';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  endCall, toggleMute, toggleSpeaker, toggleCamera,
} from '../../store/slice/call.slice';
import { normalize } from '../../utils/orientation';
import { AGORA_APP_ID_VALUE } from '../../utils/helpers/agora';
import LinearGradient from 'react-native-linear-gradient';

export default function ActiveCallScreen() {
  const dispatch = useAppDispatch();
  const { callType, channelName, token, uid, remoteUser, isGroup, groupName,
    isMuted, isSpeakerOn, isCameraOff, callStartedAt } = useAppSelector((s) => s.call);

  const engine = useRef<IRtcEngine | null>(null);
  const [remoteUids, setRemoteUids] = useState<number[]>([]);
  const [elapsed, setElapsed] = useState(0);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (callStartedAt) setElapsed(Math.floor((Date.now() - callStartedAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [callStartedAt]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  // Init Agora
  useEffect(() => {
    const init = async () => {
      engine.current = createAgoraRtcEngine();
      engine.current.initialize({ appId: AGORA_APP_ID_VALUE });

      engine.current.registerEventHandler({
        onUserJoined: (_, remoteUid) => {
          setRemoteUids((prev) => [...new Set([...prev, remoteUid])]);
        },
        onUserOffline: (_, remoteUid) => {
          setRemoteUids((prev) => prev.filter((id) => id !== remoteUid));
        },
        onLeaveChannel: () => {
          dispatch(endCall());
        },
      });

      if (callType === 'video') {
        engine.current.enableVideo();
        engine.current.startPreview();
      } else {
        engine.current.enableAudio();
      }

      engine.current.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);
      await engine.current.joinChannel(token ?? '', channelName ?? '', uid ?? 0, {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
      });
    };

    init();

    return () => {
      engine.current?.leaveChannel();
      engine.current?.release();
      engine.current = null;
    };
  }, []);

  // Sync controls
  useEffect(() => { engine.current?.muteLocalAudioStream(isMuted); }, [isMuted]);
  useEffect(() => { engine.current?.setEnableSpeakerphone(isSpeakerOn); }, [isSpeakerOn]);
  useEffect(() => {
    if (callType === 'video') engine.current?.muteLocalVideoStream(isCameraOff);
  }, [isCameraOff]);

  const handleEndCall = useCallback(() => {
    engine.current?.leaveChannel();
    dispatch(endCall());
  }, [dispatch]);

  const name = isGroup ? groupName || 'Group Call' : remoteUser?.name || 'Unknown';
  const avatar = !isGroup ? remoteUser?.avatar : null;
  const isVideo = callType === 'video';

  return (
    <View style={styles.container}>
      {/* Video views */}
      {isVideo && remoteUids.length > 0 ? (
        <RtcSurfaceView
          style={styles.remoteVideo}
          canvas={{ uid: remoteUids[0], sourceType: VideoSourceType.VideoSourceRemote }}
        />
      ) : (
        <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.remoteVideo}>
          <View style={styles.avatarCenter}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <FontAwesome6 name={isGroup ? 'users' : 'user'} iconStyle="solid" size={normalize(48)} color="#fff" />
              </View>
            )}
            <Text style={styles.remoteName}>{name}</Text>
            <Text style={styles.timer}>{formatTime(elapsed)}</Text>
          </View>
        </LinearGradient>
      )}

      {/* Local video (picture-in-picture) */}
      {isVideo && !isCameraOff && (
        <RtcSurfaceView
          style={styles.localVideo}
          canvas={{ uid: 0, sourceType: VideoSourceType.VideoSourceCamera }}
        />
      )}

      {/* Name + timer overlay for video */}
      {isVideo && remoteUids.length > 0 && (
        <SafeAreaView style={styles.overlay} edges={['top']}>
          <Text style={styles.overlayName}>{name}</Text>
          <Text style={styles.overlayTimer}>{formatTime(elapsed)}</Text>
        </SafeAreaView>
      )}

      {/* Controls */}
      <SafeAreaView style={styles.controls} edges={['bottom']}>
        <View style={styles.controlRow}>
          {/* Mute */}
          <View style={styles.controlWrap}>
            <TouchableOpacity
              style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
              onPress={() => dispatch(toggleMute())}
            >
              <FontAwesome6
                name={isMuted ? 'microphone-slash' : 'microphone'}
                iconStyle="solid" size={normalize(22)} color="#fff"
              />
            </TouchableOpacity>
            <Text style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
          </View>

          {/* Speaker */}
          <View style={styles.controlWrap}>
            <TouchableOpacity
              style={[styles.controlBtn, isSpeakerOn && styles.controlBtnActive]}
              onPress={() => dispatch(toggleSpeaker())}
            >
              <FontAwesome6
                name={isSpeakerOn ? 'volume-high' : 'volume-xmark'}
                iconStyle="solid" size={normalize(22)} color="#fff"
              />
            </TouchableOpacity>
            <Text style={styles.controlLabel}>{isSpeakerOn ? 'Speaker' : 'Earpiece'}</Text>
          </View>

          {/* Camera toggle (video only) */}
          {isVideo && (
            <View style={styles.controlWrap}>
              <TouchableOpacity
                style={[styles.controlBtn, isCameraOff && styles.controlBtnActive]}
                onPress={() => dispatch(toggleCamera())}
              >
                <FontAwesome6
                  name={isCameraOff ? 'video-slash' : 'video'}
                  iconStyle="solid" size={normalize(22)} color="#fff"
                />
              </TouchableOpacity>
              <Text style={styles.controlLabel}>{isCameraOff ? 'Camera Off' : 'Camera'}</Text>
            </View>
          )}

          {/* Flip camera (video only) */}
          {isVideo && (
            <View style={styles.controlWrap}>
              <TouchableOpacity
                style={styles.controlBtn}
                onPress={() => engine.current?.switchCamera()}
              >
                <FontAwesome6 name="rotate" iconStyle="solid" size={normalize(22)} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.controlLabel}>Flip</Text>
            </View>
          )}
        </View>

        {/* End call */}
        <TouchableOpacity style={styles.endBtn} onPress={handleEndCall}>
          <FontAwesome6 name="phone-slash" iconStyle="solid" size={normalize(28)} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  remoteVideo: { flex: 1 },
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
  controlBtnActive: { backgroundColor: 'rgba(255,255,255,0.5)' },
  controlLabel: { fontSize: normalize(11), color: 'rgba(255,255,255,0.7)' },
  endBtn: {
    alignSelf: 'center', width: normalize(70), height: normalize(70),
    borderRadius: normalize(35), backgroundColor: '#EF4444',
    justifyContent: 'center', alignItems: 'center', marginBottom: normalize(16),
    shadowColor: '#EF4444', shadowOpacity: 0.5, shadowRadius: 10, elevation: 8,
  },
});
