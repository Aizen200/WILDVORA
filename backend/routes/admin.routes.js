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
  suspendListing,
  reactivateListing,
  getHostListings,
  getAllBookings,
  toggleDispute,
  issueRefund,
  getHosts,
  updateHostKYC,
  updateHostPayoutStatus,
  getCustomers,
  toggleUserStatus,
  deleteHost,
  getPendingSettlements,
  releasePayout,
  getPayoutLogs,
  getCustomerBookings,
  sendEmailToAllHosts,
  getGrowthMapData,
  overrideTripStatus,
  getStaleTrips,
  getDestinations,
  createDestination,
  updateDestination
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
router.patch('/listings/:id/suspend', suspendListing);
router.patch('/listings/:id/reactivate', reactivateListing);
router.patch('/listings/:id/feature', toggleFeatured);
router.get('/bookings', getAllBookings);
router.get('/bookings/stale', getStaleTrips);
router.patch('/bookings/:id/status', overrideTripStatus);
router.patch('/bookings/:id/dispute', toggleDispute);
router.post('/bookings/:id/refund', issueRefund);
router.get('/hosts', getHosts);
router.get('/hosts/:id/listings', getHostListings);
router.post('/hosts/email', sendEmailToAllHosts);
router.patch('/hosts/:id/kyc', updateHostKYC);
router.patch('/hosts/:id/payout-status', updateHostPayoutStatus);
router.get('/customers', getCustomers);
router.patch('/users/:id/toggle-status', toggleUserStatus);
router.delete('/hosts/:id', deleteHost);
router.get('/payouts/pending', getPendingSettlements);
router.post('/payouts/release', releasePayout);
router.get('/payouts/logs', getPayoutLogs);
router.get('/customers/:id/bookings', getCustomerBookings);

// Destinations management
router.get('/destinations', getDestinations);
router.post('/destinations', createDestination);
router.patch('/destinations/:id', updateDestination);

module.exports = router;

