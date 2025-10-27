const assert = require('assert');
const mongoose = require('mongoose');

const category = require('../models/category');

const categories = [new category({
  title: 'Dogfood Brands'
}),
new category({
  title: 'Dog Supplies'
})
];

let done = 0;
for (let k = 0; k < categories.length; k++) {
  categories[k].save().then(function () {
    assert(!categories.isNew);
    done++;
    if (done === categories.length) {
      console.log('Categories seeded successfully!');
      mongoose.disconnect();
    }
  }).catch(function (err) {
    console.error('Error seeding categories:', err);
    mongoose.disconnect();
  });
}
