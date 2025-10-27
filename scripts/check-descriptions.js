const mongoose = require('mongoose');
const DogFood = require('../models/dogfood');
const Supply = require('../models/supply');

setTimeout(async () => {
  try {
    // Check one dogfood
    const dogfood = await DogFood.findOne({ title: 'Pedigree' });
    console.log('\n=== Pedigree (DogFood) ===');
    console.log('Title:', dogfood.title);
    console.log('Description:', dogfood.description);
    console.log('Short Description:', dogfood.shortDescription);
    console.log('Long Description:', dogfood.longDescription ? dogfood.longDescription.substring(0, 100) + '...' : 'N/A');
    
    // Check one supply
    const supply = await Supply.findOne({ Title: 'Bowl' });
    console.log('\n=== Bowl (Supply) ===');
    console.log('Title:', supply.Title);
    console.log('Description:', supply.description);
    console.log('Short Description:', supply.shortDescription);
    console.log('Long Description:', supply.longDescription ? supply.longDescription.substring(0, 100) + '...' : 'N/A');
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
}, 1000);
