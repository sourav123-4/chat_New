import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type CallType = 'audio' | 'video';
export type CallStatus = 'idle' | 'outgoing' | 'incoming' | 'active';

export interface CallHistoryItem {
  id: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  callType: CallType;
  direction: 'incoming' | 'outgoing';
  status: 'answered' | 'missed' | 'declined';
  timestamp: number;
  duration?: number; // seconds
}

interface CallState {
  status: CallStatus;
  callType: CallType | null;
  channelName: string | null;
  token: string | null;
  uid: number | null;
  conversationId: string | null;
  remoteUser: { _id: string; name: string; avatar?: string } | null;
  isGroup: boolean;
  groupName?: string;
  participants: string[];
  isMuted: boolean;
  isSpeakerOn: boolean;
  isCameraOff: boolean;
  callStartedAt: number | null;
  autoAccepted: boolean;
  history: CallHistoryItem[];
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
  autoAccepted: false,
  history: [],
};

const callSlice = createSlice({
  name: 'call',
  initialState,
  reducers: {
    startOutgoingCall(state, action: PayloadAction<{
      callType: CallType; channelName: string; token: string; uid: number;
      conversationId: string; remoteUser: CallState['remoteUser'];
      isGroup?: boolean; groupName?: string; participants?: string[];
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
      callType: CallType; channelName: string; token: string; uid: number;
      conversationId?: string; remoteUser: CallState['remoteUser'];
      isGroup?: boolean; groupName?: string; autoAccepted?: boolean;
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
      state.autoAccepted = action.payload.autoAccepted ?? false;
    },

    callConnected(state) {
      state.status = 'active';
      state.callStartedAt = Date.now();
    },

    endCall(state) {
      // Save to history if there was an active/outgoing/incoming call
      if (state.remoteUser && state.callType) {
        const duration = state.callStartedAt
          ? Math.floor((Date.now() - state.callStartedAt) / 1000)
          : undefined;
        const status = state.status === 'active'
          ? 'answered'
          : state.status === 'incoming'
          ? 'missed'
          : 'declined';
        state.history.unshift({
          id: `${Date.now()}`,
          callerId: state.remoteUser._id,
          callerName: state.remoteUser.name,
          callerAvatar: state.remoteUser.avatar,
          callType: state.callType,
          direction: state.status === 'outgoing' || (state.status === 'active' && !state.autoAccepted)
            ? 'outgoing'
            : 'incoming',
          status,
          timestamp: Date.now(),
          duration,
        });
        // Keep only last 100 entries
        if (state.history.length > 100) state.history = state.history.slice(0, 100);
      }
      // Reset call state but keep history
      const history = state.history;
      Object.assign(state, { ...initialState, history });
    },

    addCallHistory(state, action: PayloadAction<Omit<CallHistoryItem, 'id'>>) {
      state.history.unshift({ ...action.payload, id: `${Date.now()}` });
      if (state.history.length > 100) state.history = state.history.slice(0, 100);
    },

    clearCallHistory(state) {
      state.history = [];
    },

    toggleMute(state) { state.isMuted = !state.isMuted; },
    toggleSpeaker(state) { state.isSpeakerOn = !state.isSpeakerOn; },
    toggleCamera(state) { state.isCameraOff = !state.isCameraOff; },
  },
});

export const {
  startOutgoingCall, receiveIncomingCall, callConnected, endCall,
  addCallHistory, clearCallHistory,
  toggleMute, toggleSpeaker, toggleCamera,
} = callSlice.actions;

export default callSlice.reducer;
