// AUTH SCREENS
export type AuthStackParamList = {
  Signin: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  VerifyOtp: { email: string };
  ResetPassword: { email: string; otp: string };
};

// TABS
export type AppTabParamList = {
  Home: undefined;
  Profile: undefined;
};

// ROOT APP STACK (Tabs + Chat + Profile)
export type AppStackParamList = {
  Tabs: undefined;
  Chat: { chatId: string; chatUser: any; isGroupChat: boolean; groupName?: string };
  AddFriends: undefined;
  Profile: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
};



