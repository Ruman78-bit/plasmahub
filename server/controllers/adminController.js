const User = require('../models/User');
const BloodRequest = require('../models/BloodRequest');
const Inventory = require('../models/Inventory');

const getMetrics = async (req, res, next) => {
  try {
    const [
      totalPatients,
      totalHospitals,
      totalRequests,
      pendingRequests,
      fulfilledRequests,
      criticalRequests
    ] = await Promise.all([
      User.countDocuments({ role: 'patient', isActive: true }),
      User.countDocuments({ role: 'hospital', isActive: true }),
      BloodRequest.countDocuments(),
      BloodRequest.countDocuments({ status: 'pending' }),
      BloodRequest.countDocuments({ status: 'fulfilled' }),
      BloodRequest.countDocuments({ status: 'pending', urgency: 'critical' })
    ]);

    const bloodGroupDemand = await BloodRequest.aggregate([
      { $group: { _id: '$bloodGroup', count: { $sum: 1 }, units: { $sum: '$units' } } },
      { $sort: { count: -1 } }
    ]);

    const recentRequests = await BloodRequest.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    res.status(200).json({
      success: true,
      data: {
        totalPatients,
        totalHospitals,
        totalRequests,
        pendingRequests,
        fulfilledRequests,
        criticalRequests,
        bloodGroupDemand,
        recentRequests
      }
    });
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (role) {
      filter.role = role;
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password -_name -_phone -_address -_licenseNumber')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort('-createdAt');

    const data = users.map((user) => user.toSafeObject());

    res.status(200).json({ success: true, total, page: Number(page), data });
  } catch (error) {
    next(error);
  }
};

const getAllRequests = async (req, res, next) => {
  try {
    const { status, urgency, bloodGroup, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (urgency) filter.urgency = urgency;
    if (bloodGroup) filter.bloodGroup = bloodGroup;

    const total = await BloodRequest.countDocuments(filter);
    const requests = await BloodRequest.find(filter)
      .populate('patient', 'name bloodGroup age')  // ✅ No underscore
      .populate('hospital', 'hospitalName city')
      .sort('-createdAt')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const data = requests.map((request) => {
      const obj = request.toObject();
      if (request.patient) {
        obj.patient = {
          _id: request.patient._id,
          name: request.patient.name || 'Unknown Patient',
          bloodGroup: request.patient.bloodGroup,
          age: request.patient.age
        };
      }
      return obj;
    });

    res.status(200).json({ success: true, total, page: Number(page), data });
  } catch (error) {
    next(error);
  }
};

const getAllInventory = async (req, res, next) => {
  try {
    const inventories = await Inventory.find().populate('hospital', 'hospitalName city state');
    res.status(200).json({ success: true, count: inventories.length, data: inventories });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMetrics,
  getUsers,
  getAllRequests,
  getAllInventory
};
