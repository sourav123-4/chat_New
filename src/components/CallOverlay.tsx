import React, { useEffect } from 'react';
import { Modal } from 'react-native';
import { useAppSelector } from '../store';
import OutgoingCallScreen from '../screens/Call/OutgoingCallScreen';
import IncomingCallScreen from '../screens/Call/IncomingCallScreen';
import ActiveCallScreen from '../screens/Call/ActiveCallScreen';
import {
  showOngoingCallNotification,
  cancelOngoingCallNotification,
  cancelIncomingCallNotification,
} from '../utils/helpers/NotificationService';

export default function CallOverlay() {
  const { status, remoteUser, callType, isGroup, groupName } = useAppSelector((s) => s.call);

  useEffect(() => {
    if (status === 'active') {
      const name = isGroup ? groupName || 'Group Call' : remoteUser?.name || 'Unknown';
      showOngoingCallNotification(name, callType ?? 'audio');
      cancelIncomingCallNotification();
    } else if (status === 'idle') {
      cancelOngoingCallNotification();
      cancelIncomingCallNotification();
    }
  }, [status]);

  if (status === 'idle') return null;

  return (
    <Modal visible animationType="slide" statusBarTranslucent>
      {status === 'outgoing' && <OutgoingCallScreen />}
      {status === 'incoming' && <IncomingCallScreen />}
      {status === 'active' && <ActiveCallScreen />}
    </Modal>
  );
}
