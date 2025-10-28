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

const esHost = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
DogFoodSchema.plugin(mongoosastic, {
  host: esHost.replace('http://', '').split(':')[0],
  port: esHost.includes(':') ? esHost.split(':')[2] || '9200' : '9200'
});

module.exports = mongoose.model('DogFood', DogFoodSchema);
