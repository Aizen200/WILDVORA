const express = require('express');
const router = express.Router();
const { generateTripPlan, generateGuidedTripPlan } = require('../controllers/AIController');

router.post('/plan-trip', generateTripPlan);
router.post('/plan-trip-guided', generateGuidedTripPlan);

module.exports = router;
