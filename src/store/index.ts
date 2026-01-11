import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { persistStore, persistReducer } from 'redux-persist';
import { logger } from 'redux-logger';
import authReducer from './slice/auth.slice';
import userReducer from './slice/user.slice';
import chatReducer from './slice/chat.slice';
import messegeReducer from './slice/messege.slice';
import rootSaga from './service/rootSaga'; 
import Storage from '../utils/storage';

const createSagaMiddleware = require('redux-saga');

const appReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  chat: chatReducer,
  messege: messegeReducer,
});

const rootReducer = (state: any, action: any) => {
  if (action.type === 'RESET_STORE') {
    state = undefined;
  }
  return appReducer(state, action);
};

const persistConfig = {
  key: 'root',
  storage: Storage,
  whitelist: ['auth'],
  blacklist: [ 'user', 'chat', 'messege'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const sagaMiddleware = createSagaMiddleware.default();

const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      thunk: false,
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredPaths: ['register', 'rehydrate', 'formData'],
        ignoredActionPaths: ['payload', 'meta.arg'],
      },
    }).concat(logger, sagaMiddleware),
});

sagaMiddleware.run(rootSaga);

const persistor = persistStore(store);

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export { store, persistor };
