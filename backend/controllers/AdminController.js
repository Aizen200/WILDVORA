const User = require('../models/User');
const Experience = require('../models/Experience');
const Booking = require('../models/Booking');
const Payout = require('../models/Payout');

// @route GET /api/admin/analytics/overview
// Platform Overview: GMV, bookings, active hosts, active customers, week-over-week growth
const getPlatformOverview = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();

    // GMV: sum of totalPrice of all paid / completed bookings
    const paidBookings = await Booking.find({ paymentStatus: 'paid' });
    const gmv = paidBookings.reduce((sum, b) => sum + b.totalPrice, 0);

    const activeHosts = await User.countDocuments({ role: 'operator', isActive: true });
    const activeCustomers = await User.countDocuments({ role: 'customer', isActive: true });

    // Weekly comparisons (last 7 days vs 7-14 days ago)
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(startOfToday.getTime() - 14 * 24 * 60 * 60 * 1000);

    const bookingsThisWeek = await Booking.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    const bookingsLastWeek = await Booking.countDocuments({
      createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo }
    });

    const paidThisWeek = await Booking.find({ paymentStatus: 'paid', createdAt: { $gte: sevenDaysAgo } });
    const paidLastWeek = await Booking.find({
      paymentStatus: 'paid',
      createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo }
    });

    const gmvThisWeek = paidThisWeek.reduce((sum, b) => sum + b.totalPrice, 0);
    const gmvLastWeek = paidLastWeek.reduce((sum, b) => sum + b.totalPrice, 0);

    const bookingGrowth = bookingsLastWeek > 0 ? ((bookingsThisWeek - bookingsLastWeek) / bookingsLastWeek) * 100 : 0;
    const gmvGrowth = gmvLastWeek > 0 ? ((gmvThisWeek - gmvLastWeek) / gmvLastWeek) * 100 : 0;

    res.json({
      success: true,
      analytics: {
        totalBookings,
        gmv,
        activeHosts,
        activeCustomers,
        bookingsThisWeek,
        bookingsLastWeek,
        bookingGrowth: Math.round(bookingGrowth * 10) / 10,
        gmvThisWeek,
        gmvLastWeek,
        gmvGrowth: Math.round(gmvGrowth * 10) / 10
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/admin/listings/pending
// Listings Approval Queue
const getPendingListings = async (req, res) => {
  try {
    const listings = await Experience.find({ status: 'pending' })
      .populate('host', 'name email kyc')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: listings.length, listings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PATCH /api/admin/listings/:id/approve
// Approve Experience
const approveListing = async (req, res) => {
  try {
    const experience = await Experience.findById(req.params.id);
    if (!experience) return res.status(404).json({ success: false, message: 'Listing not found' });

    experience.status = 'live';
    experience.approvedAt = new Date();
    experience.rejectionReason = '';
    await experience.save();

    res.json({ success: true, message: 'Experience listing approved and is now live', experience });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PATCH /api/admin/listings/:id/reject
// Reject Experience / Request Changes
const rejectListing = async (req, res) => {
  try {
    const { status = 'rejected', reason } = req.body;
    if (!['rejected', 'changes_requested'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid reject status' });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'A rejection reason is required' });
    }

    const experience = await Experience.findById(req.params.id);
    if (!experience) return res.status(404).json({ success: false, message: 'Listing not found' });

    experience.status = status;
    experience.rejectionReason = reason.trim();
    await experience.save();

    res.json({ success: true, message: `Listing status updated to ${status}`, experience });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/admin/bookings
// Bookings & Disputes table
const getAllBookings = async (req, res) => {
  try {
    const { status, disputed } = req.query;
    const query = {};
    if (status) query.status = status;
    if (disputed === 'true') query.disputed = true;

    const bookings = await Booking.find(query)
      .populate('experience', 'title price hostName host')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PATCH /api/admin/bookings/:id/dispute
// Flag dispute / Resolve dispute
const toggleDispute = async (req, res) => {
  try {
    const { disputed, disputeReason } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    booking.disputed = disputed !== undefined ? disputed : !booking.disputed;
    if (disputeReason) booking.disputeReason = disputeReason;
    await booking.save();

    res.json({ success: true, message: 'Booking dispute status updated', booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route POST /api/admin/bookings/:id/refund
// Issue refund
const issueRefund = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (booking.paymentStatus !== 'paid') {
      return res.status(400).json({ success: false, message: 'Booking has not been paid yet' });
    }

    booking.paymentStatus = 'refunded';
    booking.refundStatus = 'approved';
    booking.status = 'cancelled';
    await booking.save();

    res.json({ success: true, message: 'Refund issued and booking cancelled successfully', booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/admin/hosts
// Host Management: list hosts
const getHosts = async (req, res) => {
  try {
    const hosts = await User.find({ role: 'operator' }).sort({ createdAt: -1 });
    res.json({ success: true, count: hosts.length, hosts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PATCH /api/admin/hosts/:id/kyc
// Update host KYC status
const updateHostKYC = async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid KYC status' });
    }

    const host = await User.findById(req.params.id);
    if (!host || host.role !== 'operator') {
      return res.status(404).json({ success: false, message: 'Host not found' });
    }

    host.kyc = status;
    await host.save();

    // Sync to host's listings
    await Experience.updateMany({ host: host._id }, { hostVerified: status === 'approved' });

    res.json({ success: true, message: `KYC status updated to ${status}`, host });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PATCH /api/admin/hosts/:id/payout-status
// Update host payout account status
const updateHostPayoutStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'verified' or 'pending'
    if (!['verified', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const host = await User.findById(req.params.id);
    if (!host || host.role !== 'operator') {
      return res.status(404).json({ success: false, message: 'Host not found' });
    }

    host.payoutStatus = status;
    await host.save();

    res.json({ success: true, message: `Payout status updated to ${status}`, host });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/admin/customers
// Customer Management: list customers
const getCustomers = async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' }).sort({ createdAt: -1 });
    res.json({ success: true, count: customers.length, customers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PATCH /api/admin/users/:id/toggle-status
// Suspend/Activate user (customer or host)
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isActive = !user.isActive;
    await user.save();

    res.json({ success: true, message: `User status changed to ${user.isActive ? 'Active' : 'Suspended'}`, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/admin/payouts/pending
// Payouts Control: Pending settlements
const getPendingSettlements = async (req, res) => {
  try {
    // Bookings that are paid, completed or confirmed, and not yet settled
    const pendingBookings = await Booking.find({
      paymentStatus: 'paid',
      status: { $in: ['confirmed', 'completed'] },
      settled: false
    })
      .populate({
        path: 'experience',
        select: 'title host hostName',
        populate: {
          path: 'host',
          select: 'name email bankAccount payoutStatus kyc'
        }
      })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: pendingBookings.length, settlements: pendingBookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route POST /api/admin/payouts/release
// Payouts Control: Release payout
const releasePayout = async (req, res) => {
  try {
    const { bookingId, overrideAmount } = req.body;
    if (!bookingId) return res.status(400).json({ success: false, message: 'Booking ID is required' });

    const booking = await Booking.findById(bookingId).populate({
      path: 'experience',
      populate: { path: 'host' }
    });

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.settled) return res.status(400).json({ success: false, message: 'Payout already settled' });
    if (booking.paymentStatus !== 'paid') {
      return res.status(400).json({ success: false, message: 'Booking is not paid' });
    }

    const host = booking.experience.host;
    if (!host) return res.status(400).json({ success: false, message: 'No host associated with this experience' });
    if (host.payoutStatus !== 'verified') {
      return res.status(400).json({
        success: false,
        message: 'Cannot release payout. Host bank account payout status is not verified.'
      });
    }

    const payoutAmount = (overrideAmount !== undefined && overrideAmount !== null) ? Number(overrideAmount) : booking.totalPrice;

    // Set settled to true on booking
    booking.settled = true;
    await booking.save();

    // Create payout entry
    const payout = await Payout.create({
      operator: host._id,
      booking: booking._id,
      amount: payoutAmount,
      status: 'processed',
      transactionId: 'TXN-' + Math.random().toString(36).substring(2, 10).toUpperCase() + Date.now().toString().slice(-4),
      releasedAt: new Date()
    });

    res.json({ success: true, message: 'Payout released successfully', payout, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/admin/payouts/logs
// Payouts Control: Payout log
const getPayoutLogs = async (req, res) => {
  try {
    const logs = await Payout.find()
      .populate('operator', 'name email bankAccount')
      .populate({
        path: 'booking',
        select: 'startDate totalPrice',
        populate: { path: 'experience', select: 'title' }
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, count: logs.length, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/admin/customers/:id/bookings
// Customer Management: list booking history
const getCustomerBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.params.id })
      .populate('experience', 'title price hostName')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
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
};
