const mongoose = require('mongoose');
const mongoosastic = require('mongoosastic');

// Define Schema
const Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost:27017/shopping', { useNewUrlParser: true });
mongoose.connection.once('open', function() {
    console.log('Connection has been made');
}).on('error', function(error) {
    console.log('Connection error', error);
});

// Create a Schema and a Model
var SuppliesSchema = new Schema({
    imagepath: { type: String, es_type: 'text' },
    Title: { type: String, es_type: 'text' },
    description: { type: String },
    shortDescription: { type: String, es_type: 'text' },
    longDescription: { type: String, es_type: 'text' },
    Price: { type: String, es_type: 'text' }
});

SuppliesSchema.plugin(mongoosastic);

var supplies = mongoose.model('Supplies', SuppliesSchema);
var stream = supplies.synchronize();
var count = 0;

supplies.createMapping(function(err, mapping) {
    if (err) {
        console.log('error creating mapping (you can safely ignore this)');
        console.log(err);
    } else {
        console.log('mapping created!');
        console.log(mapping);
    }
});

module.exports = supplies;