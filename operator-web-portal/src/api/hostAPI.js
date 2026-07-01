import api from './axios';

export const inquiryAPI = {
  getInquiries: ()                  => api.get('/operator/inquiries'),
  sendReply:    (inquiryId, text)   => api.post(`/inquiries/${inquiryId}/messages`, { text }),
};

export const messageAPI = {
  getByBooking: (bookingId)         => api.get(`/messages/booking/${bookingId}`),
  send:         (bookingId, text)   => api.post('/messages', { bookingId, text }),
  getThreads:   ()                  => api.get('/operator/message-threads'),
};

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
  pauseListing:        (id)         => api.patch(`/operator/listings/${id}/pause`),
  resubmitListing:     (id)         => api.patch(`/operator/listings/${id}/resubmit`),
  deleteListing:       (id)         => api.delete(`/operator/listings/${id}`),
  updateBankAccount:   (data)       => api.patch('/operator/bank-account', data),
  getPayouts:          ()           => api.get('/operator/payouts'),
  getBookings:         (params)     => api.get('/operator/bookings', { params }),
  updateBookingStatus: (id, status, statusNote = '') => api.patch(`/operator/bookings/${id}/status`, { status, statusNote }),
  getGuides:           ()           => api.get('/operator/guides'),
  assignGuide:         (id, guideId) => api.patch(`/operator/bookings/${id}/assign-guide`, { guideId }),
  getReviews:          ()           => api.get('/operator/reviews'),
  respondToReview:     (id, text)   => api.patch(`/operator/reviews/${id}/reply`, { hostReply: text }),
  getMarketplace:      ()           => api.get('/operator/marketplace'),
  linkService:         (id)         => api.post(`/operator/marketplace/${id}/link`),
  unlinkService:       (id)         => api.post(`/operator/marketplace/${id}/unlink`),
};
