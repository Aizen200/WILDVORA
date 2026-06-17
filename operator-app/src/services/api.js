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

// Operator API endpoints
export const operatorAPI = {
  getStats:         ()         => api.get('/operator/stats'),
  getListings:      ()         => api.get('/operator/listings'),
  createListing:    (data)     => api.post('/operator/listings', data),
  editListing:      (id, data) => api.patch(`/operator/listings/${id}`, data),
  resubmitListing:  (id)       => api.patch(`/operator/listings/${id}/resubmit`),
  deleteListing:    (id)       => api.delete(`/operator/listings/${id}`),
  getBookings:      (params)   => api.get('/operator/bookings', { params }),
  updateBooking:    (id, data) => api.patch(`/operator/bookings/${id}/status`, data),
  getPayouts:       ()         => api.get('/operator/payouts'),
  getReviews:       ()         => api.get('/operator/reviews'),
  respondToReview:  (id, data) => api.patch(`/operator/reviews/${id}/reply`, data),
};

export default api;
