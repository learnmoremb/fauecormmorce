require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User.model');

const ADMIN = {
  name: 'ShopZone Admin',
  email: 'admin@shopzone.com',
  password: 'Admin@123456',
  role: 'admin',
  phone: '+1000000000',
};

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ email: ADMIN.email });
  if (existing) {
    console.log('Admin already exists:', existing.email);
    process.exit(0);
  }

  const admin = await User.create(ADMIN);
  console.log('✓ Admin user created');
  console.log('  Email   :', admin.email);
  console.log('  Password: Admin@123456');
  console.log('  Role    :', admin.role);
  process.exit(0);
}

seed().catch(err => { console.error('Seed failed:', err.message); process.exit(1); });
