const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping', { useNewUrlParser: true });

mongoose.connection.once('open', async function () {
  console.log('Connected to MongoDB - shopping database\n');

  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections in shopping database:');
    collections.forEach((col) => console.log(`  - ${col.name}`));

    console.log('\nDocument counts:');
    for (const col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      console.log(`  ${col.name}: ${count} documents`);
    }

    console.log('\nData verification complete!');
    mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
    mongoose.disconnect();
  }
}).on('error', function (error) {
  console.log('Connection error:', error);
  mongoose.disconnect();
});
