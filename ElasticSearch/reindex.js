/**
 * Re-index all products from MongoDB to Elasticsearch
 * This ensures _id consistency between MongoDB and ES
 */

const mongoose = require('mongoose');
const client = require('./connection');
const DogFood = require('../models/dogfood');
const Supply = require('../models/supply');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping');

async function reindexDogFoods() {
  console.log('🔄 Re-indexing dog foods...');

  try {
    // Delete existing index
    await client.indices.delete({ index: 'dogfoods' }).catch(() => {
      console.log('No existing dogfoods index to delete');
    });

    // Create new index
    await client.indices.create({ index: 'dogfoods' });
    console.log('✅ Created dogfoods index');

    // Get all dog foods from MongoDB
    const dogfoods = await DogFood.find().lean().exec();
    console.log(`Found ${dogfoods.length} dog foods in MongoDB`);

    // Index each document using Promise.all for better performance
    await Promise.all(dogfoods.map(async (dog) => {
      await client.index({
        index: 'dogfoods',
        id: dog._id.toString(), // Use MongoDB _id as ES _id
        body: {
          title: dog.title,
          description: dog.description,
          Price: dog.Price,
          imagepath: dog.imagepath
        }
      });
      console.log(`  ✓ Indexed: ${dog.title} (${dog._id})`);
      return dog;
    }));

    // Refresh index to make documents searchable
    await client.indices.refresh({ index: 'dogfoods' });
    console.log('✅ Dog foods re-indexed successfully');
  } catch (err) {
    console.error('❌ Error re-indexing dog foods:', err);
  }
}

async function reindexSupplies() {
  console.log('🔄 Re-indexing supplies...');

  try {
    // Delete existing index
    await client.indices.delete({ index: 'supplies' }).catch(() => {
      console.log('No existing supplies index to delete');
    });

    // Create new index
    await client.indices.create({ index: 'supplies' });
    console.log('✅ Created supplies index');

    // Get all supplies from MongoDB
    const supplies = await Supply.find().lean().exec();
    console.log(`Found ${supplies.length} supplies in MongoDB`);

    // Index each document using Promise.all for better performance
    await Promise.all(supplies.map(async (supply) => {
      await client.index({
        index: 'supplies',
        id: supply._id.toString(), // Use MongoDB _id as ES _id
        body: {
          Title: supply.Title,
          description: supply.description,
          Price: supply.Price,
          imagepath: supply.imagepath
        }
      });
      console.log(`  ✓ Indexed: ${supply.Title} (${supply._id})`);
      return supply;
    }));

    // Refresh index to make documents searchable
    await client.indices.refresh({ index: 'supplies' });
    console.log('✅ Supplies re-indexed successfully');
  } catch (err) {
    console.error('❌ Error re-indexing supplies:', err);
  }
}

async function main() {
  console.log('🚀 Starting Elasticsearch re-indexing...\n');

  await reindexDogFoods();
  console.log('');
  await reindexSupplies();

  console.log('\n✨ Re-indexing complete!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
