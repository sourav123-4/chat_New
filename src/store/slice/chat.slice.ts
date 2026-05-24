import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ApiResponse<T = any> {
  response: T;
}

interface ChatState {
  status: string;
  loading: boolean;
  userId: string;
  chatListResponse: any;
  chatCreateResponse: any;
}

const initialState: ChatState = {
  loading: false,
  status: "",
  userId: "",
  chatListResponse: {},
  chatCreateResponse: {},
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    resetChat() {
      return initialState;
    },

    chatListRequest(state) {
      state.loading = true;
      state.status = "chat/chatListRequest";
    },

    chatListSuccess(state, action: PayloadAction<ApiResponse>) {
      state.loading = false;
      state.status = "chat/chatListSuccess";
      state.chatListResponse = action.payload?.response;
    },

    chatListFailure(state, action: PayloadAction<ApiResponse>) {
      state.loading = false;
      state.status = "chat/chatListFailure";
      state.chatListResponse = action.payload?.response;
    },


    chatCreateRequest(
      state,
      _action: PayloadAction<{
        participants: string[];
        isGroup: boolean;
        groupName?: string;
      }>
    ) {
      state.loading = true;
      state.status = "chat/chatListRequest";
    },

    chatCreateSuccess(state, action: PayloadAction<ApiResponse>) {
      state.loading = false;
      state.status = "chat/chatCreateSuccess";
      state.chatCreateResponse = action.payload?.response;
    },

    chatCreateFailure(state, action: PayloadAction<ApiResponse>) {
      state.loading = false;
      state.status = "chat/chatCreateFailure";
      state.chatCreateResponse = action.payload?.response;
    },
  },
});

export const {
  resetChat,                 

  chatListRequest,
  chatListSuccess,
  chatListFailure,

  chatCreateRequest,
  chatCreateSuccess,
  chatCreateFailure

} = chatSlice.actions;

export default chatSlice.reducer;
