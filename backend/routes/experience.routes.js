const express = require('express');
const router = express.Router();
const { getExperiences, getExperience, createExperience } = require('../controllers/ExperienceController');

router.get('/', getExperiences);
router.get('/:id', getExperience);
router.post('/', createExperience);

module.exports = router;
