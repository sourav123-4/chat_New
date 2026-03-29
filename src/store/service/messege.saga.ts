import { AxiosResponse } from 'axios';
import { call, put, takeLatest } from 'redux-saga/effects';
import { instance } from '../../utils/server/instance';
import { API } from '../../utils/constants';
import { chatCreateFailure, chatCreateSuccess, chatListFailure, chatListSuccess } from '../slice/chat.slice';
import { show } from '../../components/Toast';
import { messegeListFailure, messegeListSuccess, messegeSendFailure, messegeSendSuccess } from '../slice/messege.slice';

function* handleMessegeListRequest(action: any) {
  try {
    const { conversationId, page, limit } = action.payload;
    const result: AxiosResponse<any> = yield call(
      instance.post,
      API.messege.messegeList,
      {
        conversationId,
        page,
        limit
      }
    );
    console.log("result is ==>",result)

    if (result?.status === 200) {
      yield put(
        messegeListSuccess({
          response: result?.data,
        }),
      );
    } else {
      yield put(
        messegeListFailure({
          response: result?.data,
        }),
      );
    }
    // show(result?.data?.message);
  } catch (error: any) {
    yield put(
      messegeListFailure({
        response: error?.response?.data,
      }),
    );
    // show(error?.response?.data?.message);
  }
}

function* handleMessegeSendRequest(action: any) {
  try {
    const result: AxiosResponse<any> = yield call(
      instance.post,
      API.messege.messegecreate,
      action.payload,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    if (result?.status === 200) {
      yield put(
        messegeSendSuccess({
          response: result?.data,
        }),
      );
    } else {
      yield put(
        messegeSendFailure({
          response: result?.data,
        }),
      );
    }
    // show(result?.data?.message);
  } catch (error: any) {
    yield put(
      messegeSendFailure({
        response: error?.response?.data,
      }),
    );
    // show(error?.response?.data?.message);
  }
}

function* messegeSaga() {
  yield takeLatest('messege/messegeListRequest', handleMessegeListRequest);
  yield takeLatest('messege/messegeSendRequest', handleMessegeSendRequest);


}

export default messegeSaga;
