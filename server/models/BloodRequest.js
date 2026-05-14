const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const URGENCY_OPTIONS = ['routine','urgent','critical'];
const STATUS_OPTIONS = ['pending','approved','fulfilled','rejected','cancelled'];

const bloodRequestSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  bloodGroup: {
    type: String,
    required: true,
    enum: BLOOD_GROUPS
  },
  units: {
    type: Number,
    required: true,
    min: [1, 'Units must be at least 1'],
    max: [10, 'Units must be at most 10']
  },
  urgency: {
    type: String,
    enum: URGENCY_OPTIONS,
    default: 'routine'
  },
  status: {
    type: String,
    enum: STATUS_OPTIONS,
    default: 'pending'
  },
  _notes: String,
  hospitalNote: String,
  fulfilledAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

bloodRequestSchema.virtual('notes')
  .get(function () {
    return decrypt(this._notes);
  })
  .set(function (value) {
    this._notes = encrypt(value);
  });

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);
