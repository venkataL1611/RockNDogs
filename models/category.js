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

const esUrl = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
const { Client } = require('@elastic/elasticsearch');

const esClient = new Client({
  node: esUrl
});

CategorySchema.plugin(mongoosastic, {
  esClient
});

module.exports = mongoose.model('Category', CategorySchema);
