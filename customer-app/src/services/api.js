import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// iOS simulator → localhost, Android emulator → 10.0.2.2, physical device → your machine's LAN IP
const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5050/api';
  }
  // Configured to local IP (192.168.1.31) so physical devices, emulators, and simulators can all connect
  return 'http://192.168.1.31:5050/api';
};

export const BASE_URL = getBaseUrl();

const api = axios.create({ baseURL: BASE_URL });

// Attach JWT token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Auth ───────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  me:       ()     => api.get('/auth/me'),
};

// ─── Experiences ─────────────────────────────────────────────
export const experienceAPI = {
  getAll: (params) => api.get('/experiences', { params }),
  getOne: (id)     => api.get(`/experiences/${id}`),
  seed:   ()       => api.post('/experiences/seed/demo'),
};

// ─── Bookings ────────────────────────────────────────────────
export const bookingAPI = {
  create:  (data)   => api.post('/bookings', data),
  getMy:   (params) => api.get('/bookings/my', { params }),
  getOne:  (id)     => api.get(`/bookings/${id}`),
  cancel:  (id)     => api.patch(`/bookings/${id}/cancel`),
};

// ─── Reviews ─────────────────────────────────────────────────
export const reviewAPI = {
  getForExperience: (id)   => api.get(`/reviews/experience/${id}`),
  getMy:            ()     => api.get('/reviews/my'),
  create:           (data) => api.post('/reviews', data),
};

// ─── Users ───────────────────────────────────────────────────
export const userAPI = {
  getProfile:     ()     => api.get('/users/profile'),
  updateProfile:  (data) => api.patch('/users/profile', data),
  toggleWishlist: (id)   => api.post(`/users/wishlist/${id}`),
  changePassword: (data) => api.patch('/users/password', data),
};

export default api;
