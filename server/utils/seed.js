const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Inventory = require('../models/Inventory');
const BloodRequest = require('../models/BloodRequest');
const connectDB = require('../config/db');

const seed = async () => {
  try {
    await connectDB();

    await User.deleteMany({});
    await Inventory.deleteMany({});
    await BloodRequest.deleteMany({});

    const admin = new User({
      email: 'admin@plasmahub.com',
      password: 'Admin@123',
      role: 'admin'
    });
    admin.name = 'System Admin';
    admin.phone = '9999999999';
    await admin.save();

    const apollo = new User({
      email: 'apollo@plasmahub.com',
      password: 'Hospital@123',
      role: 'hospital',
      hospitalName: 'Apollo Blood Bank',
      city: 'Bengaluru',
      state: 'Karnataka'
    });
    apollo.name = 'Apollo Blood Bank';
    apollo.phone = '08012345678';
    apollo.licenseNumber = 'KA-BB-2024-001';
    await apollo.save();

    const fortis = new User({
      email: 'fortis@plasmahub.com',
      password: 'Hospital@123',
      role: 'hospital',
      hospitalName: 'Fortis Lifeline',
      city: 'Mumbai',
      state: 'Maharashtra'
    });
    fortis.name = 'Fortis Lifeline';
    fortis.phone = '02287654321';
    fortis.licenseNumber = 'MH-BB-2024-002';
    await fortis.save();

    await Inventory.create({
      hospital: apollo._id,
      stock: [
        { bloodGroup: 'A+', units: 25 },
        { bloodGroup: 'A-', units: 8 },
        { bloodGroup: 'B+', units: 30 },
        { bloodGroup: 'B-', units: 5 },
        { bloodGroup: 'AB+', units: 12 },
        { bloodGroup: 'AB-', units: 3 },
        { bloodGroup: 'O+', units: 40 },
        { bloodGroup: 'O-', units: 10 }
      ]
    });

    await Inventory.create({
      hospital: fortis._id,
      stock: [
        { bloodGroup: 'A+', units: 15 },
        { bloodGroup: 'A-', units: 4 },
        { bloodGroup: 'B+', units: 22 },
        { bloodGroup: 'B-', units: 2 },
        { bloodGroup: 'AB+', units: 6 },
        { bloodGroup: 'AB-', units: 0 },
        { bloodGroup: 'O+', units: 18 },
        { bloodGroup: 'O-', units: 7 }
      ]
    });

    const patient1 = new User({
      email: 'patient@plasmahub.com',
      password: 'Patient@123',
      role: 'patient',
      bloodGroup: 'O+',
      age: 35
    });
    patient1.name = 'Rohan Sharma';
    patient1.phone = '9876543210';
    patient1.address = '12 MG Road, Bengaluru';
    await patient1.save();

    const patient2 = new User({
      email: 'priya@example.com',
      password: 'Test@123',
      role: 'patient',
      bloodGroup: 'A-',
      age: 28
    });
    patient2.name = 'Priya Singh';
    patient2.phone = '9812345678';
    await patient2.save();

    await BloodRequest.create([
      {
        patient: patient1._id,
        hospital: apollo._id,
        bloodGroup: 'O+',
        units: 2,
        urgency: 'urgent',
        status: 'pending',
        notes: 'Required for surgery on Friday'
      },
      {
        patient: patient2._id,
        hospital: fortis._id,
        bloodGroup: 'A-',
        units: 1,
        urgency: 'routine',
        status: 'approved',
        notes: 'Regular transfusion needed'
      },
      {
        patient: patient1._id,
        bloodGroup: 'O+',
        units: 4,
        urgency: 'critical',
        status: 'pending',
        notes: 'Emergency requirement'
      }
    ]);

    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();
