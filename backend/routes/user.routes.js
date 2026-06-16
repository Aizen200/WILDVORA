const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, toggleWishlist, changePassword } = require('../controllers/UserController');
const { protect } = require('../services/Auth');
const triplanner=require("../controllers/ai.controller")
router.use(protect);

router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.post('/wishlist/:experienceId', toggleWishlist);
router.patch('/password', changePassword);
router.post("/trip-planner",triplanner)
module.exports = router;
