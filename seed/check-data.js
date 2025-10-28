const mongoose = require('mongoose');
const canine = require('../models/dogfood');
const supplies = require('../models/supply');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping', { useNewUrlParser: true });

mongoose.connection.once('open', async function () {
  console.log('Connected to MongoDB\n');

  console.log('=== DOG FOOD PRODUCTS ===');
  const dogfoods = await canine.find().limit(2);
  dogfoods.forEach((item, idx) => {
    console.log(`\nProduct ${idx + 1}:`);
    console.log('  imagepath:', item.imagepath);
    console.log('  title:', item.title);
    console.log('  description:', item.description);
    console.log('  Price:', item.Price);
  });

  console.log('\n\n=== DOG SUPPLIES ===');
  const suppliesData = await supplies.find().limit(2);
  suppliesData.forEach((item, idx) => {
    console.log(`\nSupply ${idx + 1}:`);
    console.log('  imagepath:', item.imagepath);
    console.log('  Title:', item.Title);
    console.log('  Price:', item.Price);
  });

  mongoose.disconnect();
}).on('error', function (error) {
  console.log('Connection error:', error);
});
