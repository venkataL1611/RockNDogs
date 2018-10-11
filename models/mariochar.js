const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mocha=require('mocha');
mongoose.Promise=global.Promise;
before(function(done){
    mongoose.connect('mongodb://localhost:27017/dog');
    mongoose.connection.once('open',function(){
        console.log('Connection has been made');
        done();
    }).on('error',function(error){
        console.log('Connection error',error);
    });

});

// Create a Schema and a Model

const MarioDogSchema = new Schema({
    name: String,
    weight: Number
});

const MarioDog = mongoose.model('mariochar', MarioDogSchema);

module.exports = MarioDog;