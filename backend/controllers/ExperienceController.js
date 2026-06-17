const Experience = require('../models/Experience');

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
    const experience = await Experience.findById(req.params.id);
    if (!experience) return res.status(404).json({ success: false, message: 'Experience not found' });
    res.json({ success: true, experience });
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

module.exports = { getExperiences, getExperience, createExperience };