import { useEffect, useRef, useCallback } from 'react';
import { getChannel, releaseChannel, markMessagesRead } from '../helpers/socket';

interface UseSocketProps {
  userId: string;
  chatId: string;
  chatUserId?: string;
  onMessageReceived: (message: any) => void;
  onMessageDelivered: (data: any) => void;
  onMessageRead: (data: any) => void;
  onUserOnline?: (data: any) => void;
  onUserOffline?: (data: any) => void;
  onTyping?: (data: any) => void;
  onStopTyping?: (data: any) => void;
}

export const useSocket = ({
  userId,
  chatId,
  chatUserId,
  onMessageReceived,
  onMessageDelivered,
  onMessageRead,
  onUserOnline,
  onUserOffline,
  onTyping,
  onStopTyping,
}: UseSocketProps) => {
  const typingTimeoutRef = useRef<any>(null);
  const convChannelRef = useRef<any>(null);

  const r = useRef({
    onMessageReceived, onMessageDelivered, onMessageRead,
    onUserOnline, onUserOffline, onTyping, onStopTyping,
  });
  useEffect(() => {
    r.current = {
      onMessageReceived, onMessageDelivered, onMessageRead,
      onUserOnline, onUserOffline, onTyping, onStopTyping,
    };
  });

  useEffect(() => {
    const convName = `private-conversation-${chatId}`;
    const globalName = 'presence-global';

    const convChannel = getChannel(convName);
    convChannelRef.current = convChannel;
    const globalChannel = getChannel(globalName);

    // ── Messages ──────────────────────────────────────────────────
    const onMsgReceived = (msg: any) => {
      const sid = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
      if (sid === userId) return;
      r.current.onMessageReceived(msg);
    };

    const onMsgDelivered = (d: any) => {
      // backend may send { messageId } or full message object
      const messageId = d?.messageId ?? d?._id;
      r.current.onMessageDelivered({ messageId });
    };

    // client-message_read: instant read receipt via Pusher client event
    const onMsgRead = (d: any) => {
      if (d?.userId === userId) return; // ignore own
      r.current.onMessageRead(d);
    };

    convChannel.bind('message_received', onMsgReceived);
    convChannel.bind('message_delivered', onMsgDelivered);
    convChannel.bind('client-message_read', onMsgRead);
    convChannel.bind('messages_read_bulk', onMsgRead);

    // ── Typing ────────────────────────────────────────────────────
    const onTypingEvt = (d: any) => {
      if (d?.userId === userId) return;
      r.current.onTyping?.(d);
    };
    const onStopTypingEvt = (d: any) => {
      if (d?.userId === userId) return;
      r.current.onStopTyping?.(d);
    };
    convChannel.bind('client-typing', onTypingEvt);
    convChannel.bind('client-stop_typing', onStopTypingEvt);

    // ── Online / Offline ──────────────────────────────────────────
    const onOnline = (d: any) => {
      if (d?.userId === chatUserId) r.current.onUserOnline?.(d);
    };
    const onOffline = (d: any) => {
      if (d?.userId === chatUserId) r.current.onUserOffline?.(d);
    };
    globalChannel.bind('user_online', onOnline);
    globalChannel.bind('user_offline', onOffline);

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      convChannel.unbind('message_received', onMsgReceived);
      convChannel.unbind('message_delivered', onMsgDelivered);
      convChannel.unbind('client-message_read', onMsgRead);
      convChannel.unbind('messages_read_bulk', onMsgRead);
      convChannel.unbind('client-typing', onTypingEvt);
      convChannel.unbind('client-stop_typing', onStopTypingEvt);
      releaseChannel(convName);
      globalChannel.unbind('user_online', onOnline);
      globalChannel.unbind('user_offline', onOffline);
      releaseChannel(globalName);
      convChannelRef.current = null;
    };
  }, [chatId, userId, chatUserId]);

  const emitTyping = useCallback(() => {
    convChannelRef.current?.trigger('client-typing', { userId });
  }, [userId]);

  const emitStopTyping = useCallback(() => {
    convChannelRef.current?.trigger('client-stop_typing', { userId });
  }, [userId]);

  // Instant read receipt — client event + backend API call
  const emitMessageRead = useCallback(() => {
    // 1. Instant: tell the other user via Pusher client event
    convChannelRef.current?.trigger('client-message_read', { userId, conversationId: chatId });
    // 2. Persist: update DB via API
    markMessagesRead(chatId);
  }, [userId, chatId]);

  const handleTypingWithTimeout = useCallback(
    (callback: () => void) => {
      emitTyping();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(emitStopTyping, 2000);
      callback();
    },
    [emitTyping, emitStopTyping]
  );

  return { emitTyping, emitStopTyping, emitMessageRead, handleTypingWithTimeout };
};
