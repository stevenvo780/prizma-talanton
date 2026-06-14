import axios from 'axios';
import store from '../redux/store';
import { loading } from '../redux/ui';
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

let calls = 0;

api.interceptors.request.use(function (config) {
  const state = store.getState();
  const token = state.auth.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  calls++;
  store.dispatch(loading(true));
  return config;
}, function (error) {
  calls++;
  store.dispatch(loading(true));
  console.error(error);
  return Promise.reject(error);
});

api.interceptors.response.use(function (response) {
  calls--;
  if (calls === 0) {
    store.dispatch(loading(false));
  }
  return response;
}, function (error) {
  console.error(error);
  calls--;
  if (calls === 0) {
    store.dispatch(loading(false));
  }
  return Promise.reject(error);
});

export default api;
