import { useEffect, useState } from 'react';
import { Keyboard, KeyboardEvent } from 'react-native';

function useKeyboardVisible() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const onKeyboardShow = (e: KeyboardEvent) => {
      setKeyboardVisible(true);
      setKeyboardHeight(e.endCoordinates.height);
    };

    const onKeyboardHide = () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    };

    const showListener = Keyboard.addListener('keyboardDidShow', onKeyboardShow);
    const hideListener = Keyboard.addListener('keyboardDidHide', onKeyboardHide);

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  return { isKeyboardVisible, keyboardHeight };
}

export default useKeyboardVisible;
