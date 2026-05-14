const express = require('express');
const {
  getMetrics,
  getUsers,
  getAllRequests,
  getAllInventory
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect, authorize('admin'));

router.get('/metrics', getMetrics);
router.get('/users', getUsers);
router.get('/requests', getAllRequests);
router.get('/inventory', getAllInventory);

module.exports = router;
