import 'dotenv/config';
import mongoose from 'mongoose';
import { Vehicle } from '../models/Vehicle.js';
import connectionDB from '../db/connection.js';

const vehicles = [
  {
    vehicleNumber: 'TS09AB1234',
    type: 'bike',
    vehicleBrand: 'Honda',
    vehicleModel: 'CB Shine',
    capacity: { weight: 20, volume: 0.2 },
    registrationExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    insuranceExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
  },
  {
    vehicleNumber: 'TS10CD5678',
    type: 'van',
    vehicleBrand: 'Tata',
    vehicleModel: 'Winger',
    capacity: { weight: 600, volume: 5 },
    registrationExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    insuranceExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
  },
  {
    vehicleNumber: 'TS11EF9012',
    type: 'truck',
    vehicleBrand: 'Ashok Leyland',
    vehicleModel: 'Ecomet',
    capacity: { weight: 8000, volume: 35 },
    registrationExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    insuranceExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
  }
];

async function run() {
  try {
    await connectionDB();
    await Vehicle.deleteMany({});
    await Vehicle.insertMany(vehicles);
    console.log(`Seeded ${vehicles.length} vehicles`);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

run();
