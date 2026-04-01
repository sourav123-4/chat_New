import React from 'react';
import { Modal } from 'react-native';
import { useAppSelector } from '../store';
import OutgoingCallScreen from '../screens/Call/OutgoingCallScreen';
import IncomingCallScreen from '../screens/Call/IncomingCallScreen';
import ActiveCallScreen from '../screens/Call/ActiveCallScreen';

export default function CallOverlay() {
  const { status } = useAppSelector((s) => s.call);

  if (status === 'idle') return null;

  return (
    <Modal visible animationType="slide" statusBarTranslucent>
      {status === 'outgoing' && <OutgoingCallScreen />}
      {status === 'incoming' && <IncomingCallScreen />}
      {status === 'active' && <ActiveCallScreen />}
    </Modal>
  );
}
