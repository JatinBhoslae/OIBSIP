import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import Outlet from './models/Outlet.js';

/**
 * Mumbai spans roughly from 18.89°N to 19.27°N (latitude) and 72.77°E to 72.98°E (longitude).
 * The city is approximately 60km north-south and 20km east-west.
 * We place one outlet every ~20km across the metro area.
 */
const mumbaiOutlets = [
  // South Mumbai
  { name: 'PizzaHub - Colaba', address: 'Colaba Causeway, Colaba, Mumbai 400005', lat: 18.9067, lng: 72.8147 },
  { name: 'PizzaHub - Churchgate', address: 'Veer Nariman Rd, Churchgate, Mumbai 400020', lat: 18.9352, lng: 72.8268 },
  // Central Mumbai
  { name: 'PizzaHub - Dadar', address: 'Dadar TT Circle, Dadar West, Mumbai 400028', lat: 19.0178, lng: 72.8478 },
  { name: 'PizzaHub - Bandra', address: 'Hill Road, Bandra West, Mumbai 400050', lat: 19.0544, lng: 72.8361 },
  { name: 'PizzaHub - Andheri', address: 'SV Road, Andheri West, Mumbai 400058', lat: 19.1197, lng: 72.8464 },
  // North Mumbai
  { name: 'PizzaHub - Borivali', address: 'LT Road, Borivali West, Mumbai 400092', lat: 19.2303, lng: 72.8567 },
  // Navi Mumbai / East
  { name: 'PizzaHub - Vashi', address: 'Sector 17, Vashi, Navi Mumbai 400703', lat: 19.0771, lng: 72.9986 },
  { name: 'PizzaHub - Thane', address: 'Gokhale Road, Thane West 400602', lat: 19.1860, lng: 72.9564 },
  // West
  { name: 'PizzaHub - Juhu', address: 'Juhu Tara Road, Juhu, Mumbai 400049', lat: 19.0948, lng: 72.8268 },
];

async function seedOutlets() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    for (const outlet of mumbaiOutlets) {
      const exists = await Outlet.findOne({ name: outlet.name });
      if (exists) {
        console.log(`Outlet already exists: ${outlet.name}`);
        continue;
      }

      await Outlet.create({
        name: outlet.name,
        location: { lat: outlet.lat, lng: outlet.lng },
        address: outlet.address,
        serviceRadiusKm: 20,
        isActive: true,
        managerName: 'Store Manager',
        contactPhone: '022-' + Math.floor(10000000 + Math.random() * 90000000),
      });
      console.log(`Outlet created: ${outlet.name}`);
    }

    console.log('\nOutlet seeding complete!');
  } catch (error) {
    console.error('Outlet seeding failed:', error);
  } finally {
    process.exit(0);
  }
}

seedOutlets();
