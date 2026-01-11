import React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  View,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../themes';

type LoaderProps = {
  visible?: boolean;
};

const Loader: React.FC<LoaderProps> = ({visible = false}) => {
  return visible ? (
    <SafeAreaView style={styles.container}>
      <View style={styles.loaderBox}>
        <ActivityIndicator size="large" color={Colors.black} />
      </View>
    </SafeAreaView>
  ) : null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 10,
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    height: Dimensions.get('window').height,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderBox: {
    height: 100,
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
  },
});

export default Loader;
