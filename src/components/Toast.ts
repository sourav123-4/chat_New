import { NativeModules, Platform, ToastAndroid, Alert } from "react-native";

const { NativeToast } = NativeModules;

type Position = "top" | "center" | "bottom";

export function show(
  message: string,
  duration: number = 2000,
  position: Position = "top"
) {
  // If your custom native toast exists — use it
  if (NativeToast?.show) {
    console.log("Toast.show -> native", { message, duration, position })
    // Platform.OS === 'ios' ? NativeToast.show(message, duration) : 
    // Pass the requested position through to the native module
    NativeToast.show(message, duration, position);
    return;
  }

  // Fallback (Android built-in toast)
  if (Platform.OS === "android") {
    // Try to emulate same positions if native module isn't available
    switch (position) {
      case "top":
        ToastAndroid.showWithGravityAndOffset(
          message,
          ToastAndroid.SHORT,
          ToastAndroid.TOP,
          0,
          140
        );
        break;
      case "center":
        ToastAndroid.showWithGravity(message, ToastAndroid.SHORT, ToastAndroid.CENTER);
        break;
      default:
        ToastAndroid.showWithGravityAndOffset(
          message,
          ToastAndroid.SHORT,
          ToastAndroid.BOTTOM,
          0,
          140
        );
    }
    return;
  }

  // Fallback iOS (Alert)
  Alert.alert("", message);
}
