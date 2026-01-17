import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

// Configure Google Sign-In
export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    webClientId: '21201803845-h26krobo8s7gur9ta4el5o0iueg1bv6r.apps.googleusercontent.com', // Get from Google Cloud Console
    // iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com', // Get from Google Cloud Console
    offlineAccess: true,
    forceCodeForRefreshToken: true,
    accountName: '', // for Android
  });
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();

    console.log("user info==>",userInfo)
    return {
      success: true,
      data: userInfo,
    };
  } catch (error: any) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      return {
        success: false,
        message: 'Sign-in was cancelled',
      };
    } else if (error.code === statusCodes.IN_PROGRESS) {
      return {
        success: false,
        message: 'Sign-in is in progress',
      };
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return {
        success: false,
        message: 'Play Services not available',
      };
    } else {
      return {
        success: false,
        message: error.message || 'Sign-in failed',
      };
    }
  }
};

// Sign out
export const signOutFromGoogle = async () => {
  try {
    await GoogleSignin.signOut();
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Sign-out failed',
    };
  }
};

// Get current user
export const getCurrentGoogleUser = async () => {
  try {
    const isSignedIn = await GoogleSignin.isSignedIn();
    if (!isSignedIn) {
      return { success: false, user: null };
    }
    const userInfo = await GoogleSignin.getCurrentUser();
    return { success: true, user: userInfo };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};
