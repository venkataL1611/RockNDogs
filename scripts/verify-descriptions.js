const mongoose = require('mongoose');
const DogFood = require('../models/dogfood');
const Supply = require('../models/supply');

setTimeout(async () => {
  try {
    console.log('Checking detailed descriptions...\n');
    
    // Check dogfoods
    const dogfoods = await DogFood.find().limit(3).lean().exec();
    console.log('=== Dog Foods (first 3) ===');
    dogfoods.forEach(d => {
      console.log(`\n${d.title}:`);
      console.log(`  Has detailedDescription: ${!!d.detailedDescription}`);
      if(d.detailedDescription) {
        console.log(`  Length: ${d.detailedDescription.length} chars`);
        console.log(`  Preview: ${d.detailedDescription.substring(0, 100)}...`);
      }
    });
    
    // Check supplies
    const supplies = await Supply.find().limit(3).lean().exec();
    console.log('\n\n=== Supplies (first 3) ===');
    supplies.forEach(s => {
      console.log(`\n${s.Title}:`);
      console.log(`  Has detailedDescription: ${!!s.detailedDescription}`);
      if(s.detailedDescription) {
        console.log(`  Length: ${s.detailedDescription.length} chars`);
        console.log(`  Preview: ${s.detailedDescription.substring(0, 100)}...`);
      }
    });
    
    console.log('\n\nVerification complete!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    mongoose.disconnect();
  }
}, 800);
