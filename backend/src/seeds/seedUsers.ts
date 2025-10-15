import 'dotenv/config';
import mongoose from 'mongoose';
import connectionDB from '../db/connection.js';
import { User } from '../models/User.js';

const users = [
  { name: 'Admin One', email: 'admin@logileet.com', password: 'Admin@123', phone: '9876543210', role: 'admin' },
  { name: 'Driver One', email: 'driver@logileet.com', password: 'Driver@123', phone: '9876543211', role: 'driver', licenseNumber: 'DL-DR1-2028', licenseExpiry: new Date(Date.now() + 700 * 24 * 60 * 60 * 1000) },
  { name: 'Customer One', email: 'customer@logileet.com', password: 'Customer@123', phone: '9876543212', role: 'customer', address: 'Gachibowli, Hyderabad' }
];

async function run() {
  try {
    await connectionDB();
    await User.deleteMany({});
    await User.insertMany(users);
    console.log(`Seeded ${users.length} users`);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

run();
