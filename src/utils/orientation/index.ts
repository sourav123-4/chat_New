import {Dimensions, PixelRatio} from 'react-native';
const {width, height, scale} = Dimensions.get('window');

const _scale = width / 320;
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

const widthRatio = width / guidelineBaseWidth;
const heightRatio = height / guidelineBaseHeight;

const normalize = (size: number): number => {
  const newSize = size * _scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

const horizontalScale = (size: number): number => size * widthRatio;
const verticalScale = (size: number): number => size * heightRatio;
const moderateScale = (size: number, factor: number = 0.5): number =>
  size + (horizontalScale(size) - size) * factor;

export {horizontalScale, verticalScale, moderateScale, normalize};
