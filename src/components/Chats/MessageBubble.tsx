import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { normalize } from '../../utils/orientation';
import { TickIcon } from '../TickIcon';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

interface MessageBubbleProps {
  message: any;
  isMyMessage: boolean;
  isGroupChat: boolean;
  onImagePress?: (url: string) => void;
  onVideoPress?: (url: string) => void;
  onDownload?: (url: string, type: 'image' | 'video') => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMyMessage,
  isGroupChat,
  onImagePress,
  onVideoPress,
  onDownload,
}) => {
  const timestamp = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const senderName =
    typeof message.senderId === 'object' ? message.senderId.name : 'User';

  const senderAvatar =
    typeof message.senderId === 'object' ? message.senderId.avatar : null;

  const videoThumb = message.file?.url
    ?.replace('/video/upload/', '/video/upload/so_0/')
    ?.replace(/\.(mp4|mov|webm)$/, '.jpg');

  const renderMessageFooter = () => (
    <View style={styles.messageFooter}>
      {message.status === 'sending' ? (
        <Text style={styles.sendingText}>sending</Text>
      ) : (
        <>
          <Text style={[styles.timestamp, isMyMessage ? styles.myTimestamp : styles.otherTimestamp]}>
            {timestamp}
          </Text>
          {isMyMessage && (
            <View style={styles.tickWrap}>
              <TickIcon status={message.status} theme="light" />
            </View>
          )}
        </>
      )}
    </View>
  );

  const renderContent = () => {
    switch (message.messageType) {
      case 'call': {
        const isVideo = message.callType === 'video';
        const isMissed = message.callStatus === 'missed';
        const isDec = message.callStatus === 'declined';
        const dur = message.duration;
        const durText = dur
          ? ` · ${Math.floor(dur / 60) > 0 ? `${Math.floor(dur / 60)}m ` : ''}${dur % 60}s`
          : '';
        return (
          <View style={styles.callRow}>
            <FontAwesome6
              name={isMissed || isDec ? 'phone-slash' : isVideo ? 'video' : 'phone'}
              iconStyle="solid"
              size={normalize(14)}
              color={isMyMessage ? (isMissed || isDec ? '#fca5a5' : '#fff') : (isMissed || isDec ? '#EF4444' : '#6A11CB')}
            />
            <View style={{ marginLeft: normalize(8) }}>
              <Text style={[styles.callText, isMyMessage ? styles.myText : styles.otherText]}>
                {isMissed ? 'Missed call' : isDec ? 'Declined' : isVideo ? 'Video call' : 'Voice call'}
                {durText}
              </Text>
              <Text style={[styles.timestamp, isMyMessage ? styles.myTimestamp : styles.otherTimestamp]}>
                {timestamp}
              </Text>
            </View>
          </View>
        );
      }

      case 'text':
        return (
          <>
            <Text style={isMyMessage ? styles.myText : styles.otherText}>
              {message.text}
            </Text>
            {renderMessageFooter()}
          </>
        );

      case 'image':
        return (
          <>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onImagePress?.(message.file?.url)}
            >
              <Image source={{ uri: message.file?.url }} style={styles.image} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onDownload?.(message.file?.url, 'image')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.downloadText,
                  isMyMessage && { color: '#fff' },
                ]}
              >
                ⬇ Download
              </Text>
            </TouchableOpacity>
            {renderMessageFooter()}
          </>
        );

      case 'file':
      case 'video':
        return (
          <>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onVideoPress?.(message.file?.url)}
            >
              <View style={styles.videoThumbWrapper}>
                <Image
                  source={{ uri: videoThumb }}
                  style={styles.videoThumbnail}
                />
                <View style={styles.playIconOverlay}>
                  <Text style={styles.playIcon}>▶</Text>
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onDownload?.(message.file?.url, 'video')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.downloadText,
                  isMyMessage && { color: '#fff' },
                ]}
              >
                ⬇ Download
              </Text>
            </TouchableOpacity>
            {renderMessageFooter()}
          </>
        );

      default:
        return null;
    }
  };

  if (!isMyMessage && isGroupChat) {
    return (
      <View style={styles.senderInfoLeft}>
        {senderAvatar ? (
          <Image source={{ uri: senderAvatar }} style={styles.senderAvatar} />
        ) : (
          <View style={styles.senderAvatarPlaceholder}>
            <Text style={styles.avatarText}>
              {senderName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={{ marginLeft: 8, flex: 1 }}>
          <View style={[styles.bubble, styles.otherBubble]}>
            <Text style={styles.bubbleSenderName}>{senderName}</Text>
            {renderContent()}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.bubble, isMyMessage ? styles.myBubble : styles.otherBubble]}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: normalize(14),
    paddingVertical: normalize(10),
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  myBubble: {
    backgroundColor: '#6A11CB',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#E8E8E8',
    borderBottomLeftRadius: 4,
  },
  senderInfoLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  senderAvatar: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(16),
    marginRight: 8,
  },
  senderAvatarPlaceholder: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(16),
    backgroundColor: '#6A11CB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: '#fff',
    fontSize: normalize(10),
    fontWeight: '700',
  },
  bubbleSenderName: {
    fontSize: normalize(12),
    fontWeight: '600',
    color: '#6A11CB',
    marginBottom: normalize(4),
  },
  myText: {
    color: '#fff',
    fontSize: normalize(15),
    lineHeight: 20,
  },
  otherText: {
    color: '#111',
    fontSize: normalize(15),
    lineHeight: 20,
  },
  timestamp: {
    fontSize: normalize(11),
    marginTop: normalize(4),
  },
  myTimestamp: {
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'right',
  },
  otherTimestamp: {
    color: '#888',
  },
  sendingText: {
    fontSize: normalize(11),
    color: 'rgba(255,255,255,0.6)',
    fontStyle: 'italic',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: normalize(2),
    gap: normalize(4),
  },
  tickWrap: {
    marginLeft: normalize(2),
  },
  image: {
    width: normalize(200),
    height: normalize(200),
    borderRadius: 12,
    marginBottom: 6,
  },
  downloadText: {
    color: '#111',
    fontSize: normalize(12),
    marginTop: normalize(4),
  },
  videoThumbWrapper: {
    width: normalize(200),
    height: normalize(150),
    borderRadius: normalize(12),
    overflow: 'hidden',
    marginBottom: normalize(6),
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  playIconOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  callRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: normalize(4),
  },
  callText: {
    fontSize: normalize(14),
    fontWeight: '500',
  },
  playIcon: {
    color: '#fff',
    fontSize: normalize(32),
  },
});
