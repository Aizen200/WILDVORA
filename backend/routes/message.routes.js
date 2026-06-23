const express = require('express');
const router = express.Router();
const { getMessagesForBooking, sendMessage } = require('../controllers/MessageController');
const { protect } = require('../services/Auth');

router.use(protect);

router.get('/booking/:bookingId', getMessagesForBooking);
router.post('/', sendMessage);

module.exports = router;
