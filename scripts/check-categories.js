const mongoose = require('mongoose');
const Category = require('../models/category');

mongoose.connect('mongodb://localhost:27017/shopping', { useNewUrlParser: true });

setTimeout(async () => {
  try {
    const cats = await Category.find().exec();
    console.log('Total categories:', cats.length);
    cats.forEach(c => console.log('  -', c.title, '(ID:', c._id + ')'));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    mongoose.disconnect();
  }
}, 500);
