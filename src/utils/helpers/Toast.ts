import Snackbar from 'react-native-snackbar';

export const showMessage = (message: string) => {
  if (message !== undefined && message !== '') {
    return Snackbar.show({
      text: message,
      duration: Snackbar.LENGTH_LONG,
    });
  }
};
