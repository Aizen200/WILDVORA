const mongoose = require('mongoose');

const destinationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Destination title is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
    },
    region: {
      type: String,
      required: [true, 'Region is required'],
    },
    coverImage: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Weather Alert', 'Peak Season', 'Moderate Rain', 'Heavy Snow', 'Normal'],
      default: 'Normal',
    },
    bestSeason: {
      type: String,
      default: '',
    },
    roadStatus: {
      type: String,
      default: 'All Routes Open',
    },
    permitRequirements: {
      type: String,
      default: '',
    },
    emergencyContact: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Destination', destinationSchema);
