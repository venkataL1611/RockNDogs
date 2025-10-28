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

const esHost = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
SuppliesSchema.plugin(mongoosastic, {
  host: esHost.replace('http://', '').split(':')[0],
  port: esHost.includes(':') ? esHost.split(':')[2] || '9200' : '9200'
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
