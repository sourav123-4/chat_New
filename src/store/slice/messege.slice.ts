import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ApiResponse<T = any> {
  response: T;
}

interface MessegeState {
  status: string;
  loading: boolean;
  loadingMore: boolean;
  messegeListResponse: any;
  messegeSendResponse: any;
  hasMore: boolean;
  page: number;
}

const initialState: MessegeState = {
  loading: false,
  loadingMore: false,
  status: "",
  messegeListResponse: {},
  messegeSendResponse: {},
  hasMore: true,
  page: 1,
};

const messegeSlice = createSlice({
  name: "messege",
  initialState,
  reducers: {
    resetMessege() {
      return initialState;
    },

    messegeListRequest(state, action: PayloadAction<any>) {
      if (action.payload.page === 1) {
        state.loading = true;
      } else {
        state.loadingMore = true;
      }
      state.status = "messege/messegeListRequest";
    },

    messegeListSuccess(state, action: PayloadAction<ApiResponse>) {
      state.loading = false;
      state.loadingMore = false;
      state.status = "messege/messegeListSuccess";
      const { messages, pagination } = action.payload.response;
      state.hasMore = pagination?.hasMore ?? false;
      state.page = pagination?.page ?? 1;
      state.messegeListResponse = { messages, page: pagination?.page ?? 1 };
    },

    messegeListFailure(state, action: PayloadAction<ApiResponse>) {
      state.loading = false;
      state.loadingMore = false;
      state.status = "messege/messegeListFailure";
      state.messegeListResponse = action.payload?.response;
    },

    messegeSendRequest(state, action: PayloadAction<any>) {
      state.status = "messege/messegeSendRequest";
    },

    messegeSendSuccess(state, action: PayloadAction<ApiResponse>) {
      state.status = "messege/messegeSendSuccess";
      state.messegeSendResponse = action.payload?.response;
    },

    messegeSendFailure(state, action: PayloadAction<ApiResponse>) {
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
