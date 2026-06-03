const express = require('express');
const router = express.Router();
const { protect } = require('../services/Auth');
const { restrictTo } = require('../middlewares/rbac');
const {
  getPlatformOverview,
  getPendingListings,
  approveListing,
  rejectListing,
  getAllBookings,
  toggleDispute,
  issueRefund,
  getHosts,
  updateHostKYC,
  updateHostPayoutStatus,
  getCustomers,
  toggleUserStatus,
  getPendingSettlements,
  releasePayout,
  getPayoutLogs,
  getCustomerBookings
} = require('../controllers/AdminController');

// All admin routes require authentication and the admin role
router.use(protect);
router.use(restrictTo('admin'));

router.get('/analytics/overview', getPlatformOverview);
router.get('/listings/pending', getPendingListings);
router.patch('/listings/:id/approve', approveListing);
router.patch('/listings/:id/reject', rejectListing);
router.get('/bookings', getAllBookings);
router.patch('/bookings/:id/dispute', toggleDispute);
router.post('/bookings/:id/refund', issueRefund);
router.get('/hosts', getHosts);
router.patch('/hosts/:id/kyc', updateHostKYC);
router.patch('/hosts/:id/payout-status', updateHostPayoutStatus);
router.get('/customers', getCustomers);
router.patch('/users/:id/toggle-status', toggleUserStatus);
router.get('/payouts/pending', getPendingSettlements);
router.post('/payouts/release', releasePayout);
router.get('/payouts/logs', getPayoutLogs);
router.get('/customers/:id/bookings', getCustomerBookings);

module.exports = router;
