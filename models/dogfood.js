const mongoose = require('mongoose');
const mongoosastic = require('mongoosastic');

// Define Schema
const { Schema } = mongoose;

// DogFood Schema
const DogFoodSchema = new Schema({
  imagepath: {
    type: String,
    es_type: 'text'
  },
  title: {
    type: String,
    es_type: 'text'
  },
  description: {
    type: String,
    es_type: 'text'
  },
  shortDescription: {
    type: String,
    es_type: 'text'
  },
  longDescription: {
    type: String,
    es_type: 'text'
  },
  Price: {
    type: Number,
    es_type: 'double'
  }
});

DogFoodSchema.plugin(mongoosastic);

mongoose.connect('mongodb://localhost:27017/shopping', { useNewUrlParser: true });
mongoose.connection.once('open', function () {
  console.log('Connection has been made');
}).on('error', function (error) {
  console.log('Connection error', error);
});

module.exports = mongoose.model('DogFood', DogFoodSchema);
