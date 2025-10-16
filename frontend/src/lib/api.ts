import axios from 'axios';
import { ENV } from './env';

export const api = axios.create({
  baseURL: ENV.API_URL,
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
