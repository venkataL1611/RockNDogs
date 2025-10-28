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

const esHost = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
CategorySchema.plugin(mongoosastic, {
  host: esHost.replace('http://', '').split(':')[0],
  port: esHost.includes(':') ? esHost.split(':')[2] || '9200' : '9200'
});

module.exports = mongoose.model('Category', CategorySchema);
