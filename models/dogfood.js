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

const esUrl = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
console.log('🔍 DogFood model - ELASTICSEARCH_URL env var:', process.env.ELASTICSEARCH_URL);
console.log('🔍 DogFood model - Using Elasticsearch URL:', esUrl);

// Create Elasticsearch client and pass it to mongoosastic
const { Client } = require('@elastic/elasticsearch');

const esClient = new Client({
  node: esUrl
});
console.log('🔍 DogFood model - Created ES client with node:', esUrl);

DogFoodSchema.plugin(mongoosastic, {
  esClient
});

module.exports = mongoose.model('DogFood', DogFoodSchema);
