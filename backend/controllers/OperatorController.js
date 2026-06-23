const Experience = require('../models/Experience');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const User = require('../models/User');
const Payout = require('../models/Payout');
const Notification = require('../models/Notification');

// Helper to get operator experience IDs
const getOperatorExperienceIds = async (operatorId) => {
  const experiences = await Experience.find({ host: operatorId });
  return experiences.map((exp) => exp._id);
};

// @route GET /api/operator/stats
// Dashboard Home: Bookings today, upcoming this week, revenue this month
const getStats = async (req, res) => {
  try {
    const operatorId = req.user._id;
    const expIds = await getOperatorExperienceIds(operatorId);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Start of today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // Start of week
    const startOfWeek = new Date(startOfToday.getTime() - startOfToday.getDay() * 24 * 60 * 60 * 1000);
    // Start of month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Bookings today
    const bookingsTodayCount = await Booking.countDocuments({
      experience: { $in: expIds },
      status: { $in: ['confirmed', 'completed'] },
      startDate: todayStr
    });

    // Upcoming bookings this week (starts in next 7 days)
    const sevenDaysLater = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);
    const bookingsThisWeek = await Booking.find({
      experience: { $in: expIds },
      status: 'confirmed'
    });
    const upcomingThisWeekCount = bookingsThisWeek.filter(b => {
      const bDate = new Date(b.startDate);
      return bDate >= startOfToday && bDate <= sevenDaysLater;
    }).length;

    // Revenue this month (paid bookings created or completed this month)
    const paidBookingsThisMonth = await Booking.find({
      experience: { $in: expIds },
      paymentStatus: 'paid',
      status: { $in: ['confirmed', 'completed'] },
      createdAt: { $gte: startOfMonth }
    });
    const revenueThisMonth = paidBookingsThisMonth.reduce((sum, b) => sum + b.totalPrice, 0);

    // Total listings and average rating
    const totalListings = expIds.length;
    const experiences = await Experience.find({ host: operatorId });
    const totalReviews = experiences.reduce((sum, e) => sum + e.reviewCount, 0);
    const avgRating = totalListings > 0
      ? experiences.reduce((sum, e) => sum + e.rating, 0) / totalListings
      : 0;

    res.json({
      success: true,
      stats: {
        bookingsToday: bookingsTodayCount,
        upcomingThisWeek: upcomingThisWeekCount,
        revenueThisMonth,
        totalListings,
        totalReviews,
        averageRating: Math.round(avgRating * 10) / 10
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/operator/listings
// My Listings: All experiences listed by this host
const getListings = async (req, res) => {
  try {
    const experiences = await Experience.find({ host: req.user._id, isActive: { $ne: false } }).sort({ createdAt: -1 });
    res.json({ success: true, count: experiences.length, experiences });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route POST /api/operator/listings
// Create Listing
const createListing = async (req, res) => {
  try {
    const experience = await Experience.create({
      ...req.body,
      host:         req.user._id,
      hostName:     req.user.name,
      hostVerified: req.user.kyc === 'approved',
      status:       'pending',
      submittedAt:  new Date(),
      approvedAt:      undefined,
      rejectionReason: '',
      auditLog: [{ action: 'submitted', actorId: req.user._id, actorRole: 'operator', timestamp: new Date() }],
    });

    // Notify all admin users
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await Notification.create({
        recipient: admin._id,
        type: 'listing',
        title: `Listing Approval Required – "${experience.title}"`,
        desc: `${req.user.name || 'An operator'} submitted a new listing for review. Please check the compliance requirements.`,
        referenceId: experience._id,
        badges: [
          { text: 'Review', color: 'bg-amber-50 text-amber-600 border border-amber-100' },
          { text: `#${experience._id.toString().slice(-6).toUpperCase()}`, color: 'text-gray-500 border border-gray-200' }
        ]
      });
    }

    res.status(201).json({ success: true, experience });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PATCH /api/operator/listings/:id
// Edit Listing
const editListing = async (req, res) => {
  try {
    const exp = await Experience.findOne({ _id: req.params.id, host: req.user._id });
    if (!exp) return res.status(404).json({ success: false, message: 'Listing not found or unauthorized' });

    // Strip status from body — status transitions are managed by dedicated endpoints and the logic below
    const { status: _ignored, ...updates } = req.body;
    let becamePending = false;

    if (['rejected', 'changes_requested', 'suspended'].includes(exp.status)) {
      updates.status = 'pending';
      updates.submittedAt = new Date();
      updates.rejectionReason = '';
      becamePending = true;
    } else if (exp.status === 'live') {
      const titleChanged = updates.title !== undefined && updates.title !== exp.title;
      const priceChanged = updates.price !== undefined && Number(updates.price) !== exp.price;
      const descChanged  = updates.description !== undefined && updates.description !== exp.description;
      if (titleChanged || priceChanged || descChanged) {
        updates.status = 'pending';
        updates.submittedAt = new Date();
        becamePending = true;
      }
    }

    const updateQuery = { $set: updates };
    if (becamePending) {
      updateQuery.$push = { auditLog: { action: 'resubmitted', actorId: req.user._id, actorRole: 'operator', timestamp: new Date() } };
    }

    const experience = await Experience.findByIdAndUpdate(
      req.params.id,
      updateQuery,
      { new: true, runValidators: true }
    );

    if (becamePending || experience.status === 'pending') {
      // Notify all admin users
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await Notification.create({
          recipient: admin._id,
          type: 'listing',
          title: `Listing Review Required – "${experience.title}"`,
          desc: `${req.user.name || 'An operator'} updated their listing. Re-verification is required.`,
          referenceId: experience._id,
          badges: [
            { text: 'Review', color: 'bg-amber-50 text-amber-600 border border-amber-100' },
            { text: `#${experience._id.toString().slice(-6).toUpperCase()}`, color: 'text-gray-500 border border-gray-200' }
          ]
        });
      }
    }

    res.json({ success: true, experience });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/operator/bookings
// Bookings Manager: bookings list
const getBookings = async (req, res) => {
  try {
    const { status, date } = req.query;
    const expIds = await getOperatorExperienceIds(req.user._id);

    const query = { experience: { $in: expIds } };
    if (status) query.status = status;
    if (date) query.startDate = date;

    const bookings = await Booking.find(query)
      .populate('experience', 'title images price location duration')
      .populate('user', 'name email phone avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PATCH /api/operator/bookings/:id/status
// Operator manually updates trip status — operators may NOT auto-complete via date logic
const updateBookingStatus = async (req, res) => {
  try {
    const { status, statusNote } = req.body;

    const ALLOWED_OPERATOR_TRANSITIONS = {
      pending:   ['confirmed', 'cancelled'],
      confirmed: ['ongoing', 'completed', 'postponed', 'cancelled'],
      ongoing:   ['completed', 'postponed', 'cancelled'],
      postponed: ['confirmed', 'ongoing', 'completed', 'cancelled'],
    };

    const booking = await Booking.findById(req.params.id)
      .populate('experience')
      .populate('user', 'name email');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (booking.experience.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this booking' });
    }

    const allowed = ALLOWED_OPERATOR_TRANSITIONS[booking.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from "${booking.status}" to "${status}". Allowed: ${allowed.join(', ') || 'none'}.`,
      });
    }

    // Push to history before changing
    booking.statusHistory.push({
      status: booking.status,
      note:      booking.statusNote || '',
      changedBy: req.user._id,
      changedAt: new Date(),
    });

    booking.status     = status;
    booking.statusNote = statusNote || '';

    if (status === 'cancelled') {
      booking.paymentStatus = 'refunded';
      booking.refundStatus  = 'approved';
    }
    await booking.save();

    // Notify the customer
    const titleMap = {
      confirmed: 'Booking Confirmed',
      ongoing:   'Your Trip Has Started',
      completed: 'Trip Completed',
      cancelled: 'Booking Cancelled',
      postponed: 'Trip Postponed',
    };
    const descMap = {
      confirmed: `Your booking for "${booking.experience.title}" on ${booking.startDate} has been confirmed by the operator.`,
      ongoing:   `Your adventure "${booking.experience.title}" is now underway. Enjoy!`,
      completed: `Your trip "${booking.experience.title}" has been marked as completed. We hope you had a great time!`,
      cancelled: `Your booking for "${booking.experience.title}" has been cancelled by the operator.${statusNote ? ` Reason: ${statusNote}` : ''}`,
      postponed: `Your trip "${booking.experience.title}" has been postponed.${statusNote ? ` Note: ${statusNote}` : ''}`,
    };
    if (booking.user?._id) {
      await Notification.create({
        recipient: booking.user._id,
        type:      'booking',
        title:     titleMap[status] || 'Trip Status Updated',
        desc:      descMap[status]  || `Your trip status is now: ${status}.`,
        referenceId: booking._id,
        badges: [
          { text: status.charAt(0).toUpperCase() + status.slice(1), color: status === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : status === 'cancelled' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-amber-50 text-amber-600 border border-amber-100' },
        ],
      });
    }

    // Notify admins when a trip is marked completed (payout eligibility)
    if (status === 'completed') {
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await Notification.create({
          recipient: admin._id,
          type:      'payout',
          title:     `Trip Completed — Payout Eligible`,
          desc:      `"${booking.experience.title}" (booking #${booking._id.toString().slice(-6).toUpperCase()}) has been marked completed by operator ${req.user.name}. It is now eligible for payout release.`,
          referenceId: booking._id,
          badges: [
            { text: 'Completed', color: 'bg-emerald-50 text-emerald-600 border border-emerald-100' },
            { text: 'Payout Due', color: 'bg-blue-50 text-blue-600 border border-blue-100' },
          ],
        });
      }
    }

    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/operator/payouts
// Payouts dashboard (earnings summary, settlement history, bank account details)
const getPayouts = async (req, res) => {
  try {
    const operatorId = req.user._id;
    const expIds = await getOperatorExperienceIds(operatorId);

    // Bookings that are paid and either confirmed or completed
    const bookings = await Booking.find({
      experience: { $in: expIds },
      paymentStatus: 'paid',
      status: { $in: ['confirmed', 'completed'] }
    });

    const totalEarnings = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const pendingPayouts = bookings.filter(b => !b.settled).reduce((sum, b) => sum + b.totalPrice, 0);
    const completedPayouts = bookings.filter(b => b.settled).reduce((sum, b) => sum + b.totalPrice, 0);

    // Fetch payout releases log
    const settlementHistory = await Payout.find({ operator: operatorId })
      .populate('booking', 'startDate totalPrice')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      earnings: {
        totalEarnings,
        pendingPayouts,
        completedPayouts,
      },
      settlementHistory,
      bankAccount: req.user.bankAccount || {}
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PATCH /api/operator/bank-account
// Edit Payout Settings
const updateBankAccount = async (req, res) => {
  try {
    const { holderName, accountNumber, bankName, ifscCode } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        bankAccount: { holderName, accountNumber, bankName, ifscCode }
      },
      { new: true, runValidators: true }
    );

    res.json({ success: true, bankAccount: user.bankAccount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/operator/reviews
// Reviews & Ratings received
const getReviews = async (req, res) => {
  try {
    const expIds = await getOperatorExperienceIds(req.user._id);

    const reviews = await Review.find({ experience: { $in: expIds } })
      .populate('experience', 'title images')
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: reviews.length, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PATCH /api/operator/reviews/:id/reply
// Respond to a review
const respondToReview = async (req, res) => {
  try {
    const { hostReply } = req.body;
    if (!hostReply) return res.status(400).json({ success: false, message: 'Reply text is required' });

    const review = await Review.findById(req.params.id).populate('experience');
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    if (review.experience.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized response to this review' });
    }

    review.hostReply = hostReply;
    await review.save();

    res.json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PATCH /api/operator/listings/:id/resubmit
// Resubmit a rejected/changes_requested listing for review
const resubmitListing = async (req, res) => {
  try {
    const exp = await Experience.findOne({ _id: req.params.id, host: req.user._id });
    if (!exp) return res.status(404).json({ success: false, message: 'Listing not found or unauthorized' });

    if (!['rejected', 'changes_requested', 'suspended'].includes(exp.status)) {
      return res.status(400).json({ success: false, message: 'Only rejected or suspended listings can be resubmitted' });
    }

    const wasSuspended = exp.status === 'suspended';
    await Experience.findByIdAndUpdate(req.params.id, {
      $set:  { status: 'pending', submittedAt: new Date(), rejectionReason: '' },
      $push: { auditLog: { action: 'resubmitted', actorId: req.user._id, actorRole: 'operator', timestamp: new Date() } },
    });
    exp.status = 'pending';

    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await Notification.create({
        recipient: admin._id,
        type: 'listing',
        title: wasSuspended
          ? `Reactivation Requested – "${exp.title}"`
          : `Listing Resubmitted – "${exp.title}"`,
        desc: wasSuspended
          ? `${req.user.name || 'An operator'} has edited their suspended listing and is requesting reactivation. Please review before approving.`
          : `${req.user.name || 'An operator'} resubmitted a listing for review after addressing feedback.`,
        referenceId: exp._id,
        badges: [
          { text: wasSuspended ? 'Reactivation Request' : 'Resubmitted', color: wasSuspended ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-blue-50 text-blue-600 border border-blue-100' },
          { text: `#${exp._id.toString().slice(-6).toUpperCase()}`, color: 'text-gray-500 border border-gray-200' }
        ]
      });
    }

    res.json({ success: true, message: 'Listing resubmitted for review', experience: exp });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PATCH /api/operator/listings/:id/pause
// Toggle a live listing to paused or a paused listing back to live
const pauseListing = async (req, res) => {
  try {
    const exp = await Experience.findOne({ _id: req.params.id, host: req.user._id });
    if (!exp) return res.status(404).json({ success: false, message: 'Listing not found or unauthorized' });
    if (!['live', 'paused'].includes(exp.status)) {
      return res.status(400).json({ success: false, message: 'Only live or paused listings can be paused or resumed.' });
    }
    const next = exp.status === 'live' ? 'paused' : 'live';
    await Experience.findByIdAndUpdate(req.params.id, {
      $set:  { status: next },
      $push: { auditLog: { action: next === 'paused' ? 'paused' : 'resumed', actorId: req.user._id, actorRole: 'operator', timestamp: new Date() } },
    });
    res.json({ success: true, status: next, message: next === 'paused' ? 'Listing paused — hidden from customers.' : 'Listing is now live.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route DELETE /api/operator/listings/:id
// Soft-delete a listing. Live listings must be paused first. Suspended listings can be deleted.
const deleteListing = async (req, res) => {
  try {
    const exp = await Experience.findOne({ _id: req.params.id, host: req.user._id });
    if (!exp) return res.status(404).json({ success: false, message: 'Listing not found or unauthorized' });

    if (exp.status === 'live') {
      return res.status(400).json({ success: false, message: 'Cannot delete a live listing. Pause it first.' });
    }

    await Experience.findByIdAndUpdate(req.params.id, {
      $set:  { status: 'deleted', isActive: false },
      $push: { auditLog: { action: 'deleted', actorId: req.user._id, actorRole: 'operator', timestamp: new Date() } },
    });
    res.json({ success: true, message: 'Listing deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
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
  respondToReview
};
