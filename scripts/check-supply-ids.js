const Supply = require('../models/supply');

setTimeout(async () => {
  try {
    const supplies = await Supply.find().limit(3);
    console.log('\n=== Sample Supplies ===\n');

    supplies.forEach((s) => {
      console.log('Title:', s.Title);
      console.log('ID:', s._id);
      console.log('Short Description:', s.shortDescription);
      console.log('Long Description:', s.longDescription ? `${s.longDescription.substring(0, 80)}...` : 'N/A');
      console.log(`Detail URL: /product/supply/${s._id}`);
      console.log('---');
    });
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}, 1000);
