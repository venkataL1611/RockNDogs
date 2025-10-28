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
const esUrlParts = new URL(esUrl);
CategorySchema.plugin(mongoosastic, {
  host: esUrlParts.hostname,
  port: esUrlParts.port || '9200',
  protocol: esUrlParts.protocol.replace(':', '')
});

module.exports = mongoose.model('Category', CategorySchema);
