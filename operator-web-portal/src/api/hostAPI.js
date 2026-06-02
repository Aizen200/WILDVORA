import api from './axios';

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const hostAPI = {
  getStats:            ()         => api.get('/operator/stats'),
  getListings:         ()         => api.get('/operator/listings'),
  createListing:       (data)     => api.post('/operator/listings', data),
  editListing:         (id, data) => api.patch(`/operator/listings/${id}`, data),
  getBookings:         (params)   => api.get('/operator/bookings', { params }),
  updateBookingStatus: (id, status) => api.patch(`/operator/bookings/${id}/status`, { status }),
  getPayouts:          ()         => api.get('/operator/payouts'),
  updateBankAccount:   (data)     => api.patch('/operator/bank-account', data),
  getReviews:          ()         => api.get('/operator/reviews'),
  respondToReview:     (id, text) => api.patch(`/operator/reviews/${id}/reply`, { hostReply: text }),
};
