#!/usr/bin/env node

/**
 * Seed test data for E2E tests
 * This ensures the database has products for testing
 */

const mongoose = require('mongoose');

// IMPORTANT: Use TEST database, not production!
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping_test';

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Connected to TEST database for seeding');
  console.log(`📍 Database: ${MONGODB_URI}`);
}).catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

const DogFood = require('../models/dogfood');
const Supply = require('../models/supply');

const dogfoods = [
  {
    imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543460079/Images/7e164e0f-c954-4c54-b0b1-4452e095095a_1.5afd7033e2652476d14f7fdb292b5a88.jpeg-ec507657aaec903c7d27c8cefe8f3d3b10690f01-optim-450x450.jpg',
    title: 'Pedigree',
    description: 'Pedigree is a dog food',
    shortDescription: 'Quality dog food for all breeds',
    longDescription: 'Pedigree provides complete and balanced nutrition for your dog.',
    Price: 14
  },
  {
    imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543458112/Images/93085_MAIN._AC_SL1500_V1517585140_.jpg',
    title: 'Victor',
    description: 'For your Loving Dogs',
    shortDescription: 'Premium nutrition for active dogs',
    longDescription: 'Victor dog food provides superior nutrition for active dogs.',
    Price: 15
  },
  {
    imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543458113/Images/720238_01.jpg',
    title: 'Victor Plus',
    description: 'Dog Food',
    shortDescription: 'Enhanced formula for all life stages',
    longDescription: 'Victor Plus is formulated for dogs of all life stages.',
    Price: 38
  }
];

const supplies = [
  {
    imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543458113/Images/81p3McADGTL._SL1500_.jpg',
    Title: 'Dog Leash',
    description: 'Durable dog leash',
    shortDescription: 'Strong and comfortable leash',
    longDescription: 'High-quality leash for daily walks with your dog.',
    Price: '12.99'
  },
  {
    imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543458114/Images/71kNk8H3p7L._SL1500_.jpg',
    Title: 'Dog Bowl',
    description: 'Stainless steel dog bowl',
    shortDescription: 'Non-slip feeding bowl',
    longDescription: 'Durable stainless steel bowl with non-slip base.',
    Price: '8.99'
  },
  {
    imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543458115/Images/71dfImi0EbL._SL1300_.jpg',
    Title: 'Dog Toy',
    description: 'Interactive dog toy',
    shortDescription: 'Fun toy for active play',
    longDescription: 'Engaging toy that keeps your dog entertained for hours.',
    Price: '15.99'
  }
];

async function seedData() {
  try {
    // Clear existing data
    console.log('🧹 Clearing existing test data...');
    await DogFood.deleteMany({});
    await Supply.deleteMany({});

    // Insert dogfoods
    console.log('🌱 Seeding dogfoods...');
    const insertedDogFoods = await DogFood.insertMany(dogfoods);
    console.log(`✅ Seeded ${insertedDogFoods.length} dogfoods`);

    // Insert supplies
    console.log('🌱 Seeding supplies...');
    const insertedSupplies = await Supply.insertMany(supplies);
    console.log(`✅ Seeded ${insertedSupplies.length} supplies`);

    console.log('✨ Test data seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding data:', err);
    process.exit(1);
  }
}

// Wait a bit for MongoDB connection to stabilize
setTimeout(seedData, 1000);
