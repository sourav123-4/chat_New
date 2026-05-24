import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ApiResponse<T = any> {
  response: T;
}

interface AuthState {
  status: string;
  loading: boolean;
  token: string;
  refreshToken: string;
  userId: string;
  device_token: string;

  signinResponse: any;
  signUpResponse: any;
}

const initialState: AuthState = {
  loading: false,
  status: "",
  token: "",
  refreshToken: "",
  userId: "",
  device_token: "",
  signinResponse: {},
  signUpResponse: {},
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    resetAuth() {
      return initialState;
    },

    setTokenRefreshToken(
      state,
      action: PayloadAction<{ token: string; refreshToken: string }>
    ) {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
    },

    signInRequest(state, _action: PayloadAction<{ email: string; password: string }>) {
      state.loading = true;
      state.status = "auth/signInRequest";
    },

    signInSuccess(state, action: PayloadAction<ApiResponse>) {
      state.loading = false;
      state.status = "auth/signInSuccess";

      const data = action.payload?.response;

      state.token = data?.token ?? "";
      state.refreshToken = data?.refreshToken ?? "";
      state.signinResponse = data ?? {};
      state.userId = data?.user?._id ?? "";
    },

    signInFailure(state, action: PayloadAction<ApiResponse>) {
      state.loading = false;
      state.status = "auth/signInFailure";
      state.signinResponse = action.payload?.response ?? {};
    },

    signUpRequest(state, _action: PayloadAction<FormData>) {
      state.loading = true;
      state.status = "auth/signUpRequest";
    },

    signUpSuccess(state, action: PayloadAction<ApiResponse>) {
      state.loading = false;
      state.status = "auth/signUpSuccess";

      const data = action.payload?.response?.data ?? action.payload?.response;

      state.token = data?.token ?? "";
      state.refreshToken = data?.refreshToken ?? "";
      state.signUpResponse = data ?? {};
      state.userId = data?.userId ?? "";
    },

    signUpFailure(state, action: PayloadAction<ApiResponse>) {
      state.loading = false;
      state.status = "auth/signUpFailure";
      state.signUpResponse = action.payload?.response ?? {};
    },

    forgotPasswordRequest(state, _action: PayloadAction<{ email: string }>) {
      state.loading = true;
      state.status = "auth/forgotPasswordRequest";
    },

    forgotPasswordSuccess(state, _action: PayloadAction<ApiResponse>) {
      state.loading = false;
      state.status = "auth/forgotPasswordSuccess";
    },

    forgotPasswordFailure(state, _action: PayloadAction<ApiResponse>) {
      state.loading = false;
      state.status = "auth/forgotPasswordFailure";
    },

    verifyOtpRequest(state, _action: PayloadAction<{ email: string; otp: string }>) {
      state.loading = true;
      state.status = "auth/verifyOtpRequest";
    },

    verifyOtpSuccess(state, _action: PayloadAction<ApiResponse>) {
      state.loading = false;
      state.status = "auth/verifyOtpSuccess";
    },

    verifyOtpFailure(state, _action: PayloadAction<ApiResponse>) {
      state.loading = false;
      state.status = "auth/verifyOtpFailure";
    },

    resetPasswordRequest(
      state,
      _action: PayloadAction<{ email: string; otp: string; newPassword: string }>
    ) {
      state.loading = true;
      state.status = "auth/resetPasswordRequest";
    },

    resetPasswordSuccess(state, _action: PayloadAction<ApiResponse>) {
      state.loading = false;
      state.status = "auth/resetPasswordSuccess";
    },

    resetPasswordFailure(state, _action: PayloadAction<ApiResponse>) {
      state.loading = false;
      state.status = "auth/resetPasswordFailure";
    },

    changePasswordRequest(
      state,
      _action: PayloadAction<{ oldPassword: string; newPassword: string }>
    ) {
      state.loading = true;
      state.status = "auth/changePasswordRequest";
    },

    changePasswordSuccess(state, _action: PayloadAction<ApiResponse>) {
      state.loading = false;
      state.status = "auth/changePasswordSuccess";
    },

    changePasswordFailure(state, _action: PayloadAction<ApiResponse>) {
      state.loading = false;
      state.status = "auth/changePasswordFailure";
    },

    googleSignInRequest(state, _action: PayloadAction<{ token?: string | null }>) {
      state.loading = true;
      state.status = "auth/googleSignInRequest";
    },

    googleSignInSuccess(state, action: PayloadAction<ApiResponse>) {
      state.loading = false;
      state.status = "auth/googleSignInSuccess";

      const data = action.payload?.response;

      state.token = data?.token ?? "";
      state.refreshToken = data?.refreshToken ?? "";
      state.signinResponse = data ?? {};
      state.userId = data?.user?._id ?? "";
    },

    googleSignInFailure(state, action: PayloadAction<ApiResponse>) {
      state.loading = false;
      state.status = "auth/googleSignInFailure";
      state.signinResponse = action.payload?.response ?? {};
    },

    setDeviceToken(state, action: PayloadAction<string>) {
      state.device_token = action.payload;
    },
  },
});

export const {
  resetAuth,
  setTokenRefreshToken,

  signInRequest,
  signInSuccess,
  signInFailure,

  signUpRequest,
  signUpSuccess,
  signUpFailure,

  forgotPasswordRequest,
  forgotPasswordSuccess,
  forgotPasswordFailure,

  verifyOtpRequest,
  verifyOtpSuccess,
  verifyOtpFailure,

  resetPasswordRequest,
  resetPasswordSuccess,
  resetPasswordFailure,

  changePasswordRequest,
  changePasswordSuccess,
  changePasswordFailure,

  googleSignInRequest,
  googleSignInSuccess,
  googleSignInFailure,

  setDeviceToken,
} = authSlice.actions;

export default authSlice.reducer;
