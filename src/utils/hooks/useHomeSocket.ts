import { useEffect, useRef, useState } from 'react';
import { getChannel, releaseChannel } from '../helpers/socket';
import { updateChatReadStatus } from '../../db/mmkv';

interface UseHomeSocketProps {
  userId: string;
  chatIds: string[];
  onUserOnline: (userId: string) => void;
  onUserOffline: (userId: string) => void;
  onNewMessage: (conversationId: string, message: any) => void;
  active?: boolean;
}

// Exposed so HomeScreen can read typing state per conversation
export const useHomeSocket = ({
  userId,
  chatIds,
  onUserOnline,
  onUserOffline,
  onNewMessage,
  active = true,
}: UseHomeSocketProps) => {
  const r = useRef({ onUserOnline, onUserOffline, onNewMessage });
  useEffect(() => { r.current = { onUserOnline, onUserOffline, onNewMessage }; });

  // typingChats: conversationId -> true/false
  const [typingChats, setTypingChats] = useState<Record<string, boolean>>({});
  // rtReadChats: conversationId -> 'read' when other user reads instantly
  const [rtReadChats, setRtReadChats] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!active || !userId || chatIds.length === 0) return;

    // ── presence-global: online/offline ──────────────────────────
    const globalName = 'presence-global';
    const globalChannel = getChannel(globalName);
    const onOnline = (d: any) => r.current.onUserOnline(d?.userId);
    const onOffline = (d: any) => r.current.onUserOffline(d?.userId);
    globalChannel.bind('user_online', onOnline);
    globalChannel.bind('user_offline', onOffline);

    // ── per-conversation: messages + typing ──────────────────────
    const convBindings: {
      name: string;
      ch: any;
      msgHandler: any;
      typingHandler: any;
      stopTypingHandler: any;
      readHandler: any;
    }[] = [];

    chatIds.forEach((chatId) => {
      const name = `private-conversation-${chatId}`;
      const ch = getChannel(name);

      const msgHandler = (msg: any) => {
        const sid = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
        if (sid === userId) return;
        r.current.onNewMessage(chatId, msg);
      };

      const typingHandler = (d: any) => {
        if (d?.userId === userId) return;
        setTypingChats((prev) => ({ ...prev, [chatId]: true }));
      };

      const stopTypingHandler = (d: any) => {
        if (d?.userId === userId) return;
        setTypingChats((prev) => ({ ...prev, [chatId]: false }));
      };

      // client-message_read: other user read our messages — update lastMessageStatus instantly
      const readHandler = (d: any) => {
        if (d?.userId === userId) return;
        updateChatReadStatus(chatId, d?.userId);
        setRtReadChats((prev) => ({ ...prev, [chatId]: 'read' }));
      };

      ch.bind('message_received', msgHandler);
      ch.bind('client-typing', typingHandler);
      ch.bind('client-stop_typing', stopTypingHandler);
      ch.bind('client-message_read', readHandler);
      ch.bind('messages_read_bulk', readHandler);

      convBindings.push({ name, ch, msgHandler, typingHandler, stopTypingHandler, readHandler });
    });

    return () => {
      globalChannel.unbind('user_online', onOnline);
      globalChannel.unbind('user_offline', onOffline);
      releaseChannel(globalName);

      convBindings.forEach(({ name, ch, msgHandler, typingHandler, stopTypingHandler, readHandler }) => {
        ch.unbind('message_received', msgHandler);
        ch.unbind('client-typing', typingHandler);
        ch.unbind('client-stop_typing', stopTypingHandler);
        ch.unbind('client-message_read', readHandler);
        ch.unbind('messages_read_bulk', readHandler);
        releaseChannel(name);
      });
    };
  }, [active, userId, chatIds.join(',')]);

  return { typingChats, rtReadChats };
};
