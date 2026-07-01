const mongoose = require('mongoose');

const localServiceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['guide', 'photographer', 'transport', 'rental', 'cafe', 'homestay'],
      required: true,
    },
    contact: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    priceUnit: {
      type: String,
      default: 'day', // day, hour, trip, item
    },
    rating: {
      type: Number,
      default: 4.5,
    },
    reviewsCount: {
      type: Number,
      default: 5,
    },
    collaborators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('LocalService', localServiceSchema);
