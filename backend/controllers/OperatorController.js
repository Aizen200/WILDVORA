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
    const experiences = await Experience.find({ host: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: experiences.length, experiences });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route POST /api/operator/listings
// Create Listing
const createListing = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      location,
      images,
      price,
      duration,
      difficulty,
      maxGroupSize,
      includes,
      exclusions,
      cancellationPolicy,
      availableDates,
      safetyChecklist,
      medicalAdvisories,
      emergencyInfo
    } = req.body;

    const experience = await Experience.create({
      title,
      description,
      category,
      location,
      socialLinks:       socialLinks || {},
      coverImage:        coverImage  || '',
      adventureImages:   adventureImages || [],
      video:             video || '',
      images:            images || [],
      price,
      duration,
      difficulty:        difficulty || 'Moderate',
      minGroupSize:      minGroupSize || 1,
      maxGroupSize:      maxGroupSize || 12,
      bookingDeadline:   bookingDeadline || undefined,
      ageRestriction:    ageRestriction || '',
      medicalRestrictions: medicalRestrictions || '',
      safetyInfo:        safetyInfo || {},
      requirements:      requirements || [],
      includes:          includes || [],
      exclusions:        exclusions || [],
      cancellationPolicy,
      availableDates: availableDates || [],
      safetyChecklist: safetyChecklist || [],
      medicalAdvisories: medicalAdvisories || [],
      emergencyInfo: emergencyInfo || { contact: '', nearestFacility: '' },
      host: req.user._id,
      hostName: req.user.name,
      hostVerified: req.user.kyc === 'approved',
      status: 'pending',
      submittedAt: new Date(),
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

    const updates = req.body;
    let becamePending = false;

    if (['rejected', 'changes_requested'].includes(exp.status)) {
      // Editing a rejected listing resubmits it for review
      updates.status = 'pending';
      updates.submittedAt = new Date();
      updates.rejectionReason = '';
      becamePending = true;
    } else if (exp.status === 'live' && (updates.title || updates.price || updates.description)) {
      // Critical field changes on a live listing require re-approval
      updates.status = 'pending';
      updates.submittedAt = new Date();
      becamePending = true;
    }

    const experience = await Experience.findByIdAndUpdate(
      req.params.id,
      updates,
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
// Confirm or decline booking
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const booking = await Booking.findById(req.params.id).populate('experience');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (booking.experience.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this booking' });
    }

    booking.status = status;
    if (status === 'cancelled') {
      booking.paymentStatus = 'refunded';
      booking.refundStatus = 'approved';
    }
    await booking.save();

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

    if (!['rejected', 'changes_requested'].includes(exp.status)) {
      return res.status(400).json({ success: false, message: 'Only rejected listings can be resubmitted' });
    }

    exp.status = 'pending';
    exp.submittedAt = new Date();
    exp.rejectionReason = '';
    await exp.save();

    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await Notification.create({
        recipient: admin._id,
        type: 'listing',
        title: `Listing Resubmitted – "${exp.title}"`,
        desc: `${req.user.name || 'An operator'} resubmitted a listing for review after addressing feedback.`,
        referenceId: exp._id,
        badges: [
          { text: 'Resubmitted', color: 'bg-blue-50 text-blue-600 border border-blue-100' },
          { text: `#${exp._id.toString().slice(-6).toUpperCase()}`, color: 'text-gray-500 border border-gray-200' }
        ]
      });
    }

    res.json({ success: true, message: 'Listing resubmitted for review', experience: exp });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route DELETE /api/operator/listings/:id
// Delete a listing (only draft, pending, or rejected listings can be deleted)
const deleteListing = async (req, res) => {
  try {
    const exp = await Experience.findOne({ _id: req.params.id, host: req.user._id });
    if (!exp) return res.status(404).json({ success: false, message: 'Listing not found or unauthorized' });

    if (exp.status === 'live') {
      return res.status(400).json({ success: false, message: 'Cannot delete a live listing. Pause it first.' });
    }

    await Experience.findByIdAndDelete(req.params.id);
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
  resubmitListing,
  deleteListing,
  getBookings,
  updateBookingStatus,
  getPayouts,
  updateBankAccount,
  getReviews,
  respondToReview
};
