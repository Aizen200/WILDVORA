const mongoose = require('mongoose');

const guideSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    languages: [{
      type: String,
    }],
    specialty: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      default: 5.0,
    },
    activeTrips: {
      type: Number,
      default: 0,
    },
    avatar: {
      type: String,
      default: '',
    },
    operator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Guide', guideSchema);
