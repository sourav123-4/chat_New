import { AxiosResponse } from "axios";
import { call, put, takeLatest } from "redux-saga/effects";
import {
  getSearchedUserFailure,
  getSearchedUserSuccess,
  profileDetailsFailure,
  profileDetailsRequest,
  profileDetailsSuccess,
  updateProfileFailure,
  updateProfileSuccess,
} from "../slice/user.slice";
import { instance } from "../../utils/server/instance";
import { API } from "../../utils/constants";
import { show } from "../../components/Toast";

function* handleProfileDetails() {
  try {
    const result: AxiosResponse<any> = yield call(
      instance.get,
      API.user.profile
    );

    if (result?.status === 200) {
      yield put(
        profileDetailsSuccess({
          response: result?.data,
        })
      );
    } else {
      yield put(
        profileDetailsFailure({
          response: result?.data,
        })
      );
    }
  } catch (error: any) {
    yield put(
      profileDetailsFailure({
        response: error?.response?.data,
      })
    );
  }
}

function* handleUpdateProfile(action: { payload: FormData }) {
  try {
    const res: AxiosResponse<any> = yield call(
      instance.put,
      API.user.updateProfile,
      action.payload,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    console.log("res is ==>",res)

    if (res.status === 200) {
      yield put(updateProfileSuccess({ response: res.data }));
      show("Profile updated successfully");
    } else {
      yield put(updateProfileFailure({ response: res.data }));
    }
  } catch (error: any) {
    yield put(updateProfileFailure({ response: error?.response?.data }));
    show(error?.response?.data?.message || "Update failed");
  }
}

function* handleGetUsers(action: any) {
  try {
    const { query } = action.payload;   // ← get search text

    const res: AxiosResponse<any> = yield call(
      instance.get,
      API.user.searchedUsers,
      {
        params: {
          query   // ?search=rahul
        },
      }
    );

    if (res.status === 200) {
      yield put(getSearchedUserSuccess({ response: res.data }));
    } else {
      yield put(getSearchedUserFailure({ response: res.data }));
    }
  } catch (error: any) {
    yield put(getSearchedUserFailure({ response: error?.response?.data }));
    show(error?.response?.data?.message || "Search failed");
  }
}



export default function* userSaga() {
  yield takeLatest("user/profileDetailsRequest", handleProfileDetails);
  yield takeLatest("user/updateProfileRequest", handleUpdateProfile);
  yield takeLatest("user/getSearchedUserRequest", handleGetUsers);
}
