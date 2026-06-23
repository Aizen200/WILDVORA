const Experience = require('../models/Experience');
const Booking = require('../models/Booking');
const User = require('../models/User');

// @route GET /api/experiences
const getExperiences = async (req, res) => {
  try {
    const { category, difficulty, minPrice, maxPrice, duration, search, featured, trending, limit = 20, page = 1 } = req.query;

    const query = { isActive: true, status: 'live' };

    if (category && category !== 'All') query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (duration) {
      if (duration === '1 day') query.duration = '1 day';
      else if (duration === '2-3 days') query.duration = { $in: ['2 days', '3 days', '2-3 days'] };
      else if (duration === '1 week+') query.duration = { $regex: /week|7|8|9|10|14/, $options: 'i' };
    }
    if (featured === 'true') query.isFeatured = true;
    if (trending === 'true') query.isTrending = true;
    if (search) query.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Experience.countDocuments(query);
    const experiences = await Experience.find(query).skip(skip).limit(Number(limit)).sort({ createdAt: -1 });

    res.json({ success: true, total, count: experiences.length, experiences });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/experiences/:id
const getExperience = async (req, res) => {
  try {
    const experience = await Experience.findById(req.params.id).populate('host', 'name email avatar');
    if (!experience) return res.status(404).json({ success: false, message: 'Experience not found' });

    const hostExperiencesCount = experience.host
      ? await Experience.countDocuments({ host: experience.host._id, status: 'live' })
      : 0;

    res.json({ success: true, experience: { ...experience.toObject(), hostExperiencesCount } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route POST /api/experiences  (operator use)
const createExperience = async (req, res) => {
  try {
    const experience = await Experience.create(req.body);
    res.status(201).json({ success: true, experience });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/experiences/host/:hostId  (public)
const getHostProfile = async (req, res) => {
  try {
    const { hostId } = req.params;

    const host = await User.findById(hostId).select('name avatar bio city kyc createdAt');
    if (!host) return res.status(404).json({ success: false, message: 'Host not found' });

    const experiences = await Experience.find({ host: hostId, status: 'live', isActive: true })
      .sort({ isFeatured: -1, rating: -1, createdAt: -1 });

    const expIds = experiences.map(e => e._id);
    const totalReviews = experiences.reduce((sum, e) => sum + e.reviewCount, 0);
    const avgRating = experiences.length > 0
      ? Math.round((experiences.reduce((sum, e) => sum + e.rating, 0) / experiences.length) * 10) / 10
      : 0;
    const guestsHosted = await Booking.countDocuments({
      experience: { $in: expIds },
      status: { $in: ['confirmed', 'completed'] },
    });

    res.json({
      success: true,
      host: {
        _id: host._id,
        name: host.name,
        avatar: host.avatar,
        bio: host.bio,
        city: host.city,
        verified: host.kyc === 'approved',
        memberSince: host.createdAt,
      },
      experiences,
      stats: {
        experienceCount: experiences.length,
        avgRating,
        totalReviews,
        guestsHosted,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getExperiences, getExperience, createExperience, getHostProfile };