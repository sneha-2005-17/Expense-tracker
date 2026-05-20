const express = require('express');
const { scanReceipt } = require('../controllers/receiptController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect);

router.post('/scan', (req, res, next) => {
  req.setTimeout(300000);
  res.setTimeout(300000);
  upload.single('receipt')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Image must be smaller than 10MB' });
      }
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, scanReceipt);

module.exports = router;
