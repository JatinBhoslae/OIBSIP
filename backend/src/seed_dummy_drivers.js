import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import User from './models/User.js';
import DeliveryPartner from './models/DeliveryPartner.js';

const dummyDrivers = [
  { name: 'Ramesh Kumar', email: 'ramesh@pizzahub.com', phone: '9988776655', vehicleType: 'Bike', vehicleNumber: 'MH-12-AB-1234', location: { lat: 19.0760, lng: 72.8777 } },
  { name: 'Suresh Singh', email: 'suresh@pizzahub.com', phone: '9988776656', vehicleType: 'Scooter', vehicleNumber: 'MH-14-CD-5678', location: { lat: 19.0790, lng: 72.8800 } },
  { name: 'Abdul Khan', email: 'abdul@pizzahub.com', phone: '9988776657', vehicleType: 'Bike', vehicleNumber: 'MH-02-EF-9012', location: { lat: 19.0820, lng: 72.8750 } },
  { name: 'Mahesh Patil', email: 'mahesh@pizzahub.com', phone: '9988776658', vehicleType: 'Scooter', vehicleNumber: 'MH-04-GH-3456', location: { lat: 19.0720, lng: 72.8710 } },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    for (const driver of dummyDrivers) {
      let user = await User.findOne({ email: driver.email });
      if (!user) {
        user = await User.create({
          name: driver.name,
          email: driver.email,
          password: 'password123',
          role: 'delivery_partner',
          phone: driver.phone
        });
        console.log(`User created: ${driver.email}`);
      }

      let partner = await DeliveryPartner.findOne({ user: user._id });
      if (!partner) {
        partner = await DeliveryPartner.create({
          user: user._id,
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
          employeeId: 'DP-' + Math.floor(10000 + Math.random() * 90000),
          vehicleType: driver.vehicleType,
          vehicleNumber: driver.vehicleNumber,
          status: 'ACTIVE',
          availabilityStatus: 'AVAILABLE',
          currentLocation: driver.location
        });
        console.log(`Delivery Partner created: ${driver.name}`);
      } else {
        console.log(`Delivery Partner already exists: ${driver.name}`);
      }
    }
    console.log('Seeding complete.');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    process.exit(0);
  }
}

seed();
