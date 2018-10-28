var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mocha=require('mocha');
//mongoose.Promise=global.Promise;
//(function(done){
    mongoose.connect('mongodb://localhost:27017/dog');
    mongoose.connection.once('open',function(){
        console.log('Connection has been made');
        //done();
    }).on('error',function(error){
        console.log('Connection error',error);
    });

//});

// Create a Schema and a Model

var DogfoodSchema = new Schema({
    imagepath: String,
    title: String,
    description:String,
    Price: String
});

var canine = mongoose.model('Canine', DogfoodSchema);

module.exports = canine;