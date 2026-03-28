import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ApiResponse<T = any> {
  response: T;
}

interface MessegeState {
  status: string;
  loading: boolean;
  messegeListResponse: any;
  messegeSendResponse: any;
}

const initialState: MessegeState = {
  loading: false,
  status: "",
  messegeListResponse: {},
  messegeSendResponse: {},
};

const messegeSlice = createSlice({
  name: "messege",
  initialState,
  reducers: {
    resetMessege() {
      return initialState;
    },

    messegeListRequest(state, action: PayloadAction<any>) {
      state.loading = true;
      state.status = "messege/messegeListRequest";
    },

    messegeListSuccess(state, action: PayloadAction<ApiResponse>) {
      state.loading = false;
      state.status = "messege/messegeListSuccess";
      state.messegeListResponse = action.payload?.response;
    },

    messegeListFailure(state, action: PayloadAction<ApiResponse>) {
      state.loading = false;
      state.status = "messege/messegeListFailure";
      state.messegeListResponse = action.payload?.response;
    },


    messegeSendRequest(state, action: PayloadAction<any>) {
      state.loading = true;
      state.status = "messege/messegeSendRequest";
    },

    messegeSendSuccess(state, action: PayloadAction<ApiResponse>) {
      state.loading = false;
      state.status = "messege/messegeSendSuccess";
      state.messegeSendResponse = action.payload?.response;
    },

    messegeSendFailure(state, action: PayloadAction<ApiResponse>) {
      state.loading = false;
      state.status = "messege/messegeSendFailure";
      state.messegeSendResponse = action.payload?.response;
    },
  },
});

export const {
  resetMessege,                 

  messegeListRequest,
  messegeListSuccess,
  messegeListFailure,

  messegeSendRequest,
  messegeSendSuccess,
  messegeSendFailure,

} = messegeSlice.actions;

export default messegeSlice.reducer;
