import Colors from '@app/themes/Colors';
import React from 'react';
import {
  StatusBar,
  SafeAreaView,
  View,
  StatusBarProps,
  ViewStyle,
} from 'react-native';

const STATUSBAR_HEIGHT = StatusBar.currentHeight;

interface MyStatusBarProps extends StatusBarProps {
  backgroundColor?: string;
  height?: number;
}

const MyStatusBar: React.FC<MyStatusBarProps> = ({
  backgroundColor = Colors.white,
  ...props
}) => (
  <View
    style={[
      {
        height: STATUSBAR_HEIGHT,
        backgroundColor,
      } as ViewStyle,
    ]}>
    <SafeAreaView>
      <StatusBar
        translucent
        backgroundColor={backgroundColor}
        {...props}
        barStyle={props?.barStyle ? props?.barStyle : 'dark-content'}
      />
    </SafeAreaView>
  </View>
);

export default MyStatusBar;
