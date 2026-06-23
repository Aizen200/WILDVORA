const express = require('express');
const router = express.Router();
const { protect } = require('../services/Auth');
const { restrictTo } = require('../middlewares/rbac');
const {
  getStats,
  getListings,
  createListing,
  editListing,
  pauseListing,
  resubmitListing,
  deleteListing,
  getBookings,
  updateBookingStatus,
  getPayouts,
  updateBankAccount,
  getReviews,
  respondToReview,
  getInquiries,
  getMessageThreads,
} = require('../controllers/OperatorController');

// All operator routes are protected and restricted to operators/hosts
router.use(protect);
router.use(restrictTo('operator', 'admin'));

router.get('/stats', getStats);
router.get('/listings', getListings);
router.post('/listings', createListing);
router.patch('/listings/:id/pause', pauseListing);
router.patch('/listings/:id/resubmit', resubmitListing);
router.patch('/listings/:id', editListing);
router.delete('/listings/:id', deleteListing);
router.get('/bookings', getBookings);
router.patch('/bookings/:id/status', updateBookingStatus);
router.get('/payouts', getPayouts);
router.patch('/bank-account', updateBankAccount);
router.get('/reviews', getReviews);
router.patch('/reviews/:id/reply', respondToReview);
router.get('/inquiries', getInquiries);
router.get('/message-threads', getMessageThreads);

module.exports = router;
