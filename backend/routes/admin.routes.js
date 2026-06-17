const express = require('express');
const router = express.Router();
const { protect } = require('../services/Auth');
const { restrictTo } = require('../middlewares/rbac');
const {
  getPlatformOverview,
  getPendingListings,
  getLiveListings,
  toggleFeatured,
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
  getCustomerBookings,
  sendEmailToAllHosts,
  getGrowthMapData
} = require('../controllers/AdminController');

// All admin routes require authentication and the admin role
router.use(protect);
router.use(restrictTo('admin'));

router.get('/analytics/overview', getPlatformOverview);
router.get('/analytics/growth-map', getGrowthMapData);
router.get('/listings/pending', getPendingListings);
router.get('/listings/live', getLiveListings);
router.patch('/listings/:id/approve', approveListing);
router.patch('/listings/:id/reject', rejectListing);
router.patch('/listings/:id/feature', toggleFeatured);
router.get('/bookings', getAllBookings);
router.patch('/bookings/:id/dispute', toggleDispute);
router.post('/bookings/:id/refund', issueRefund);
router.get('/hosts', getHosts);
router.post('/hosts/email', sendEmailToAllHosts);
router.patch('/hosts/:id/kyc', updateHostKYC);
router.patch('/hosts/:id/payout-status', updateHostPayoutStatus);
router.get('/customers', getCustomers);
router.patch('/users/:id/toggle-status', toggleUserStatus);
router.get('/payouts/pending', getPendingSettlements);
router.post('/payouts/release', releasePayout);
router.get('/payouts/logs', getPayoutLogs);
router.get('/customers/:id/bookings', getCustomerBookings);

module.exports = router;
