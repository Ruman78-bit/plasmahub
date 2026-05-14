const mongoose = require('mongoose');

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

const bloodUnitSchema = new mongoose.Schema({
  bloodGroup: {
    type: String,
    required: true,
    enum: BLOOD_GROUPS
  },
  units: {
    type: Number,
    default: 0,
    min: [0, 'Units cannot be negative']
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const inventorySchema = new mongoose.Schema({
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  stock: {
    type: [bloodUnitSchema],
    default: function () {
      return BLOOD_GROUPS.map(group => ({ bloodGroup: group, units: 0 }));
    }
  }
}, {
  timestamps: true
});

inventorySchema.methods.getUnits = function (bloodGroup) {
  return this.stock.find(item => item.bloodGroup === bloodGroup)?.units ?? 0;
};

inventorySchema.methods.updateUnits = function (bloodGroup, units) {
  const item = this.stock.find(entry => entry.bloodGroup === bloodGroup);
  if (!item) {
    return;
  }

  item.units = Math.max(0, Number(units) || 0);
  item.lastUpdated = new Date();
};

module.exports = mongoose.model('Inventory', inventorySchema);
