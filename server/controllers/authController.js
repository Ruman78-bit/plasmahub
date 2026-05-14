const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Inventory = require('../models/Inventory');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

const register = async (req, res, next) => {
  try {
    const {
      email,
      password,
      role,
      name,
      phone,
      bloodGroup,
      age,
      address,
      hospitalName,
      licenseNumber,
      city,
      state
    } = req.body;

    if (!email || !password || !role || !name || !phone) {
      const error = new Error('Missing required registration fields');
      error.statusCode = 400;
      return next(error);
    }

    if (!['patient', 'hospital'].includes(role)) {
      const error = new Error('Role must be either patient or hospital');
      error.statusCode = 400;
      return next(error);
    }

    const user = new User({ email, password, role });
    user.name = name;
    user.phone = phone;

    if (role === 'patient') {
      user.bloodGroup = bloodGroup;
      user.age = age;
      if (address) user.address = address;
    }

    if (role === 'hospital') {
      user.hospitalName = hospitalName;
      if (licenseNumber) user.licenseNumber = licenseNumber;
      user.city = city;
      user.state = state;
    }

    await user.save();

    if (role === 'hospital') {
      await Inventory.create({ hospital: user._id });
    }

    const token = signToken(user._id);
    res.status(201).json({
      success: true,
      token,
      user: user.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const error = new Error('Email and password are required');
      error.statusCode = 400;
      return next(error);
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      return next(error);
    }

    if (!user.isActive) {
      const error = new Error('User account is inactive');
      error.statusCode = 403;
      return next(error);
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);
    res.status(200).json({
      success: true,
      token,
      user: user.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
};

const getMe = (req, res) => {
  res.status(200).json({ success: true, user: req.user.toSafeObject() });
};

module.exports = {
  register,
  login,
  getMe
};
