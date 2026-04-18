import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
  MediaStream,
} from 'react-native-webrtc';
import { connectPusher } from './socket';
import { store } from '../../store';
import { BASE_URL } from '@env';

// @ts-ignore
import InCallManager from 'react-native-incall-manager';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
];

export type WebRTCCallbacks = {
  onRemoteStream: (stream: MediaStream) => void;
  onCallEnded: () => void;
};

export class WebRTCService {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private conversationId: string;
  private isVideo: boolean;
  private isCaller: boolean;
  private callbacks: WebRTCCallbacks;
  private channel: any = null;
  private iceCandidateQueue: any[] = [];
  private remoteDescSet = false;
  private stopped = false;

  constructor(conversationId: string, isVideo: boolean, isCaller: boolean, callbacks: WebRTCCallbacks) {
    this.conversationId = conversationId;
    this.isVideo = isVideo;
    this.isCaller = isCaller;
    this.callbacks = callbacks;
  }

  async start(): Promise<MediaStream> {
    // Start InCallManager — routes audio through earpiece/speaker properly
    InCallManager.start({ media: this.isVideo ? 'video' : 'audio' });
    InCallManager.setForceSpeakerphoneOn(this.isVideo); // speaker for video, earpiece for audio

    // Get local media
    this.localStream = await mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: this.isVideo
        ? { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } }
        : false,
    });

    // Create peer connection
    this.pc = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
      iceTransportPolicy: 'all',
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
    });

    // Add local tracks
    this.localStream.getTracks().forEach(track => {
      this.pc!.addTrack(track, this.localStream!);
    });

    // Remote stream handler
    this.pc.ontrack = (event: any) => {
      if (event.streams?.[0]) {
        console.log('[WebRTC] remote stream received');
        this.callbacks.onRemoteStream(event.streams[0]);
      }
    };

    // ICE candidates
    this.pc.onicecandidate = (event: any) => {
      if (event.candidate) {
        this.sendSignal('ice-candidate', { candidate: event.candidate });
      }
    };

    this.pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE state:', this.pc?.iceConnectionState);
    };

    this.pc.onconnectionstatechange = () => {
      const state = this.pc?.connectionState;
      console.log('[WebRTC] connection state:', state);
      if (!this.stopped && (state === 'disconnected' || state === 'failed' || state === 'closed')) {
        this.callbacks.onCallEnded();
      }
    };

    // Subscribe to Pusher signaling
    this.subscribeSignaling();

    if (this.isCaller) {
      const offer = await this.pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: this.isVideo,
      });
      await this.pc.setLocalDescription(offer);
      this.sendSignal('offer', { sdp: offer });
    }

    return this.localStream;
  }

  private subscribeSignaling() {
    const pusher = connectPusher();
    const chName = `private-conversation-${this.conversationId}`;
    this.channel = pusher.subscribe(chName);

    this.channel.bind('webrtc_signal', async (data: any) => {
      if (this.stopped) return;
      console.log('[WebRTC] signal:', data.type);
      try {
        if (data.type === 'offer' && !this.isCaller) {
          await this.pc!.setRemoteDescription(new RTCSessionDescription(data.sdp));
          this.remoteDescSet = true;
          await this.drainIceCandidates();
          const answer = await this.pc!.createAnswer();
          await this.pc!.setLocalDescription(answer);
          this.sendSignal('answer', { sdp: answer });

        } else if (data.type === 'answer' && this.isCaller) {
          await this.pc!.setRemoteDescription(new RTCSessionDescription(data.sdp));
          this.remoteDescSet = true;
          await this.drainIceCandidates();

        } else if (data.type === 'ice-candidate') {
          if (this.remoteDescSet) {
            await this.pc!.addIceCandidate(new RTCIceCandidate(data.candidate));
          } else {
            this.iceCandidateQueue.push(data.candidate);
          }
        }
      } catch (e) {
        console.log('[WebRTC] signal error:', e);
      }
    });
  }

  private async drainIceCandidates() {
    for (const c of this.iceCandidateQueue) {
      try { await this.pc!.addIceCandidate(new RTCIceCandidate(c)); } catch {}
    }
    this.iceCandidateQueue = [];
  }

  private sendSignal(type: string, payload: any) {
    const token = store.getState().auth.token;
    fetch(`${BASE_URL}/api/calls/webrtc-signal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ conversationId: this.conversationId, type, ...payload }),
    }).catch(e => console.log('[WebRTC] sendSignal error:', e));
  }

  toggleMute(muted: boolean) {
    this.localStream?.getAudioTracks().forEach(t => { t.enabled = !muted; });
  }

  toggleCamera(off: boolean) {
    this.localStream?.getVideoTracks().forEach(t => { t.enabled = !off; });
  }

  toggleSpeaker(on: boolean) {
    InCallManager.setForceSpeakerphoneOn(on);
  }

  async switchCamera() {
    const videoTrack = this.localStream?.getVideoTracks()[0] as any;
    if (videoTrack?._switchCamera) videoTrack._switchCamera();
  }

  stop() {
    this.stopped = true;
    try {
      this.localStream?.getTracks().forEach(t => t.stop());
      this.pc?.close();
      this.channel?.unbind('webrtc_signal');
      InCallManager.stop();
    } catch {}
    this.localStream = null;
    this.pc = null;
  }
}
