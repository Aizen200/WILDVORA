const Experience = require('../models/Experience');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const User = require('../models/User');
const Guide = require('../models/Guide');
const Payout = require('../models/Payout');
const Notification = require('../models/Notification');
const Inquiry = require('../models/Inquiry');
const Message = require('../models/Message');
const LocalService = require('../models/LocalService');

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
    const experiences = await Experience.find({ host: operatorId });
    const expIds = experiences.map((exp) => exp._id);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Start of today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // Start of month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Bookings today
    const bookingsTodayCount = await Booking.countDocuments({
      experience: { $in: expIds },
      status: { $in: ['confirmed', 'completed', 'ongoing'] },
      startDate: todayStr
    });

    // All active/past bookings for stats
    const allBookings = await Booking.find({
      experience: { $in: expIds },
      status: { $in: ['confirmed', 'completed', 'ongoing', 'pending'] }
    }).populate('experience').populate('user', 'name email');

    // Upcoming Bookings (confirmed or pending, starting in future)
    const upcomingBookings = allBookings
      .filter(b => ['confirmed', 'pending'].includes(b.status) && b.startDate >= todayStr)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .slice(0, 5);

    // Revenue calculations
    const paidBookings = allBookings.filter(b => b.paymentStatus === 'paid' && b.status !== 'cancelled');
    const totalRevenue = paidBookings.reduce((sum, b) => sum + b.totalPrice, 0);

    const paidBookingsThisMonth = paidBookings.filter(b => new Date(b.createdAt) >= startOfMonth);
    const revenueThisMonth = paidBookingsThisMonth.reduce((sum, b) => sum + b.totalPrice, 0);

    // 6-month revenue chart breakdown
    const revenueChart = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleString('en-US', { month: 'short' });
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      const monthRevenue = paidBookings
        .filter(b => {
          const bDate = new Date(b.createdAt);
          return bDate >= monthStart && bDate <= monthEnd;
        })
        .reduce((sum, b) => sum + b.totalPrice, 0);

      revenueChart.push({ month: monthLabel, revenue: monthRevenue });
    }

    // Occupancy/utilization rate
    let totalCapacity = 0;
    experiences.forEach(e => {
      const datesCount = Array.isArray(e.availableDates) ? e.availableDates.length : 1;
      totalCapacity += (e.maxGroupSize || 12) * (datesCount || 1);
    });
    const totalBookedGuests = allBookings
      .filter(b => ['confirmed', 'completed', 'ongoing'].includes(b.status))
      .reduce((sum, b) => sum + (b.adults || 1) + (b.children || 0), 0);
    const occupancyRate = totalCapacity > 0 ? Math.round((totalBookedGuests / totalCapacity) * 100) : 0;

    // Popular experiences (by booking count or guest count)
    const expBookingStats = {};
    experiences.forEach(e => {
      expBookingStats[e._id.toString()] = {
        _id: e._id,
        title: e.title,
        coverImage: e.coverImage || (e.images && e.images[0]) || '',
        category: e.category,
        price: e.price,
        rating: e.rating,
        bookingCount: 0,
        guestCount: 0
      };
    });

    allBookings.forEach(b => {
      if (b.experience && expBookingStats[b.experience._id.toString()]) {
        expBookingStats[b.experience._id.toString()].bookingCount += 1;
        expBookingStats[b.experience._id.toString()].guestCount += (b.adults || 1) + (b.children || 0);
      }
    });

    const popularExperiences = Object.values(expBookingStats)
      .sort((a, b) => b.bookingCount - a.bookingCount)
      .slice(0, 5);

    // Latest reviews
    const recentReviews = await Review.find({ experience: { $in: expIds } })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('experience', 'title coverImage category')
      .populate('user', 'name');

    // Pending Actions
    const pendingActions = [];

    // 1. Unconfirmed Bookings
    const pendingBookings = allBookings.filter(b => b.status === 'pending');
    if (pendingBookings.length > 0) {
      pendingActions.push({
        type: 'confirm_bookings',
        title: 'Confirm Pending Bookings',
        message: `You have ${pendingBookings.length} pending booking requests that need confirmation.`,
        count: pendingBookings.length
      });
    }

    // 2. Draft/Changes Requested experiences
    const actionRequiredListings = experiences.filter(e => ['changes_requested', 'rejected', 'draft'].includes(e.status));
    actionRequiredListings.forEach(e => {
      pendingActions.push({
        type: 'update_listing',
        title: `Action required: ${e.title}`,
        message: e.status === 'changes_requested'
          ? `Admin requested changes for this listing: "${e.rejectionReason || 'Please review.'}"`
          : `Listing is in ${e.status} state. Update details to list it live.`,
        referenceId: e._id
      });
    });

    // 3. Profile actions (GST / business registration / guide certification checks)
    const needsOperatorInfo = experiences.some(e => {
      return !e.operatorInfo || !e.operatorInfo.businessRegistrationNumber;
    });
    if (needsOperatorInfo) {
      pendingActions.push({
        type: 'upload_documents',
        title: 'Upload Business Registration',
        message: 'Provide your business registration number / CIN in experience builder to complete verification.'
      });
    }

    res.json({
      success: true,
      stats: {
        bookingsToday: bookingsTodayCount,
        upcomingThisWeek: upcomingBookings.length,
        revenueThisMonth,
        totalRevenue,
        totalListings: experiences.length,
        totalReviews: experiences.reduce((sum, e) => sum + e.reviewCount, 0),
        averageRating: experiences.length > 0
          ? Math.round((experiences.reduce((sum, e) => sum + e.rating, 0) / experiences.length) * 10) / 10
          : 0,
        occupancyRate,
        upcomingBookings,
        revenueChart,
        popularExperiences,
        recentReviews,
        pendingActions
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
      { returnDocument: 'after', runValidators: true }
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
      .populate('assignedGuide')
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
      { returnDocument: 'after', runValidators: true }
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

// @route GET /api/operator/message-threads
// Returns all booking conversations (grouped by booking) that have at least one message,
// with the latest message preview — used by the unified Messages page.
const getMessageThreads = async (req, res) => {
  try {
    const expIds = await getOperatorExperienceIds(req.user._id);
    const bookings = await Booking.find({ experience: { $in: expIds } })
      .populate('user', 'name email')
      .populate('experience', 'title')
      .lean();

    if (bookings.length === 0) return res.json({ success: true, threads: [] });

    const bookingIds = bookings.map(b => b._id);
    const bookingMap = Object.fromEntries(bookings.map(b => [b._id.toString(), b]));

    // One aggregation: latest message text + time + senderId per booking
    const latestMsgs = await Message.aggregate([
      { $match: { booking: { $in: bookingIds } } },
      { $sort: { createdAt: 1 } },
      { $group: {
        _id: '$booking',
        lastText:      { $last: '$text' },
        lastCreatedAt: { $last: '$createdAt' },
        lastSenderId:  { $last: '$sender' },
      }},
      { $sort: { lastCreatedAt: -1 } },
    ]);

    // Fetch roles of the last-message senders
    const senderIds = latestMsgs.map(m => m.lastSenderId).filter(Boolean);
    const senders   = await User.find({ _id: { $in: senderIds } }).select('role').lean();
    const senderMap = Object.fromEntries(senders.map(s => [s._id.toString(), s]));

    const threads = latestMsgs.map(msg => {
      const booking = bookingMap[msg._id.toString()];
      if (!booking) return null;
      const senderRole = senderMap[msg.lastSenderId?.toString()]?.role || 'customer';
      return {
        _id:        booking._id,
        customer:   booking.user,
        experience: booking.experience,
        lastMessage: {
          text:       msg.lastText,
          createdAt:  msg.lastCreatedAt,
          senderRole,
        },
        updatedAt: msg.lastCreatedAt,
      };
    }).filter(Boolean);

    res.json({ success: true, threads });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/operator/inquiries
// List all inquiry threads for the authenticated operator's experiences
const getInquiries = async (req, res) => {
  try {
    const expIds = await getOperatorExperienceIds(req.user._id);
    const inquiries = await Inquiry.find({ experience: { $in: expIds } })
      .populate('customer', 'name email')
      .populate('experience', 'title')
      .sort({ updatedAt: -1 });
    res.json({ success: true, inquiries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/operator/guides
const getGuides = async (req, res) => {
  try {
    const guides = await Guide.find({});
    res.json({ success: true, count: guides.length, guides });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/operator/marketplace
// Fetch all marketplace services and check if operator is collaborating
const getLocalServices = async (req, res) => {
  try {
    const services = await LocalService.find().lean();
    const mapped = services.map(s => ({
      ...s,
      collaborating: s.collaborators?.map(id => id.toString()).includes(req.user._id.toString()) || false
    }));
    res.json({ success: true, services: mapped });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PATCH /api/operator/bookings/:id/assign-guide
const assignGuide = async (req, res) => {
  try {
    const { guideId } = req.body;

    const booking = await Booking.findById(req.params.id).populate('experience');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.experience.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this booking' });
    }

    if (!guideId || guideId === 'unassigned') {
      booking.assignedGuide = null;
    } else {
      const guide = await Guide.findById(guideId);
      if (!guide) {
        return res.status(404).json({ success: false, message: 'Guide not found' });
      }
      booking.assignedGuide = guideId;
    }

    await booking.save();
    
    const updatedBooking = await Booking.findById(booking._id)
      .populate('experience', 'title images price location duration')
      .populate('user', 'name email phone avatar')
      .populate('assignedGuide');

    res.json({ success: true, booking: updatedBooking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route POST /api/operator/marketplace/:id/link
// Link local service to operator profile (collaboration)
const linkLocalService = async (req, res) => {
  try {
    const service = await LocalService.findById(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Local service not found' });

    if (!service.collaborators.includes(req.user._id)) {
      service.collaborators.push(req.user._id);
      await service.save();
    }
    res.json({ success: true, message: 'Linked successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route POST /api/operator/marketplace/:id/unlink
// Unlink local service from operator profile
const unlinkLocalService = async (req, res) => {
  try {
    const service = await LocalService.findById(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Local service not found' });

    service.collaborators = service.collaborators.filter(id => id.toString() !== req.user._id.toString());
    await service.save();
    res.json({ success: true, message: 'Unlinked successfully' });
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
  respondToReview,
  getInquiries,
  getMessageThreads,
  getGuides,
  assignGuide,
  getLocalServices,
  linkLocalService,
  unlinkLocalService,
};
