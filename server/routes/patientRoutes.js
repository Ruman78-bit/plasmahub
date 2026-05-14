const express = require('express');
const {
  createRequest,
  getMyRequests,
  cancelRequest,
  getHospitals
} = require('../controllers/patientController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect, authorize('patient'));

router.get('/requests', getMyRequests);
router.post('/requests', createRequest);
router.delete('/requests/:id', cancelRequest);
router.get('/hospitals', getHospitals);

module.exports = router;
