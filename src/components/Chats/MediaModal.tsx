import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Image } from 'react-native';
import Modal from 'react-native-modal';
import Video from 'react-native-video';
import { normalize } from '../../utils/orientation';

interface MediaModalProps {
  visible: boolean;
  url: string | null;
  type: 'image' | 'video';
  onClose: () => void;
}

export const MediaModal: React.FC<MediaModalProps> = ({
  visible,
  url,
  type,
  onClose,
}) => {
  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      style={styles.modal}
    >
      <View style={styles.container}>
        {type === 'video' && url ? (
          <Video
            source={{ uri: url }}
            style={styles.video}
            controls
            resizeMode="contain"
            paused={false}
          />
        ) : (
          <Image
            source={{ uri: url! }}
            style={styles.image}
          />
        )}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
  },
  image: {
    flex: 1,
    resizeMode: 'contain',
  },
  closeButton: {
    position: 'absolute',
    top: normalize(50),
    right: normalize(20),
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: normalize(24),
    fontWeight: 'bold',
  },
});