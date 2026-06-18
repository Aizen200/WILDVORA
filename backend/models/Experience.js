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
      enum: [
        'Camping', 'Trekking', 'Paragliding', 'Rafting', 'Scuba Diving',
        'Cycling', 'Wildlife Safari', 'Climbing', 'Skiing', 'Water Sports', 'Jungle', 'Safari',
      ],
      required: true,
    },
    location: {
      city:          { type: String, required: true },
      state:         { type: String },
      country:       { type: String, required: true },
      meetingPoint:  { type: String },
      googleMapsLink:{ type: String },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    socialLinks: {
      instagram: { type: String },
      website:   { type: String },
    },
    // Media
    coverImage:      { type: String },
    adventureImages: [{ type: String }],
    video:           { type: String },
    images:          [{ type: String }], // kept for backward compatibility
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
      enum: ['Easy', 'Moderate', 'Hard', 'Difficult', 'Expert'],
      default: 'Moderate',
    },
    minGroupSize: { type: Number, default: 1 },
    maxGroupSize: { type: Number, default: 12 },
    bookingDeadline: { type: Number }, // days before experience date
    ageRestriction:     { type: String },
    medicalRestrictions:{ type: String },
    safetyInfo: {
      firstAidAvailable:      { type: Boolean, default: false },
      emergencyContact:       { type: String },
      safetyBriefingIncluded: { type: Boolean, default: false },
    },
    requirements: [{ type: String }],
    includes: [{ type: String }],
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    hostName:     { type: String, default: 'Wildvora Host' },
    hostVerified: { type: Boolean, default: false },
    rating:       { type: Number, default: 0 },
    reviewCount:  { type: Number, default: 0 },
    isFeatured:   { type: Boolean, default: false },
    isTrending:   { type: Boolean, default: false },
    isActive:     { type: Boolean, default: true },
    availableDates:     [{ type: String }],
    exclusions:         [{ type: String }],
    cancellationPolicy: {
      type: String,
      default: 'Flexible: Cancel up to 24 hours in advance for a full refund.',
    },
    safetyChecklist: [{ type: String }],
    medicalAdvisories: [{ type: String }],
    emergencyInfo: {
      contact: { type: String, default: '' },
      nearestFacility: { type: String, default: '' }
    },
    operatorInfo: {
      businessRegistrationNumber: { type: String },
      gstNumber:                  { type: String },
      tourismRegistration:        { type: String },
      yearsOfOperation:           { type: Number },
      guideCertifications:        { type: String },
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'live', 'paused', 'rejected', 'changes_requested', 'suspended'],
      default: 'pending',
    },
    rejectionReason:  { type: String, default: '' },
    suspensionReason: { type: String, default: '' },
    suspendedAt:      { type: Date },
    submittedAt:      { type: Date },
    approvedAt:       { type: Date },
  },
  { timestamps: true }
);

experienceSchema.index({ title: 'text', description: 'text', 'location.city': 'text' });

module.exports = mongoose.model('Experience', experienceSchema);
