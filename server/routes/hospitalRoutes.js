const express = require('express');
const {
  getInventory,
  updateInventory,
  getRequests,
  updateRequestStatus,
  getStats
} = require('../controllers/hospitalController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect, authorize('hospital'));

router.get('/inventory', getInventory);
router.put('/inventory', updateInventory);
router.get('/requests', getRequests);
router.patch('/requests/:id', updateRequestStatus);
router.get('/stats', getStats);

module.exports = router;
