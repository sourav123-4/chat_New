import { AxiosResponse } from 'axios';
import { call, put, takeLatest } from 'redux-saga/effects';
import { instance } from '../../utils/server/instance';
import { API } from '../../utils/constants';
import { chatCreateFailure, chatCreateSuccess, chatListFailure, chatListSuccess } from '../slice/chat.slice';
import { show } from '../../components/Toast';

function* handleChatListRequest() {
  try {
    const result: AxiosResponse<any> = yield call(
      instance.get,
      API.chat.chatList,
    );

    if (result?.status === 200) {
      yield put(
        chatListSuccess({
          response: result?.data,
        }),
      );
    } else {
      yield put(
        chatListFailure({
          response: result?.data,
        }),
      );
    }
    // show(result?.data?.message);
  } catch (error: any) {
    yield put(
      chatListFailure({
        response: error?.response?.data,
      }),
    );
    // show(error?.response?.data?.message);
  }
}

function* handleChatCreateRequest(action: any) {
  try {
    const result: AxiosResponse<any> = yield call(
      instance.post,
      API.chat.chatCreate,
      action.payload,
    );

    if (result?.status === 200) {
      yield put(
        chatCreateSuccess({
          response: result?.data,
        }),
      );
    } else {
      yield put(
        chatCreateFailure({
          response: result?.data,
        }),
      );
    }
    // show(result?.data?.message);
  } catch (error: any) {
    yield put(
      chatCreateFailure({
        response: error?.response?.data,
      }),
    );
    // show(error?.response?.data?.message);
  }
}

function* chatSaga() {
  yield takeLatest('chat/chatListRequest', handleChatListRequest);
  yield takeLatest('chat/chatCreateRequest', handleChatCreateRequest);

}

export default chatSaga;
