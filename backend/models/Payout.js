const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema(
  {
    operator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processed', 'failed'],
      default: 'pending',
    },
    transactionId: {
      type: String,
      default: '',
    },
    releasedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payout', payoutSchema);
