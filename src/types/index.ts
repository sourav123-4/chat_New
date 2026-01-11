// AUTH SCREENS
export type AuthStackParamList = {
  Signin: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  VerifyOtp: { email: string };
  ResetPassword: { email: string; otp: string };
};

// TABS (Home + 2 placeholders)
export type AppTabParamList = {
  Home: undefined;
  Chats: undefined;
  Profile: undefined;
};

// ROOT APP STACK (Tabs + Chat + Profile)
export type AppStackParamList = {
  Tabs: undefined;
  Chat: { chatId: string, chatUser: any };
  AddFriends: undefined;
  Profile: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
};



