import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({ id: 'chatapp-store' });

// ── Chat list ─────────────────────────────────────────────────────
export const saveChatList = (chats: any[]) => {
  storage.set('chat_list', JSON.stringify(chats));
  storage.set('chat_list_fetched_at', Date.now());
};

export const getChatList = (): any[] => {
  const raw = storage.getString('chat_list');
  return raw ? JSON.parse(raw) : [];
};

export const getChatListFetchedAt = (): number => {
  return storage.getNumber('chat_list_fetched_at') ?? 0;
};

// ── Unread counts ─────────────────────────────────────────────────
export const getUnreadCount = (conversationId: string): number => {
  return storage.getNumber(`unread_${conversationId}`) ?? 0;
};

export const setUnreadCount = (conversationId: string, count: number) => {
  storage.set(`unread_${conversationId}`, count);
};

export const incrementUnread = (conversationId: string) => {
  const current = getUnreadCount(conversationId);
  storage.set(`unread_${conversationId}`, current + 1);
};

export const clearUnread = (conversationId: string) => {
  storage.set(`unread_${conversationId}`, 0);
};

// ── Message fetch timestamps ──────────────────────────────────────
export const getMessagesFetchedAt = (conversationId: string): number => {
  return storage.getNumber(`msg_fetched_${conversationId}`) ?? 0;
};

export const setMessagesFetchedAt = (conversationId: string) => {
  storage.set(`msg_fetched_${conversationId}`, Date.now());
};

// ── Update last message in chat list ─────────────────────────────
export const updateChatLastMessage = (conversationId: string, message: any) => {
  const chats = getChatList();
  const idx = chats.findIndex((c: any) => c._id === conversationId);
  if (idx === -1) return;
  const senderId = typeof message.senderId === 'object'
    ? message.senderId._id
    : message.senderId;
  const nextStatus = message.status ?? chats[idx].lastMessageStatus ?? 'sent';
  chats[idx] = {
    ...chats[idx],
    lastMessage: message,
    lastMessageAt: message.createdAt,
    lastMessageSenderId: senderId,
    lastMessageStatus: nextStatus,
  };
  // Move updated chat to top
  const updated = [chats[idx], ...chats.filter((_: any, i: number) => i !== idx)];
  storage.set('chat_list', JSON.stringify(updated));
};

export const updateChatReadStatus = (conversationId: string, readerId?: string) => {
  const chats = getChatList();
  const idx = chats.findIndex((c: any) => c._id === conversationId);
  if (idx === -1) return;

  const senderId = chats[idx].lastMessageSenderId ?? (
    typeof chats[idx].lastMessage?.senderId === 'object'
      ? chats[idx].lastMessage?.senderId?._id
      : chats[idx].lastMessage?.senderId
  );

  if (readerId && senderId === readerId) return;

  chats[idx] = {
    ...chats[idx],
    lastMessage: chats[idx].lastMessage
      ? { ...chats[idx].lastMessage, status: 'read' }
      : chats[idx].lastMessage,
    lastMessageStatus: 'read',
  };
  storage.set('chat_list', JSON.stringify(chats));
};

// ── Clear all on logout ───────────────────────────────────────────
export const clearAllMMKV = () => {
  storage.clearAll();
};
