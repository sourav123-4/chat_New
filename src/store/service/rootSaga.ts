import { all } from 'redux-saga/effects';
import authSaga from './auth.saga';
import userSaga from './user.saga';
import chatSaga from './chat.saga';
import messegeSaga from './messege.saga';

export default function* rootSaga() {
  yield all([
    authSaga(),
    userSaga(),
    chatSaga(),
    messegeSaga(),
  ]);
}
