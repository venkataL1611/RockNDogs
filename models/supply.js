const mongoose = require('mongoose');
const mongoosastic = require('mongoosastic');

// Define Schema
const { Schema } = mongoose;

// Create a Schema and a Model
const SuppliesSchema = new Schema({
  imagepath: { type: String, es_type: 'text' },
  Title: { type: String, es_type: 'text' },
  description: { type: String },
  shortDescription: { type: String, es_type: 'text' },
  longDescription: { type: String, es_type: 'text' },
  Price: { type: String, es_type: 'text' }
});

const esUrl = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
const elasticsearch = require('elasticsearch');
const esClient = new elasticsearch.Client({
  host: esUrl,
  log: 'error'
});

SuppliesSchema.plugin(mongoosastic, {
  esClient: esClient
});

const supplies = mongoose.model('Supplies', SuppliesSchema);

supplies.createMapping(function (err, mapping) {
  if (err) {
    console.log('error creating mapping (you can safely ignore this)');
    console.log(err);
  } else {
    console.log('mapping created!');
    console.log(mapping);
  }
});

module.exports = supplies;
