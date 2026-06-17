import api from './axios';

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

export const hostAPI = {
  getStats:            ()           => api.get('/operator/stats'),
  getListings:         ()           => api.get('/operator/listings'),
  getListing:          (id)         => api.get(`/experiences/${id}`),
  createListing:       (data)       => api.post('/operator/listings', data),
  editListing:         (id, data)   => api.patch(`/operator/listings/${id}`, data),
  resubmitListing:     (id)         => api.patch(`/operator/listings/${id}/resubmit`),
  deleteListing:       (id)         => api.delete(`/operator/listings/${id}`),
  updateBankAccount:   (data)       => api.patch('/operator/bank-account', data),
  getPayouts:          ()           => api.get('/operator/payouts'),
  getBookings:         (params)     => api.get('/operator/bookings', { params }),
  updateBookingStatus: (id, status) => api.patch(`/operator/bookings/${id}/status`, { status }),
  getReviews:          ()           => api.get('/operator/reviews'),
  respondToReview:     (id, text)   => api.patch(`/operator/reviews/${id}/reply`, { hostReply: text }),
};
