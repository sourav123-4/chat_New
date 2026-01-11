import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { API, URL_LIST } from '../constants';
import { store } from '../../store';
// import { setTokenRefreshToken, logoutRequest } from '../../store/authSlice';

export const instance = axios.create({
  baseURL: URL_LIST.api_base_url,
  headers: {
    'Content-Type': 'application/json',
  },
});

const refreshTokenApiCall = async () => {
  const { auth } = API;

  const { refreshToken } = store.getState().auth;

  if (!refreshToken) return null;

  try {
    const response = await axios.post(
      `${URL_LIST.api_base_url}/${auth.refreshToken}`,
      { refreshToken }
    );

    // store.dispatch(
    //   setTokenRefreshToken({
    //     token: response.data.accessToken,
    //     refreshToken: response.data.refreshToken,
    //   })
    // );

    return response.data.accessToken;
  } catch (error) {
    // store.dispatch(logoutRequest({}));
    throw error;
  }
};

/**
 * REQUEST INTERCEPTOR
 * Adds Authorization: Bearer <token>
 */
instance.interceptors.request.use(async config => {
  const state = await NetInfo.fetch();

  if (!state.isConnected) {
    throw new axios.Cancel(
      'No internet connection. Please connect to the internet.'
    );
  }

  const { token } = store.getState().auth;

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/**
 * RESPONSE INTERCEPTOR
 * Refreshes token automatically if expired (401)
 */
instance.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // expired token case
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshTokenApiCall();

        if (!newToken) throw new Error('No refresh token');

        // update axios defaults + original request
        instance.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return instance(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default instance;
