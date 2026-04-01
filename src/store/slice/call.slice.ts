import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type CallType = 'audio' | 'video';
export type CallStatus = 'idle' | 'outgoing' | 'incoming' | 'active';

interface CallState {
  status: CallStatus;
  callType: CallType | null;
  channelName: string | null;
  token: string | null;
  uid: number | null;
  conversationId: string | null;
  remoteUser: {
    _id: string;
    name: string;
    avatar?: string;
  } | null;
  isGroup: boolean;
  groupName?: string;
  participants: string[];
  isMuted: boolean;
  isSpeakerOn: boolean;
  isCameraOff: boolean;
  callStartedAt: number | null;
}

const initialState: CallState = {
  status: 'idle',
  callType: null,
  channelName: null,
  token: null,
  uid: null,
  conversationId: null,
  remoteUser: null,
  isGroup: false,
  groupName: undefined,
  participants: [],
  isMuted: false,
  isSpeakerOn: false,
  isCameraOff: false,
  callStartedAt: null,
};

const callSlice = createSlice({
  name: 'call',
  initialState,
  reducers: {
    startOutgoingCall(state, action: PayloadAction<{
      callType: CallType;
      channelName: string;
      token: string;
      uid: number;
      conversationId: string;
      remoteUser: CallState['remoteUser'];
      isGroup?: boolean;
      groupName?: string;
      participants?: string[];
    }>) {
      state.status = 'outgoing';
      state.callType = action.payload.callType;
      state.channelName = action.payload.channelName;
      state.token = action.payload.token;
      state.uid = action.payload.uid;
      state.conversationId = action.payload.conversationId;
      state.remoteUser = action.payload.remoteUser;
      state.isGroup = action.payload.isGroup ?? false;
      state.groupName = action.payload.groupName;
      state.participants = action.payload.participants ?? [];
      state.isMuted = false;
      state.isSpeakerOn = false;
      state.isCameraOff = false;
      state.callStartedAt = null;
    },

    receiveIncomingCall(state, action: PayloadAction<{
      callType: CallType;
      channelName: string;
      token: string;
      uid: number;
      conversationId?: string;
      remoteUser: CallState['remoteUser'];
      isGroup?: boolean;
      groupName?: string;
    }>) {
      state.status = 'incoming';
      state.callType = action.payload.callType;
      state.channelName = action.payload.channelName;
      state.token = action.payload.token;
      state.uid = action.payload.uid;
      state.conversationId = action.payload.conversationId ?? null;
      state.remoteUser = action.payload.remoteUser;
      state.isGroup = action.payload.isGroup ?? false;
      state.groupName = action.payload.groupName;
      state.isMuted = false;
      state.isSpeakerOn = false;
      state.isCameraOff = false;
      state.callStartedAt = null;
    },

    callConnected(state) {
      state.status = 'active';
      state.callStartedAt = Date.now();
    },

    endCall() {
      return initialState;
    },

    toggleMute(state) {
      state.isMuted = !state.isMuted;
    },

    toggleSpeaker(state) {
      state.isSpeakerOn = !state.isSpeakerOn;
    },

    toggleCamera(state) {
      state.isCameraOff = !state.isCameraOff;
    },
  },
});

export const {
  startOutgoingCall,
  receiveIncomingCall,
  callConnected,
  endCall,
  toggleMute,
  toggleSpeaker,
  toggleCamera,
} = callSlice.actions;

export default callSlice.reducer;
