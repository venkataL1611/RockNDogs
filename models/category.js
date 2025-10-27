const mongoose = require('mongoose');
const mongoosastic = require('mongoosastic');

// Category Schema
const CategorySchema = new mongoose.Schema({

  title: {
    type: String,
    es_type: 'text'
  },
  slug: {
    type: String,
    es_type: 'text'
  }

});

CategorySchema.plugin(mongoosastic);

mongoose.connect('mongodb://localhost:27017/dog', { useNewUrlParser: true });
mongoose.connection.once('open', function () {
  console.log('Connection has been made');
  // done();
}).on('error', function (error) {
  console.log('Connection error', error);
});

module.exports = mongoose.model('Category', CategorySchema);
