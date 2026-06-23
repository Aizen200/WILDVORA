const express = require('express');
const router = express.Router();
const { getExperiences, getExperience, createExperience, getHostProfile } = require('../controllers/ExperienceController');

router.get('/', getExperiences);
router.get('/host/:hostId', getHostProfile);
router.get('/:id', getExperience);
router.post('/', createExperience);

module.exports = router;
