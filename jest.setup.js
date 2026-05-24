/* global jest */

jest.mock('react-native-image-crop-picker', () => ({
  openPicker: jest.fn(),
  openCamera: jest.fn(),
}));

jest.mock('react-native-linear-gradient', () => 'LinearGradient');

jest.mock('react-native-keyboard-aware-scroll-view', () => ({
  KeyboardAwareScrollView: 'KeyboardAwareScrollView',
}));

jest.mock('@react-native-vector-icons/fontawesome6', () => 'FontAwesome6');
jest.mock('@react-native-vector-icons/evil-icons', () => 'EvilIcons');
jest.mock('@react-native-vector-icons/fontisto', () => 'Fontisto');
jest.mock('@react-native-icons/heroicons', () => 'Heroicons');

const mockNetInfoState = {
  type: 'wifi',
  isConnected: true,
  isInternetReachable: true,
};

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve(mockNetInfoState)),
  addEventListener: jest.fn(listener => {
    listener(mockNetInfoState);
    return jest.fn();
  }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(() => Promise.resolve(true)),
    signIn: jest.fn(),
    signOut: jest.fn(),
    getCurrentUser: jest.fn(() => Promise.resolve(null)),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
}));

jest.mock('react-native-skeleton-placeholder', () => 'SkeletonPlaceholder');

jest.mock('@op-engineering/op-sqlite', () => ({
  open: jest.fn(() => ({
    executeSync: jest.fn(() => ({ rows: [] })),
    transaction: jest.fn(async callback => callback({ execute: jest.fn() })),
    close: jest.fn(),
  })),
}));

jest.mock('@react-native-firebase/messaging', () => {
  const messaging = jest.fn(() => ({
    requestPermission: jest.fn(() => Promise.resolve(1)),
    getToken: jest.fn(() => Promise.resolve('test-token')),
    onMessage: jest.fn(() => jest.fn()),
    setBackgroundMessageHandler: jest.fn(),
    onNotificationOpenedApp: jest.fn(() => jest.fn()),
    getInitialNotification: jest.fn(() => Promise.resolve(null)),
  }));
  messaging.AuthorizationStatus = { AUTHORIZED: 1, PROVISIONAL: 2 };
  return messaging;
});

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    requestPermission: jest.fn(() => Promise.resolve()),
    deleteChannel: jest.fn(() => Promise.resolve()),
    createChannel: jest.fn(() => Promise.resolve()),
    displayNotification: jest.fn(() => Promise.resolve()),
    cancelNotification: jest.fn(() => Promise.resolve()),
    onForegroundEvent: jest.fn(() => jest.fn()),
    onBackgroundEvent: jest.fn(),
  },
  AndroidImportance: { HIGH: 4, LOW: 2 },
  AndroidCategory: { CALL: 'call' },
  AndroidVisibility: { PUBLIC: 1 },
  EventType: {},
}));

jest.mock('react-native-webrtc', () => ({
  RTCView: 'RTCView',
  MediaStream: jest.fn(),
  RTCPeerConnection: jest.fn(() => ({
    addTrack: jest.fn(),
    createOffer: jest.fn(),
    createAnswer: jest.fn(),
    setLocalDescription: jest.fn(),
    setRemoteDescription: jest.fn(),
    addIceCandidate: jest.fn(),
    close: jest.fn(),
  })),
  RTCIceCandidate: jest.fn(),
  RTCSessionDescription: jest.fn(),
  mediaDevices: {
    getUserMedia: jest.fn(() =>
      Promise.resolve({ getTracks: jest.fn(() => []) }),
    ),
  },
}));

jest.mock('react-native-incall-manager', () => ({
  start: jest.fn(),
  stop: jest.fn(),
  setForceSpeakerphoneOn: jest.fn(),
}));

jest.mock('react-native-blob-util', () => ({
  fs: { dirs: { DownloadDir: '/tmp' } },
  config: jest.fn(() => ({
    fetch: jest.fn(() => Promise.resolve({})),
  })),
}));

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clearAll: jest.fn(),
  })),
  createMMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clearAll: jest.fn(),
  })),
}));
