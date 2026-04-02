import { PermissionsAndroid, Platform } from 'react-native';
import { AGORA_APP_ID, BASE_URL } from '@env';
import { store } from '../../store';

export const AGORA_APP_ID_VALUE = AGORA_APP_ID;

// Request mic + camera permissions on Android
export const requestCallPermissions = async (isVideo: boolean): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;

  const permissions: any[] = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
  if (isVideo) permissions.push(PermissionsAndroid.PERMISSIONS.CAMERA);

  const results = await PermissionsAndroid.requestMultiple(permissions);
  return Object.values(results).every((r) => r === PermissionsAndroid.RESULTS.GRANTED);
};

// Fetch Agora token from your backend
export const fetchAgoraToken = async (channelName: string, uid: number): Promise<string | null> => {
  try {
    const token = store.getState().auth.token;
    const res = await fetch(`${BASE_URL}/api/calls/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ channelName, uid }),
    });

    console.log("response is ==>",res)
    const data = await res.json();
    return data?.token ?? null;
  } catch (err) {
    console.log("err is ==>",err)
    return null;
  }
};

// Generate a unique channel name for a call
export const generateChannelName = (chatId: string): string => {
  return `call_${chatId}_${Date.now()}`;
};

// Generate a numeric UID from userId string — guaranteed non-zero
export const generateUID = (userId: string): number => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 99999) + 1; // 1–99999, never 0
};

// Notify the other user about the call via backend (sends FCM push)
export const initiateCall = async (params: {
  receiverId: string;
  channelName: string;
  agoraToken: string;
  uid: number;        // caller's UID
  receiverUid: number; // receiver's UID (different from caller)
  receiverToken: string; // token generated for receiver's UID
  callType: 'audio' | 'video';
  isGroup?: boolean;
  groupName?: string;
  conversationId: string;
}): Promise<boolean> => {
  try {
    const token = store.getState().auth.token;
    const body = {
      receiverId: params.receiverId,
      channelName: params.channelName,
      token: params.receiverToken,  // receiver gets their own token
      uid: params.receiverUid,      // receiver gets their own UID
      callType: params.callType,
      isGroup: params.isGroup ?? false,
      groupName: params.groupName ?? '',
      conversationId: params.conversationId,
    };
    const res = await fetch(`${BASE_URL}/api/calls/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    console.log('[initiateCall] status:', res.status, 'response:', JSON.stringify(data));
    return res.ok;
  } catch (e) {
    console.log('[initiateCall] error:', e);
    return false;
  }
};
