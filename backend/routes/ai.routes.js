const express = require('express');
const router = express.Router();
const { generateTripPlan } = require('../controllers/AIController');

router.post('/plan-trip', generateTripPlan);

module.exports = router;
