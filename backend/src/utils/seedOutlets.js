/**
 * Outlet seeder — generates a grid of outlets spaced ~20km apart
 * Default region: Bangalore metro area.
 * Usage: node src/utils/seedOutlets.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Outlet from '../models/Outlet.js';

dotenv.config();

// Bounding box for Bangalore metro area
const REGION = {
  name: 'Bangalore',
  latMin: 12.80,
  latMax: 13.15,
  lngMin: 77.45,
  lngMax: 77.80,
};

// ~20 km spacing in degrees (approx 0.18° lat, 0.20° lng at this latitude)
const LAT_STEP = 0.18;
const LNG_STEP = 0.20;

const seedOutlets = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pizzahub');
    console.log('Connected to database for outlet seeding...');

    await Outlet.deleteMany();
    console.log('Existing outlets cleared.');

    const outlets = [];
    let counter = 1;

    for (let lat = REGION.latMin; lat <= REGION.latMax; lat += LAT_STEP) {
      for (let lng = REGION.lngMin; lng <= REGION.lngMax; lng += LNG_STEP) {
        outlets.push({
          name: `PizzaHub ${REGION.name} #${counter}`,
          location: {
            lat: Math.round(lat * 10000) / 10000,
            lng: Math.round(lng * 10000) / 10000,
          },
          address: `${REGION.name} Zone ${counter}`,
          serviceRadiusKm: 20,
          isActive: true,
        });
        counter++;
      }
    }

    const created = await Outlet.insertMany(outlets);
    console.log(`${created.length} outlets seeded in ${REGION.name} region.`);
    created.forEach((o) => console.log(`  - ${o.name} @ (${o.location.lat}, ${o.location.lng})`));

    process.exit(0);
  } catch (error) {
    console.error('Error seeding outlets:', error.message);
    process.exit(1);
  }
};

seedOutlets();
