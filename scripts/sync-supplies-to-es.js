const Supply = require('../models/supply');

console.log('Starting supply synchronization to Elasticsearch...');

// Wait for connection then synchronize
setTimeout(async () => {
  try {
    const count = await Supply.countDocuments();
    console.log(`Found ${count} supplies in MongoDB`);
    
    // Synchronize all supplies to Elasticsearch
    const stream = Supply.synchronize();
    let syncCount = 0;

    stream.on('data', function() {
      syncCount++;
      process.stdout.write(`\rSynced ${syncCount} supplies...`);
    });

    stream.on('close', function() {
      console.log('\n✅ All supplies synchronized to Elasticsearch!');
      process.exit(0);
    });

    stream.on('error', function(err) {
      console.error('\n❌ Error during synchronization:', err);
      process.exit(1);
    });

  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}, 1000);
