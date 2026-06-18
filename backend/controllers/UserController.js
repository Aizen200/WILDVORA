const User    = require('../models/User');
const Booking = require('../models/Booking');

// @route GET /api/users/profile
const getProfile = async (req, res) => {
  try {
    const [user, completedTrips] = await Promise.all([
      User.findById(req.user._id).populate('wishlist', 'title images price location rating'),
      Booking.countDocuments({ user: req.user._id, status: 'completed' }),
    ]);
    res.json({ success: true, user, completedTrips });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PATCH /api/users/profile
const updateProfile = async (req, res) => {
  try {
    const {
      name, phone, bio, avatar,
      city, dateOfBirth, gender,
      emergencyContactName, emergencyContactPhone,
    } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, bio, avatar, city, dateOfBirth, gender, emergencyContactName, emergencyContactPhone },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route POST /api/users/wishlist/:experienceId
const toggleWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const id = req.params.experienceId;

    const idx = user.wishlist.indexOf(id);
    if (idx === -1) {
      user.wishlist.push(id);
    } else {
      user.wishlist.splice(idx, 1);
    }
    await user.save();
    await user.populate('wishlist', 'title images price location rating');
    res.json({ success: true, wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PATCH /api/users/password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getProfile, updateProfile, toggleWishlist, changePassword };