const Message = require('../models/Message');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const Experience = require('../models/Experience'); // Register Experience model in mongoose
const User = require('../models/User'); // Register User model in mongoose

// @route GET /api/messages/booking/:bookingId
const getMessagesForBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId).populate('experience');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const isCustomer = booking.user.toString() === req.user._id.toString();
    const isHost = booking.experience?.host && booking.experience.host.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isHost && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to view messages for this booking' });
    }

    const messages = await Message.find({ booking: bookingId })
      .populate('sender', 'name avatar role')
      .populate('recipient', 'name avatar role')
      .sort({ createdAt: 1 });

    res.json({ success: true, count: messages.length, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route POST /api/messages
const sendMessage = async (req, res) => {
  try {
    const { bookingId, text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    const booking = await Booking.findById(bookingId).populate('experience');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (!booking.experience) {
      return res.status(400).json({ success: false, message: 'Experience associated with this booking no longer exists' });
    }

    const isCustomer = booking.user.toString() === req.user._id.toString();
    const isHost = booking.experience?.host && booking.experience.host.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isHost && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to message on this booking' });
    }

    let recipientId;
    if (isCustomer) {
      recipientId = booking.experience.host;
    } else if (isHost) {
      recipientId = booking.user;
    } else if (isAdmin) {
      // If admin is sending, route to host if they are the customer, or customer if they are the host
      recipientId = booking.user.toString() === req.user._id.toString() ? booking.experience.host : booking.user;
    }

    if (!recipientId) {
      return res.status(400).json({ success: false, message: 'Recipient not found' });
    }

    const message = await Message.create({
      booking: bookingId,
      sender: req.user._id,
      recipient: recipientId,
      text: text.trim(),
    });

    await message.populate([
      { path: 'sender', select: 'name avatar role' },
      { path: 'recipient', select: 'name avatar role' }
    ]);

    // Create a notification for the recipient
    try {
      await Notification.create({
        recipient: recipientId,
        type: 'booking',
        title: isCustomer 
          ? `Message about "${booking.experience.title}"`
          : `Message from Host - "${booking.experience.title}"`,
        desc: `${req.user.name}: ${text.length > 50 ? text.slice(0, 50) + '...' : text}`,
        referenceId: booking._id,
        badges: [
          { text: 'Message', color: 'bg-blue-50 text-blue-600 border border-blue-100' },
          { text: `#${booking._id.toString().slice(-6).toUpperCase()}`, color: 'text-gray-500 border border-gray-200' }
        ]
      });
    } catch (notifErr) {
      console.error('Notification creation failed:', notifErr.message);
      // Don't fail the message request just because notification failed
    }

    res.status(201).json({ success: true, message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getMessagesForBooking,
  sendMessage,
};
