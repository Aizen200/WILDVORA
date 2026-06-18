const User = require('../models/User');
const Experience = require('../models/Experience');
const Booking = require('../models/Booking');
const Payout = require('../models/Payout');

// @route GET /api/admin/analytics/overview
// Platform Overview: GMV, bookings, active hosts, active customers, week-over-week growth
const getPlatformOverview = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();

    // GMV: only trips explicitly marked completed count toward revenue
    const paidBookings = await Booking.find({ paymentStatus: 'paid', status: 'completed' });
    const gmv = paidBookings.reduce((sum, b) => sum + b.totalPrice, 0);

    const activeHosts = await User.countDocuments({ role: 'operator', isActive: true });
    const activeCustomers = await User.countDocuments({ role: 'customer', isActive: true });

    // Additional Platform Stats
    const totalOperators = await User.countDocuments({ role: 'operator' });
    const verifiedOperators = await User.countDocuments({ role: 'operator', kyc: 'approved' });
    const pendingListings = await Experience.countDocuments({ status: 'pending' });
    const liveListings = await Experience.countDocuments({ status: 'live' });
    const totalReports = await Booking.countDocuments({ disputed: true });
    
    const processedPayoutsList = await Payout.find({ status: 'processed' });
    const totalPayoutsAmount = processedPayoutsList.reduce((sum, p) => sum + p.amount, 0);
    const totalPayoutsCount = processedPayoutsList.length;

    // Weekly comparisons (last 7 days vs 7-14 days ago)
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(startOfToday.getTime() - 14 * 24 * 60 * 60 * 1000);

    const bookingsThisWeek = await Booking.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    const bookingsLastWeek = await Booking.countDocuments({
      createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo }
    });

    const paidThisWeek = await Booking.find({ paymentStatus: 'paid', status: 'completed', createdAt: { $gte: sevenDaysAgo } });
    const paidLastWeek = await Booking.find({
      paymentStatus: 'paid', status: 'completed',
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
        totalOperators,
        verifiedOperators,
        pendingListings,
        liveListings,
        totalReports,
        totalPayoutsAmount,
        totalPayoutsCount,
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

// @route DELETE /api/admin/hosts/:id
// Permanently delete a suspended operator account and deactivate all their listings
const deleteHost = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Host not found' });
    if (user.isActive) {
      return res.status(400).json({ success: false, message: 'Only suspended host accounts can be deleted. Suspend the account first.' });
    }

    // Deactivate all their listings so they disappear from the platform
    await Experience.updateMany(
      { host: user._id },
      { $set: { isActive: false, status: 'draft' } }
    );

    await User.findByIdAndDelete(user._id);

    res.json({ success: true, message: `Host account "${user.name}" has been permanently deleted and all listings deactivated.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/admin/payouts/pending
// Payouts Control: Pending settlements
const getPendingSettlements = async (req, res) => {
  try {
    // Bookings that are paid, completed, and not disputed, and not yet settled
    const pendingBookings = await Booking.find({
      paymentStatus: 'paid',
      status: 'completed',
      disputed: { $ne: true },
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
    if (booking.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Cannot release payout: Booking must be completed.' });
    }
    if (booking.disputed) {
      return res.status(400).json({ success: false, message: 'Cannot release payout: Booking has an active dispute.' });
    }
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

// @route GET /api/admin/hosts/:id/listings
// All listings belonging to a specific operator
const getHostListings = async (req, res) => {
  try {
    const listings = await Experience.find({ host: req.params.id })
      .sort({ createdAt: -1 })
      .select('title status category price location coverImage images suspensionReason rejectionReason createdAt');
    res.json({ success: true, count: listings.length, listings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PATCH /api/admin/listings/:id/suspend
// Suspend a live listing — requires a reason
const suspendListing = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'A suspension reason is required' });
    }

    const experience = await Experience.findById(req.params.id).populate('host', 'name _id');
    if (!experience) return res.status(404).json({ success: false, message: 'Listing not found' });
    if (experience.status === 'suspended') {
      return res.status(400).json({ success: false, message: 'Listing is already suspended' });
    }

    experience.status = 'suspended';
    experience.suspensionReason = reason.trim();
    experience.suspendedAt = new Date();
    await experience.save();

    // Notify the operator
    if (experience.host?._id) {
      const Notification = require('../models/Notification');
      await Notification.create({
        recipient: experience.host._id,
        type: 'listing',
        title: `Listing Suspended – "${experience.title}"`,
        desc: `Your listing "${experience.title}" has been suspended by an admin. Reason: ${reason.trim()}. Please review, make necessary changes, and request reactivation.`,
        referenceId: experience._id,
        badges: [
          { text: 'Suspended', color: 'bg-red-50 text-red-600 border border-red-200' },
          { text: `#${experience._id.toString().slice(-6).toUpperCase()}`, color: 'text-gray-500 border border-gray-200' }
        ]
      });
    }

    res.json({ success: true, message: 'Listing suspended successfully', experience });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PATCH /api/admin/listings/:id/reactivate
// Reactivate a suspended listing back to live
const reactivateListing = async (req, res) => {
  try {
    const experience = await Experience.findById(req.params.id).populate('host', 'name _id');
    if (!experience) return res.status(404).json({ success: false, message: 'Listing not found' });
    if (experience.status !== 'suspended') {
      return res.status(400).json({ success: false, message: 'Listing is not suspended' });
    }

    experience.status = 'live';
    experience.suspensionReason = '';
    experience.suspendedAt = undefined;
    await experience.save();

    // Notify the operator
    if (experience.host?._id) {
      const Notification = require('../models/Notification');
      await Notification.create({
        recipient: experience.host._id,
        type: 'listing',
        title: `Listing Reactivated – "${experience.title}"`,
        desc: `Your listing "${experience.title}" has been reactivated by an admin and is now live for customers.`,
        referenceId: experience._id,
        badges: [
          { text: 'Reactivated', color: 'bg-green-50 text-green-700 border border-green-200' },
          { text: `#${experience._id.toString().slice(-6).toUpperCase()}`, color: 'text-gray-500 border border-gray-200' }
        ]
      });
    }

    res.json({ success: true, message: 'Listing reactivated and is now live', experience });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/admin/listings/live
const getLiveListings = async (req, res) => {
  try {
    const listings = await Experience.find({ status: 'live' })
      .populate('host', 'name email kyc')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: listings.length, listings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PATCH /api/admin/listings/:id/feature
const toggleFeatured = async (req, res) => {
  try {
    const experience = await Experience.findById(req.params.id);
    if (!experience) return res.status(404).json({ success: false, message: 'Listing not found' });
    experience.isFeatured = !experience.isFeatured;
    await experience.save();
    res.json({ success: true, isFeatured: experience.isFeatured, experience });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route POST /api/admin/hosts/email
// Send email / broadcast notification to all hosts
const sendEmailToAllHosts = async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ success: false, message: 'Subject and message are required' });
    }

    const hosts = await User.find({ role: 'operator' });
    const hostEmails = hosts.map(h => h.email).filter(Boolean);

    // Simulate sending email to console
    console.log(`[Email Broadcast] Subject: ${subject}`);
    console.log(`[Email Broadcast] Message: ${message}`);
    console.log(`[Email Broadcast] Recipients: ${hostEmails.join(', ')}`);

    // Create a platform notification for each host
    const Notification = require('../models/Notification');
    for (const host of hosts) {
      await Notification.create({
        recipient: host._id,
        type: 'system',
        title: subject,
        desc: message,
        badges: [
          { text: 'Broadcast', color: 'bg-indigo-50 text-indigo-600 border border-indigo-100' }
        ]
      });
    }

    res.json({
      success: true,
      message: `Broadcast message sent successfully to all ${hosts.length} hosts.`,
      recipientCount: hosts.length
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/admin/analytics/growth-map
const getGrowthMapData = async (req, res) => {
  try {
    const experiences = await Experience.find({ status: 'live' }).populate('host', 'name');
    
    const stateCounts = {};
    for (const exp of experiences) {
      let state = exp.location?.state || 'Other';
      state = state.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      
      if (!stateCounts[state]) {
        stateCounts[state] = {
          state,
          tripsCount: 0,
          categories: new Set(),
          operators: new Set(),
          minPrice: Infinity,
          maxPrice: -Infinity
        };
      }
      stateCounts[state].tripsCount += 1;
      if (exp.category) stateCounts[state].categories.add(exp.category);
      if (exp.host && exp.host._id) {
        stateCounts[state].operators.add(exp.host._id.toString());
      }
      if (exp.price) {
        if (exp.price < stateCounts[state].minPrice) stateCounts[state].minPrice = exp.price;
        if (exp.price > stateCounts[state].maxPrice) stateCounts[state].maxPrice = exp.price;
      }
    }

    const regions = Object.values(stateCounts).map(r => ({
      state: r.state,
      tripsCount: r.tripsCount,
      operatorCount: r.operators.size || 1,
      categoryCount: r.categories.size || 1,
      avgPriceRange: r.minPrice === Infinity ? '₹1,500 - ₹5,000' : `₹${r.minPrice.toLocaleString('en-IN')} - ₹${r.maxPrice.toLocaleString('en-IN')}`
    }));

    res.json({
      success: true,
      regions: regions.length > 0 ? regions : [
        { state: 'Himachal Pradesh', tripsCount: 12, operatorCount: 4, categoryCount: 3, avgPriceRange: '₹3,500 - ₹12,000' },
        { state: 'Uttarakhand', tripsCount: 8, operatorCount: 3, categoryCount: 2, avgPriceRange: '₹2,500 - ₹8,000' },
        { state: 'Goa', tripsCount: 6, operatorCount: 2, categoryCount: 2, avgPriceRange: '₹4,000 - ₹9,000' },
        { state: 'Karnataka', tripsCount: 5, operatorCount: 2, categoryCount: 1, avgPriceRange: '₹1,500 - ₹4,500' },
        { state: 'Kerala', tripsCount: 4, operatorCount: 1, categoryCount: 2, avgPriceRange: '₹3,000 - ₹7,500' }
      ]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PATCH /api/admin/bookings/:id/status
// Admin override — can force any booking to any valid status
const overrideTripStatus = async (req, res) => {
  try {
    const { status, statusNote } = req.body;
    const VALID = ['pending', 'confirmed', 'ongoing', 'completed', 'cancelled', 'postponed'];
    if (!VALID.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${VALID.join(', ')}` });
    }

    const booking = await Booking.findById(req.params.id)
      .populate('experience', 'title host')
      .populate('user', 'name');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Record previous state in history
    booking.statusHistory.push({
      status:    booking.status,
      note:      booking.statusNote || '',
      changedBy: req.user._id,
      changedAt: new Date(),
    });

    const prevStatus    = booking.status;
    booking.status      = status;
    booking.statusNote  = statusNote || '';

    if (status === 'cancelled') {
      booking.paymentStatus = 'refunded';
      booking.refundStatus  = 'approved';
    }
    await booking.save();

    // Notify the customer of the admin override
    if (booking.user?._id) {
      const Notification = require('../models/Notification');
      await Notification.create({
        recipient:   booking.user._id,
        type:        'booking',
        title:       'Trip Status Updated by Admin',
        desc:        `Your booking for "${booking.experience?.title}" has been updated from "${prevStatus}" to "${status}" by the platform admin.${statusNote ? ` Note: ${statusNote}` : ''}`,
        referenceId: booking._id,
        badges: [
          { text: 'Admin Override', color: 'bg-purple-50 text-purple-600 border border-purple-100' },
          { text: status.charAt(0).toUpperCase() + status.slice(1), color: 'bg-gray-50 text-gray-600 border border-gray-200' },
        ],
      });
    }

    res.json({ success: true, message: `Booking status overridden to "${status}"`, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/admin/bookings/stale
// Trips still in a non-terminal state 7+ days after their end date
// Used to alert admins to chase operators for status updates
const getStaleTrips = async (req, res) => {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    const cutoffStr = cutoff.toISOString().split('T')[0]; // YYYY-MM-DD

    // Find bookings where endDate is before 7 days ago AND status is still non-terminal
    const stale = await Booking.find({
      endDate: { $lte: cutoffStr },
      status:  { $in: ['confirmed', 'ongoing', 'postponed', 'pending'] },
    })
      .populate('experience', 'title host hostName')
      .populate('user', 'name email')
      .sort({ endDate: 1 });

    // Auto-create admin notification for each stale trip (deduplicated by not creating if one exists)
    const Notification = require('../models/Notification');
    const admins = await User.find({ role: 'admin' });
    for (const booking of stale) {
      const alreadyNotified = await Notification.findOne({
        referenceId: booking._id,
        title:       { $regex: 'Stale Trip Alert' },
      });
      if (!alreadyNotified) {
        for (const admin of admins) {
          await Notification.create({
            recipient:   admin._id,
            type:        'booking',
            title:       'Stale Trip Alert',
            desc:        `Booking #${booking._id.toString().slice(-6).toUpperCase()} for "${booking.experience?.title}" ended on ${booking.endDate} and is still marked as "${booking.status}". Please follow up with the operator.`,
            referenceId: booking._id,
            badges: [
              { text: 'Stale', color: 'bg-amber-50 text-amber-600 border border-amber-100' },
              { text: booking.status.charAt(0).toUpperCase() + booking.status.slice(1), color: 'bg-gray-50 text-gray-600 border border-gray-200' },
            ],
          });
        }
      }
    }

    res.json({ success: true, count: stale.length, bookings: stale });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
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
  getStaleTrips
};
