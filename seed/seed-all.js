#!/usr/bin/env node
/**
 * Standalone seeder script that populates MongoDB and Elasticsearch
 * with initial categories, products, and supplies data.
 */

const mongoose = require('mongoose');
const Category = require('../models/category');
const DogFood = require('../models/dogfood');
const Supply = require('../models/supply');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping';

// Categories
const categories = [
  new Category({ title: 'Dog Food', imagepath: 'https://via.placeholder.com/150' }),
  new Category({ title: 'Supplies', imagepath: 'https://via.placeholder.com/150' }),
];

// Dog Foods
const dogfoods = [
  new DogFood({
    imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543460079/Images/7e164e0f-c954-4c54-b0b1-4452e095095a_1.5afd7033e2652476d14f7fdb292b5a88.jpeg-ec507657aaec903c7d27c8cefe8f3d3b10690f01-optim-450x450.jpg',
    title: 'Pedigree',
    description: 'Pedigree is a dog food',
    Price: 14
  }),
  new DogFood({
    imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543458112/Images/93085_MAIN._AC_SL1500_V1517585140_.jpg',
    title: 'Victor',
    description: 'For your Loving Dogs',
    Price: 15
  }),
  new DogFood({
    imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543458113/Images/720238_01.jpg',
    title: 'Victor Plus',
    description: 'Dog Food',
    Price: 38
  }),
  new DogFood({
    imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543458112/Images/71dfImi0EbL._SL1300_.jpg',
    title: 'Milky Bone',
    description: 'Dog snack',
    Price: 40
  }),
  new DogFood({
    imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543458112/Images/71m-5wQYPqL._SL1300_.jpg',
    title: 'Purina',
    description: 'Best Dog Food',
    Price: 42
  }),
  new DogFood({
    imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543458112/Images/81DXdqR4q5L._SL1500_.jpg',
    title: 'Pedigree High Protein',
    description: 'Complete and Balanced Nutrition',
    Price: 45
  }),
];

// Supplies
const supplies = [
  new Supply({
    imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543538654/Images/Bowl.jpg',
    Title: 'Bowl',
    Price: '13'
  }),
  new Supply({
    imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543538612/Images/41kGZSkgfcL._SL500_AC_SS350_.jpg',
    Title: 'Dog Bed',
    Price: '25'
  }),
  new Supply({
    imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543538452/Images/Dog_Bowl.jpg',
    Title: 'Dog Bowl',
    Price: '14'
  }),
  new Supply({
    imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543538654/Images/Dog_Harness.jpg',
    Title: 'Dog Harness',
    Price: '21'
  }),
  new Supply({
    imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543538660/Images/Round_Bowl.jpg',
    Title: 'Round Bowl',
    Price: '31'
  }),
];

async function seed() {
  try {
    console.log('Connecting to MongoDB:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await Category.deleteMany({});
    await DogFood.deleteMany({});
    await Supply.deleteMany({});
    console.log('✅ Cleared existing data');

    // Insert categories
    console.log('Seeding categories...');
    await Category.insertMany(categories);
    console.log(`✅ Inserted ${categories.length} categories`);

    // Insert dog foods (this will also index to Elasticsearch via model hooks)
    console.log('Seeding dog foods...');
    for (const dogfood of dogfoods) {
      await dogfood.save();
    }
    console.log(`✅ Inserted ${dogfoods.length} dog foods`);

    // Insert supplies
    console.log('Seeding supplies...');
    await Supply.insertMany(supplies);
    console.log(`✅ Inserted ${supplies.length} supplies`);

    console.log('\n🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
