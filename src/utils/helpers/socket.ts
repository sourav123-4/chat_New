import Pusher, { Channel } from 'pusher-js';
import { store } from '../../store';
import { PUSHER_APP_KEY, PUSHER_CLUSTER, BASE_URL } from '@env';

let pusher: Pusher | null = null;

// Track how many components are using each channel
const channelRefs: Record<string, number> = {};

export const connectPusher = (): Pusher => {
  if (pusher) return pusher;
  const token = store.getState().auth.token;
  pusher = new Pusher(PUSHER_APP_KEY, {
    cluster: PUSHER_CLUSTER,
    authEndpoint: `${BASE_URL}/api/pusher/auth`,
    auth: { headers: { Authorization: `Bearer ${token}` } },
  });
  return pusher;
};

export const disconnectPusher = () => {
  pusher?.disconnect();
  pusher = null;
  Object.keys(channelRefs).forEach(k => delete channelRefs[k]);
};

// Get or subscribe — increments ref count
export const getChannel = (name: string): Channel => {
  const p = connectPusher();
  channelRefs[name] = (channelRefs[name] ?? 0) + 1;
  return p.channel(name) ?? p.subscribe(name);
};

// Release — only unsubscribes when no more users
export const releaseChannel = (name: string) => {
  channelRefs[name] = Math.max(0, (channelRefs[name] ?? 1) - 1);
  if (channelRefs[name] === 0) {
    pusher?.unsubscribe(name);
    delete channelRefs[name];
  }
};

const apiCall = (path: string, body: object = {}) => {
  const token = store.getState().auth.token;
  return fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
};

export const notifyOnline = () => apiCall('/api/pusher/online');
export const notifyOffline = () => apiCall('/api/pusher/offline');
export const markMessagesRead = (conversationId: string) =>
  apiCall('/api/messages/read', { conversationId });
export const signalCall = (conversationId: string, event: 'accepted' | 'declined' | 'ended', channelName: string) =>
  apiCall('/api/calls/signal', { conversationId, event, channelName });

// Extract conversationId from channelName like "call_<conversationId>_<timestamp>"
export const extractConversationId = (channelName: string): string | null => {
  const match = channelName?.match(/^call_(.+)_\d+$/);
  return match ? match[1] : null;
};
