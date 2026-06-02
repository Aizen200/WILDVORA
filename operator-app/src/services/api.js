import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// iOS simulator → localhost, Android emulator → 10.0.2.2, physical device → your machine's LAN IP
const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:3000/api';
  }
  // Configured to local IP (192.168.1.31) so physical devices, emulators, and simulators can all connect
  return 'http://192.168.100.7:3000/api';
};

export const BASE_URL = getBaseUrl();

const api = axios.create({ baseURL: BASE_URL });

// Attach JWT token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth API endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  me:       ()     => api.get('/auth/me'),
};

export default api;
