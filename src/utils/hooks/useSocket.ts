import { useEffect, useRef, useCallback } from 'react';
import { connectSocket } from '../helpers/socket';

interface UseSocketProps {
  userId: string;
  chatId: string;
  onMessageReceived: (message: any) => void;
  onMessageDelivered: (data: { messageId: string }) => void;
  onMessageRead: (data: { messageId: string }) => void;
  onUserOnline?: (data: { userId: string }) => void;
  onUserOffline?: (data: { userId: string; lastSeen: number }) => void;
  onTyping?: (data: { userId: string }) => void;
  onStopTyping?: (data: { userId: string }) => void;
}

export const useSocket = ({
  userId,
  chatId,
  onMessageReceived,
  onMessageDelivered,
  onMessageRead,
  onUserOnline,
  onUserOffline,
  onTyping,
  onStopTyping,
}: UseSocketProps) => {
  const socketRef = useRef<any>(null);
  const typingTimeoutRef = useRef<any>(null);

useEffect(() => {
  const socket = connectSocket();
  socketRef.current = socket;

  socket.emit('setup', userId);
  socket.emit('join_conversation', chatId);

  socket.on('message_received', onMessageReceived);
  socket.on('message_delivered', onMessageDelivered);
  socket.on('message_read', onMessageRead);

  if (onUserOnline) socket.on('user_online', onUserOnline);
  if (onUserOffline) socket.on('user_offline', onUserOffline);
  if (onTyping) socket.on('typing', onTyping);
  if (onStopTyping) socket.on('stop_typing', onStopTyping);

  return () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    socket.emit('stop_typing', { conversationId: chatId });
    socket.emit('leave_conversation', chatId);

    socket.off('message_received', onMessageReceived);
    socket.off('message_delivered', onMessageDelivered);
    socket.off('message_read', onMessageRead);

    if (onUserOnline) socket.off('user_online', onUserOnline);
    if (onUserOffline) socket.off('user_offline', onUserOffline);
    if (onTyping) socket.off('typing', onTyping);
    if (onStopTyping) socket.off('stop_typing', onStopTyping);

    socket.disconnect();
  };
}, [
  chatId,
  userId,
  onMessageReceived,
  onMessageDelivered,
  onMessageRead,
  onUserOnline,
  onUserOffline,
  onTyping,
  onStopTyping,
]);


  const emitTyping = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('typing', { conversationId: chatId, userId });
  }, [chatId, userId]);

  const emitStopTyping = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('stop_typing', { conversationId: chatId, userId });
  }, [chatId, userId]);

  const emitMessageRead = useCallback((messageId: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('message_read', { messageId, conversationId: chatId });
  }, [chatId]);

  const handleTypingWithTimeout = useCallback((callback: () => void) => {
    emitTyping();
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping();
    }, 1000);
    
    callback();
  }, [emitTyping, emitStopTyping]);

  return {
    socket: socketRef.current,
    emitTyping,
    emitStopTyping,
    emitMessageRead,
    handleTypingWithTimeout,
  };
};