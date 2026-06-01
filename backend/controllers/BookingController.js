const Booking = require('../models/Booking');
const Experience = require('../models/Experience');

// @route POST /api/bookings
const createBooking = async (req, res) => {
  try {
    const { experienceId, startDate, endDate, adults, children, paymentMethod, specialRequests } = req.body;

    const experience = await Experience.findById(experienceId);
    if (!experience) return res.status(404).json({ success: false, message: 'Experience not found' });

    const basePrice = (experience.price * (adults || 1)) + (experience.price * 0.5 * (children || 0));
    const serviceFee = Math.round(basePrice * 0.05);
    const tax = Math.round(basePrice * 0.03);
    const calculatedTotal = basePrice + serviceFee + tax;

    // Use provided totalPrice or fallback to calculated
    const finalPrice = req.body.totalPrice || calculatedTotal;

    const booking = await Booking.create({
      user: req.user._id,
      experience: experienceId,
      startDate,
      endDate,
      adults: adults || 1,
      children: children || 0,
      totalPrice: finalPrice,
      paymentMethod: paymentMethod || 'card',
      specialRequests: specialRequests || '',
    });

    await booking.populate('experience', 'title images location price duration');

    res.status(201).json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/bookings/my
const getMyBookings = async (req, res) => {
  try {
    const { status } = req.query;
    const query = { user: req.user._id };
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('experience', 'title images location price duration category')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/bookings/:id
const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('experience');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PATCH /api/bookings/:id/cancel
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    booking.status = 'cancelled';
    await booking.save();
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createBooking, getMyBookings, getBooking, cancelBooking };