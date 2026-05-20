const express = require('express');
const { getBudget, setBudget } = require('../controllers/budgetController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/', getBudget);
router.post('/', setBudget);

module.exports = router;
