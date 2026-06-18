const Review = require('../models/Review');
const Booking = require('../models/Booking');

// @route GET /api/reviews/experience/:id
const getExperienceReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ experience: req.params.id })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: reviews.length, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route POST /api/reviews
const createReview = async (req, res) => {
  try {
    const { experienceId, rating, comment, bookingId } = req.body;

    // Verify the booking exists, belongs to this user, and is marked completed
    const booking = await Booking.findOne({
      _id:        bookingId,
      user:       req.user._id,
      experience: experienceId,
    });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (booking.status !== 'completed') {
      return res.status(403).json({
        success: false,
        message: 'Reviews can only be submitted after the trip has been marked as completed.',
      });
    }

    const existing = await Review.findOne({ user: req.user._id, experience: experienceId });
    if (existing) return res.status(400).json({ success: false, message: 'You already reviewed this experience' });

    const review = await Review.create({
      user: req.user._id,
      experience: experienceId,
      booking: bookingId,
      rating,
      comment,
      userName: req.user.name,
    });

    res.status(201).json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/reviews/my
const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate('experience', 'title images')
      .sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getExperienceReviews, createReview, getMyReviews };