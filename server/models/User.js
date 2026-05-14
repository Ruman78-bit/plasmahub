const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { encrypt, decrypt } = require('../utils/encryption');

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const ROLE_OPTIONS = ['patient','hospital','admin'];

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  role: {
    type: String,
    required: true,
    enum: ROLE_OPTIONS
  },
  _name: String,
  _phone: String,
  _address: String,
  _licenseNumber: String,
  bloodGroup: {
    type: String,
    enum: BLOOD_GROUPS
  },
  age: {
    type: Number,
    min: [1, 'Age must be at least 1'],
    max: [120, 'Age must be 120 or below']
  },
  hospitalName: String,
  city: String,
  state: String,
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

userSchema.virtual('name')
  .get(function () {
    return decrypt(this._name);
  })
  .set(function (value) {
    this._name = encrypt(value);
  });

userSchema.virtual('phone')
  .get(function () {
    return decrypt(this._phone);
  })
  .set(function (value) {
    this._phone = encrypt(value);
  });

userSchema.virtual('address')
  .get(function () {
    return decrypt(this._address);
  })
  .set(function (value) {
    this._address = encrypt(value);
  });

userSchema.virtual('licenseNumber')
  .get(function () {
    return decrypt(this._licenseNumber);
  })
  .set(function (value) {
    this._licenseNumber = encrypt(value);
  });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj._name;
  delete obj._phone;
  delete obj._address;
  delete obj._licenseNumber;

  if (this.name) {
    obj.name = this.name;
  }
  if (this.phone) {
    obj.phone = this.phone;
  }
  if (this.address) {
    obj.address = this.address;
  }
  if (this.licenseNumber) {
    obj.licenseNumber = this.licenseNumber;
  }

  return obj;
};

module.exports = mongoose.model('User', userSchema);
