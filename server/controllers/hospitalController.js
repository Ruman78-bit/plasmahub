const BloodRequest = require('../models/BloodRequest');
const Inventory = require('../models/Inventory');

const getInventory = async (req, res, next) => {
  try {
    let inventory = await Inventory.findOne({ hospital: req.user._id });
    if (!inventory) {
      inventory = await Inventory.create({ hospital: req.user._id });
    }

    res.status(200).json({ success: true, data: inventory });
  } catch (error) {
    next(error);
  }
};

const updateInventory = async (req, res, next) => {
  try {
    const { stock } = req.body;

    if (!Array.isArray(stock)) {
      const error = new Error('Stock must be an array');
      error.statusCode = 400;
      return next(error);
    }

    let inventory = await Inventory.findOne({ hospital: req.user._id });
    if (!inventory) {
      inventory = await Inventory.create({ hospital: req.user._id });
    }

    stock.forEach((item) => {
      if (!item || typeof item.bloodGroup !== 'string' || typeof item.units === 'undefined') {
        return;
      }
      inventory.updateUnits(item.bloodGroup, item.units);
    });

    await inventory.save();
    res.status(200).json({ success: true, data: inventory });
  } catch (error) {
    next(error);
  }
};

const getRequests = async (req, res, next) => {
  try {
    
    const { status } = req.query;
    const filter = { hospital: req.user._id };
    console.log("filter:", filter);
    if (status) {
      filter.status = status;
    }
    const requests = await BloodRequest.find(filter)
      .populate('patient', 'name bloodGroup age')  // ✅ No underscore - SELECT fields
      .sort('-createdAt');
      
    const data = requests.map((request) => {
      const obj = request.toObject();
      // Ensure patient data exists and flatten it properly
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

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
};

const updateRequestStatus = async (req, res, next) => {
  try {
    const { status, hospitalNote } = req.body;
    const validStatuses = ['approved', 'fulfilled', 'rejected'];

    if (!validStatuses.includes(status)) {
      const error = new Error('Status must be approved, fulfilled, or rejected');
      error.statusCode = 400;
      return next(error);
    }

    const request = await BloodRequest.findOne({
      _id: req.params.id,
      hospital: req.user._id
    });

    if (!request) {
      const error = new Error('Request not found');
      error.statusCode = 404;
      return next(error);
    }

    if (status === 'fulfilled') {
      let inventory = await Inventory.findOne({ hospital: req.user._id });
      if (!inventory) {
        inventory = await Inventory.create({ hospital: req.user._id });
      }

      const currentUnits = inventory.getUnits(request.bloodGroup);
      if (currentUnits < request.units) {
        const error = new Error('Insufficient inventory');
        error.statusCode = 400;
        return next(error);
      }

      inventory.updateUnits(request.bloodGroup, currentUnits - request.units);
      await inventory.save();
      request.fulfilledAt = new Date();
    }

    request.status = status;
    if (hospitalNote) {
      request.hospitalNote = hospitalNote;
    }

    await request.save();
    res.status(200).json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
};

const getStats = async (req, res, next) => {
  try {
    let inventory = await Inventory.findOne({ hospital: req.user._id });
    if (!inventory) {
      inventory = await Inventory.create({ hospital: req.user._id });
    }

    const [pendingRequests, fulfilledRequests, rejectedRequests] = await Promise.all([
      BloodRequest.countDocuments({ hospital: req.user._id, status: 'pending' }),
      BloodRequest.countDocuments({ hospital: req.user._id, status: 'fulfilled' }),
      BloodRequest.countDocuments({ hospital: req.user._id, status: 'rejected' })
    ]);

    const totalStock = inventory.stock.reduce((sum, item) => sum + item.units, 0);

    res.status(200).json({
      success: true,
      data: {
        totalStock,
        pendingRequests,
        fulfilledRequests,
        rejectedRequests
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInventory,
  updateInventory,
  getRequests,
  updateRequestStatus,
  getStats
};
