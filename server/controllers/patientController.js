const BloodRequest = require('../models/BloodRequest');
const Inventory = require('../models/Inventory');

const createRequest = async (req, res, next) => {
  try {
    const { bloodGroup, units, urgency, notes, hospitalId, hospital } = req.body;
    const preferredHospital = hospitalId || hospital;

    if (!bloodGroup || !units) {
      const error = new Error('Blood group and units are required');
      error.statusCode = 400;
      return next(error);
    }

    const request = new BloodRequest({
      patient: req.user._id,
      hospital: preferredHospital || undefined,
      bloodGroup,
      units,
      urgency: urgency || 'routine'
    });

    if (notes) {
      request.notes = notes;
    }

    await request.save();
    await request.populate('hospital', 'hospitalName city state');

    res.status(201).json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
};

const getMyRequests = async (req, res, next) => {
  try {
    const requests = await BloodRequest.find({ patient: req.user._id })
      .populate('hospital', 'hospitalName city state')
      .sort('-createdAt');

    const data = requests.map((request) => {
      const obj = request.toObject();
      obj.notes = request.notes;
      return obj;
    });

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
};

const cancelRequest = async (req, res, next) => {
  try {
    const request = await BloodRequest.findOne({
      _id: req.params.id,
      patient: req.user._id
    });

    if (!request) {
      const error = new Error('Request not found');
      error.statusCode = 404;
      return next(error);
    }

    if (['fulfilled', 'cancelled'].includes(request.status)) {
      const error = new Error(`Cannot cancel a ${request.status} request`);
      error.statusCode = 400;
      return next(error);
    }

    request.status = 'cancelled';
    await request.save();

    res.status(200).json({ success: true, message: 'Request cancelled' });
  } catch (error) {
    next(error);
  }
};

const getHospitals = async (req, res, next) => {
  try {
    const { bloodGroup } = req.query;
    const filter = {};

    if (bloodGroup) {
      filter.stock = { $elemMatch: { bloodGroup, units: { $gt: 0 } } };
    }

    const inventories = await Inventory.find(filter).populate('hospital', 'hospitalName city state');
    const data = inventories.map((inventory) => ({
      _id: inventory.hospital?._id || inventory._id,
      hospitalName: inventory.hospital?.hospitalName || '',
      city: inventory.hospital?.city || '',
      state: inventory.hospital?.state || '',
      stock: inventory.stock
    }));

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRequest,
  getMyRequests,
  cancelRequest,
  getHospitals
};
