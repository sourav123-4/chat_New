import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ApiResponse<T = any> {
  response: T;
}

interface UserState {
  status: string;
  loading: boolean;
  userId: string;
  profileDetailsResponse: any;
  searchedUserResponse: any;
}

const initialState: UserState = {
  loading: false,
  status: "",
  userId: "",
  profileDetailsResponse: {},
  searchedUserResponse: {},
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    resetUser() {
      return initialState;
    },

    profileDetailsRequest(state) {
      state.loading = true;
      state.status = "user/profileDetailsRequest";
    },

    profileDetailsSuccess(state, action: PayloadAction<ApiResponse>) {
      state.loading = false;
      state.status = "user/profileDetailsSuccess";
      state.profileDetailsResponse = action.payload?.response;
    },

    profileDetailsFailure(state, action: PayloadAction<ApiResponse>) {
      state.loading = false;
      state.status = "user/profileDetailsFailure";
      state.profileDetailsResponse = action.payload?.response;
    },

    updateProfileRequest(state) {
      state.loading = true;
      state.status = "user/updateProfileRequest";
    },

    updateProfileSuccess(state, action: PayloadAction<ApiResponse>) {
      state.loading = false;
      state.status = "user/updateProfileSuccess";
      state.profileDetailsResponse = action.payload.response;
    },

    updateProfileFailure(state) {
      state.loading = false;
      state.status = "user/updateProfileFailure";
    },

    getSearchedUserRequest(state) {
      state.loading = true;
      state.status = "user/getSearchedUserRequest";
    },

    getSearchedUserSuccess(state, action: PayloadAction<ApiResponse>) {
      state.loading = false;
      state.status = "user/getSearchedUserSuccess";
      state.searchedUserResponse = action.payload.response;
    },

    getSearchedUserFailure(state) {
      state.loading = false;
      state.status = "user/getSearchedUserFailure";
    },
  },
});

export const {
  resetUser,                 

  profileDetailsRequest,
  profileDetailsSuccess,
  profileDetailsFailure,

  updateProfileRequest,
  updateProfileSuccess,
  updateProfileFailure,

  getSearchedUserRequest,
  getSearchedUserSuccess,
  getSearchedUserFailure
} = userSlice.actions;

export default userSlice.reducer;
