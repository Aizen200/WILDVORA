const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    experience: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Experience',
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
    },
    userName: { type: String },
    hostReply: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// One review per user per experience
reviewSchema.index({ user: 1, experience: 1 }, { unique: true });

// Update experience rating after review save
reviewSchema.post('save', async function () {
  const Experience = mongoose.model('Experience');
  const stats = await mongoose.model('Review').aggregate([
    { $match: { experience: this.experience } },
    { $group: { _id: '$experience', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (stats.length > 0) {
    await Experience.findByIdAndUpdate(this.experience, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      reviewCount: stats[0].count,
    });
  }
});

module.exports = mongoose.model('Review', reviewSchema);