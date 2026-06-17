const express = require('express');
const router = express.Router();
const { protect } = require('../services/Auth');
const upload = require('../middlewares/upload');

// POST /api/upload  — accepts up to 20 files under the field name "files"
router.post('/', protect, upload.array('files', 20), (req, res) => {
  if (!req.files?.length) {
    return res.status(400).json({ success: false, message: 'No files uploaded' });
  }
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const urls = req.files.map(f => `${baseUrl}/uploads/${f.filename}`);
  res.json({ success: true, urls });
});

module.exports = router;
