import { AxiosResponse } from "axios";
import { call, put, takeLatest } from "redux-saga/effects";
import {
  signInFailure,
  signInSuccess,
  signUpFailure,
  signUpSuccess,
  forgotPasswordSuccess,
  forgotPasswordFailure,
  verifyOtpSuccess,
  verifyOtpFailure,
  resetPasswordSuccess,
  resetPasswordFailure,
  changePasswordSuccess,
  changePasswordFailure,
  googleSignInSuccess,
  googleSignInFailure,
} from "../slice/auth.slice";
import { instance } from "../../utils/server/instance";
import { API } from "../../utils/constants";
import { show } from "../../components/Toast";

function* handleSignIn(action: {
  type: string;
  payload: { email: string; password: string };
}) {
  try {

    console.log("email and password==>",action.payload)
    const result: AxiosResponse<any> = yield call(
      instance.post,
      API.auth.signIn,
      action.payload
    );

    console.log("result is ==>",result)

    yield put(
      result?.status === 200
        ? signInSuccess({ response: result.data })
        : signInFailure({ response: result.data })
    );

    yield call(show, "Logged In Successfully!!", 2000, "top");
  } catch (error: any) {
    console.log("error in psyload",error)
    yield put(
      signInFailure({
        response: error?.response?.data,
      })
    );

    yield call(show, error?.response?.data?.message || "Login failed", 2000, "top");
  }
}

function* handleSignUp(action: { type: string; payload: FormData }) {
  try {
    const result: AxiosResponse<any> = yield call(
      instance.post,
      API.auth.signUp,
      action.payload,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    yield put(
      result?.status === 201
        ? signUpSuccess({ response: result.data })
        : signUpFailure({ response: result.data })
    );

    yield call(show, result?.data?.message || "Signup successful!", 2000, "top");
  } catch (error: any) {
    yield put(
      signUpFailure({
        response: error?.response?.data,
      })
    );

    yield call(show, error?.response?.data?.message || "Signup failed", 2000, "top");
  }
}

function* handleForgotPassword(action: { type: string; payload: { email: string } }) {
  try {
    const result: AxiosResponse<any> = yield call(
      instance.post,
      API.auth.forgotPassword,
      action.payload
    );

    yield put(forgotPasswordSuccess({ response: result.data }));
    yield call(show, "OTP sent to your email", 2000, "top");
  } catch (error: any) {
    yield put(forgotPasswordFailure({ response: error?.response?.data }));
    yield call(show, error?.response?.data?.message || "Failed to send OTP", 2000, "top");
  }
}

function* handleVerifyOtp(action: { type: string; payload: { email: string; otp: string } }) {
  try {
    const result: AxiosResponse<any> = yield call(
      instance.post,
      API.auth.verifyOtp,
      action.payload
    );

    yield put(verifyOtpSuccess({ response: result.data }));
    yield call(show, "OTP verified successfully", 2000, "top");
  } catch (error: any) {
    yield put(verifyOtpFailure({ response: error?.response?.data }));
    yield call(show, error?.response?.data?.message || "Invalid OTP", 2000, "top");
  }
}

function* handleResetPassword(action: { type: string; payload: { email: string; otp: string; newPassword: string } }) {
  try {
    const result: AxiosResponse<any> = yield call(
      instance.post,
      API.auth.resetPassword,
      action.payload
    );

    yield put(resetPasswordSuccess({ response: result.data }));
    yield call(show, "Password reset successfully", 2000, "top");
  } catch (error: any) {
    yield put(resetPasswordFailure({ response: error?.response?.data }));
    yield call(show, error?.response?.data?.message || "Failed to reset password", 2000, "top");
  }
}

function* handleChangePassword(action: { type: string; payload: { oldPassword: string; newPassword: string } }) {
  try {
    const result: AxiosResponse<any> = yield call(
      instance.put,
      API.auth.changePassword,
      action.payload
    );

    yield put(changePasswordSuccess({ response: result.data }));
    yield call(show, "Password changed successfully", 2000, "top");
  } catch (error: any) {
    yield put(changePasswordFailure({ response: error?.response?.data }));
    yield call(show, error?.response?.data?.message || "Failed to change password", 2000, "top");
  }
}

function* handleGoogleSignIn(action: { type: string; payload: { token: string } }) {
  try {
    const result: AxiosResponse<any> = yield call(
      instance.post,
      API.auth.googleSignIn,
      action.payload
    );

    console.log("result in auth saga==>",result)

    yield put(
      result?.status === 200
        ? googleSignInSuccess({ response: result.data })
        : googleSignInFailure({ response: result.data })
    );

    yield call(show, "Google Sign-In Successful!", 2000, "top");
  } catch (error: any) {
    yield put(
      googleSignInFailure({
        response: error?.response?.data,
      })
    );

    yield call(show, error?.response?.data?.message || "Google Sign-In failed", 2000, "top");
  }
}

export default function* authSaga() {
  yield takeLatest("auth/signInRequest", handleSignIn);
  yield takeLatest("auth/signUpRequest", handleSignUp);
  yield takeLatest("auth/forgotPasswordRequest", handleForgotPassword);
  yield takeLatest("auth/verifyOtpRequest", handleVerifyOtp);
  yield takeLatest("auth/resetPasswordRequest", handleResetPassword);
  yield takeLatest("auth/changePasswordRequest", handleChangePassword);
  yield takeLatest("auth/googleSignInRequest", handleGoogleSignIn);
}
