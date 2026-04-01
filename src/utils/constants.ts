import { BASE_URL, PUSHER_APP_KEY, PUSHER_CLUSTER } from '@env';

declare module '@env' {
  export const BASE_URL: string;
  export const PUSHER_APP_KEY: string;
  export const PUSHER_CLUSTER: string;
  export const AGORA_APP_ID: string;
}

const base_url = BASE_URL;

export const URL_LIST = {
  base_url: base_url,
  api_base_url: base_url + '/api',
  bucket_url: base_url,
};

export const BUCKET_IMAGE_URL = {
  profile_image: URL_LIST.bucket_url + '/uploads/user_profile_pic/',
  profile_image_interpreter: URL_LIST.bucket_url + '/uploads/interpreter_profile_pic/',
  business_image: URL_LIST.bucket_url + '/uploads/user_business_logos/',
};

export const API = {
  auth: {
    signUp: '/auth/signup/',
    signIn: '/auth/login/',
    googleSignIn: '/auth/google-signin',
    forgotPassword: '/auth/forgot-password',
    verifyOtp: '/auth/verify-otp',
    resetPassword: '/auth/reset-password',
    changePassword: '/auth/change-password',
  },
  chat:{
    chatList: '/chats/list/',
    chatCreate: '/chats/create',
  },
  messege:{
    messegeList: '/messages/list',
    messegecreate: '/messages/send',
    messegeRead: '/messages/read',
  },
  user:{
    profile: '/auth/profile/',
    updateProfile: "/auth/profile",
    searchedUsers: '/auth/search',
  }
};
