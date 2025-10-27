#!/usr/bin/env node

/**
 * Database Restore Script
 * Clears test data and restores original production data
 */

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping';

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Connected to MongoDB for restoration');
}).catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

const DogFood = require('../models/dogfood');
const Supply = require('../models/supply');

// Original 12 dog food products
const dogfoods = [
  {
    imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543460079/Images/7e164e0f-c954-4c54-b0b1-4452e095095a_1.5afd7033e2652476d14f7fdb292b5a88.jpeg-ec507657aaec903c7d27c8cefe8f3d3b10690f01-optim-450x450.jpg',
    title: 'Pedigree',
    description: 'Pedigree is a dog food',
    shortDescription: 'Quality dog food for all breeds',
    longDescription: 'Pedigree provides complete and balanced nutrition for your dog with real meat and wholesome grains.',
    Price: 14
  },
  {
    imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543458112/Images/93085_MAIN._AC_SL1500_V1517585140_.jpg',
    title: 'Victor',
    description: 'For your Loving Dogs',
    shortDescription: 'Premium nutrition for active dogs',
    longDescription: 'Victor dog food provides superior nutrition for active dogs with high-quality ingredients.',
    Price: 15
  },
  {
    imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543458113/Images/720238_01.jpg',
    title: 'Victor Plus',
    description: 'Dog Food',
    shortDescription: 'Enhanced formula for all life stages',
    longDescription: 'Victor Plus is formulated for dogs of all life stages with added vitamins and minerals.',
    Price: 38
  },
  {
    imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543458112/Images/71dfImi0EbL._SL1300_.jpg',
    title: 'Milky Bone',
    description: 'Dog snack',
    shortDescription: 'Delicious treats for good dogs',
    longDescription: 'Milky Bone treats are perfect rewards for training and bonding with your furry friend.',
    Price: 40
  },
  {
    imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543458113/Images/101788_MAIN._AC_SL1500_V1523894614_.jpg',
    title: 'Victor Premium',
    description: 'Premium Quality Dog Food',
    shortDescription: 'Top-tier nutrition for your pet',
    longDescription: 'Victor Premium offers the highest quality ingredients for optimal canine health and vitality.',
    Price: 35
  },
  {
    imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543458116/Images/dog-food-brands-petsmart.jpg',
    title: 'Drools',
    description: 'Rich in Protein',
    shortDescription: 'High protein formula',
    longDescription: 'Drools dog food is rich in protein to support muscle development and overall health.',
    Price: 25
  },
  {
    imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543458112/Images/516TX9BDv-L._US500_.jpg',
    title: 'Sensitive Stomach',
    description: 'Lite Dog Food',
    shortDescription: 'Gentle formula for sensitive dogs',
    longDescription: 'Specially formulated for dogs with sensitive stomachs and digestive issues.',
    Price: 28
  },
  {
    imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543458115/Images/Blue-Buffalo-1.jpg',
    title: 'Wilderness',
    description: 'Natural Evolutionary Diet',
    shortDescription: 'Grain-free natural formula',
    longDescription: 'Wilderness provides a natural evolutionary diet inspired by what dogs ate in the wild.',
    Price: 45
  },
  {
    imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543458112/Images/8Apmj912_400x400.jpg',
    title: 'Pup Peroni',
    description: 'Original Beef Flavour',
    shortDescription: 'Tasty beef-flavored treats',
    longDescription: 'Pup Peroni Original Beef Flavour treats are loved by dogs everywhere.',
    Price: 10
  },
  {
    imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543458115/Images/alpo_vs_bfbcnchpb_r_325x493.png',
    title: 'Alpho Variety Snacks',
    description: 'Dog Snacks',
    shortDescription: 'Variety pack of delicious snacks',
    longDescription: 'Alpho Variety Snacks offer different flavors to keep your dog excited at treat time.',
    Price: 30
  },
  {
    imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543458112/Images/91XGABFtSOL._SY679_.jpg',
    title: 'Cake Mix',
    description: 'Dog Cake',
    shortDescription: 'Celebrate with your pet',
    longDescription: 'Dog Cake Mix makes it easy to bake a special birthday cake for your beloved pet.',
    Price: 50
  },
  {
    imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543458114/Images/0001901470090_A.jpg',
    title: 'IAMS',
    description: 'MINI CHUNKS',
    shortDescription: 'Perfect bite-sized pieces',
    longDescription: 'IAMS Mini Chunks provide complete nutrition in perfect bite-sized pieces for small dogs.',
    Price: 40
  }
];

// Original 11 supply products
const supplies = [
  {
    imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543538654/Images/Bowl.jpg',
    Title: 'Bowl',
    description: 'Durable feeding bowl',
    shortDescription: 'Essential feeding bowl',
    longDescription: 'High-quality feeding bowl perfect for daily meals and water.',
    Price: '13'
  },
  {
    imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543538612/Images/41kGZSkgfcL._SL500_AC_SS350_.jpg',
    Title: 'Dog Bed',
    description: 'Comfortable dog bed',
    shortDescription: 'Cozy resting place',
    longDescription: 'Comfortable dog bed provides a cozy resting place for your furry friend.',
    Price: '25'
  },
  {
    imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543538452/Images/Dog_Bowl.jpg',
    Title: 'Dog Bowl',
    description: 'Stainless steel dog bowl',
    shortDescription: 'Durable stainless steel',
    longDescription: 'Durable stainless steel bowl with non-slip base for mess-free feeding.',
    Price: '14'
  },
  {
    imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543538654/Images/Dog_Harness.jpg',
    Title: 'Dog Harness',
    description: 'Adjustable dog harness',
    shortDescription: 'Comfortable walking harness',
    longDescription: 'Adjustable dog harness for comfortable and safe walks with your pet.',
    Price: '21'
  },
  {
    imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543538660/Images/Round_Bowl.jpg',
    Title: 'Round Bowl',
    description: 'Round feeding bowl',
    shortDescription: 'Classic round design',
    longDescription: 'Classic round bowl design perfect for feeding and watering your pet.',
    Price: '31'
  },
  {
    imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543538655/Images/Large_Harness.jpg',
    Title: 'Large Harness',
    description: 'Heavy-duty large harness',
    shortDescription: 'For bigger dogs',
    longDescription: 'Heavy-duty large harness designed for bigger dogs with extra support.',
    Price: '19'
  },
  {
    imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543538656/Images/Net_Harness.jpg',
    Title: 'Net Harness',
    description: 'Breathable mesh harness',
    shortDescription: 'Lightweight and breathable',
    longDescription: 'Breathable mesh harness keeps your dog cool during summer walks.',
    Price: '24'
  },
  {
    imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543538654/Images/Dog_Frisbee.jpg',
    Title: 'Dog Frisbee',
    description: 'Flying disc toy',
    shortDescription: 'Active play toy',
    longDescription: 'Durable flying disc perfect for active play and exercise with your dog.',
    Price: '34'
  },
  {
    imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543538655/Images/Harness.jpg',
    Title: 'Harness',
    description: 'Standard dog harness',
    shortDescription: 'Reliable everyday harness',
    longDescription: 'Standard dog harness for reliable everyday use and comfortable walks.',
    Price: '26'
  },
  {
    imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543538654/Images/Dog_Toy.jpg',
    Title: 'Dog Toy',
    description: 'Interactive dog toy',
    shortDescription: 'Fun and engaging',
    longDescription: 'Interactive toy keeps your dog entertained and mentally stimulated.',
    Price: '9'
  },
  {
    imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543538656/Images/Nerf_Dog.jpg',
    Title: 'Nerf Dog',
    description: 'Nerf brand dog toy',
    shortDescription: 'Durable Nerf toy',
    longDescription: 'Durable Nerf brand toy designed for active play and fetch games.',
    Price: '20'
  }
];

async function restoreDatabase() {
  try {
    console.log('🗑️  Clearing existing data...');
    await DogFood.deleteMany({});
    await Supply.deleteMany({});
    console.log('✅ Cleared all existing products');

    console.log('🌱 Restoring dog food products...');
    const insertedDogFoods = await DogFood.insertMany(dogfoods);
    console.log(`✅ Restored ${insertedDogFoods.length} dog food products`);

    console.log('🌱 Restoring supply products...');
    const insertedSupplies = await Supply.insertMany(supplies);
    console.log(`✅ Restored ${insertedSupplies.length} supply products`);

    console.log('');
    console.log('✨ Database restoration complete!');
    console.log(`📦 Total products: ${insertedDogFoods.length + insertedSupplies.length}`);
    console.log(`   - Dog Foods: ${insertedDogFoods.length}`);
    console.log(`   - Supplies: ${insertedSupplies.length}`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error restoring database:', err);
    process.exit(1);
  }
}

// Wait a bit for MongoDB connection to stabilize
setTimeout(restoreDatabase, 1000);
