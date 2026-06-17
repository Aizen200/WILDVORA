const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    category: {
      type: String,
      enum: ['Camping', 'Trekking', 'Water Sports', 'Jungle', 'Cycling', 'Climbing', 'Safari', 'Skiing'],
      required: true,
    },
    location: {
      city: { type: String, required: true },
      country: { type: String, required: true },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    images: [{ type: String }],
    price: {
      type: Number,
      required: [true, 'Price is required'],
    },
    duration: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Moderate', 'Hard', 'Expert'],
      default: 'Moderate',
    },
    maxGroupSize: {
      type: Number,
      default: 12,
    },
    includes: [{ type: String }],
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    hostName: { type: String, default: 'Wildvora Host' },
    hostVerified: { type: Boolean, default: false },
    rating: {
      type: Number,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isTrending: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    availableDates: [{ type: String }],
    exclusions: [{ type: String }],
    cancellationPolicy: {
      type: String,
      default: 'Flexible: Cancel up to 24 hours in advance for a full refund.',
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'live', 'paused', 'rejected', 'changes_requested'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    submittedAt: {
      type: Date,
    },
    approvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Text index for search
experienceSchema.index({ title: 'text', description: 'text', 'location.city': 'text' });

module.exports = mongoose.model('Experience', experienceSchema);