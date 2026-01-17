
// const base_url = BASE_URL;
// const base_url = 'http://localhost:5000';
const base_url = 'https://66b4877ef483.ngrok-free.app'

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
    messegeList: '/messages/',
    messegecreate: '/messages/send',
  },
  user:{
    profile: '/auth/profile/',
    updateProfile: "/auth/profile",
    searchedUsers: '/auth/search',
  }
};
