const mocha=require('mocha');
const assert=require('assert');

const canine= require('../models/dogfood');

// Describe our tests
describe('Saving products', function(){
    this.timeout(500);
    // Create tests
    it('Saves a record to the database', function(done){
        setTimeout(done, 300);
        const diet = [new canine({
            imagepath: 'https://ll-us-i5.wal.co/asr/7e164e0f-c954-4c54-b0b1-4452e095095a_1.5afd7033e2652476d14f7fdb292b5a88.jpeg-ec507657aaec903c7d27c8cefe8f3d3b10690f01-optim-450x450.jpg?odnBg=FFFFFF',
            title:'Pedigree',
            description:'Staple Dog Food',
            Price:14
        }),
            new canine({
                imagepath: 'https://images-na.ssl-images-amazon.com/images/I/91XGABFtSOL._SY679_.jpg',
                title:'Cake mix',
                description:'Dog Cake mix',
                Price:20
            })
        ];
        for(var k=0;k<diet.length;k++)
        {
            diet[k].save().then(function(){
                assert(!diet.isNew);
                done();
            });
        };

    });

});


/*var Products=require('../models/product');

 describe('Saving Records',function(){
     this.timeout(500);
    it('Save Record to the database',function(done){
        setTimeout(done, 300);
        var dogfood =[new Products(
            {
                imagePath: 'https://ll-us-i5.wal.co/asr/7e164e0f-c954-4c54-b0b1-4452e095095a_1.5afd7033e2652476d14f7fdb292b5a88.jpeg-ec507657aaec903c7d27c8cefe8f3d3b10690f01-optim-450x450.jpg?odnBg=FFFFFF',
                title: 'Pedigree',
                description: 'Is a dog food',
                price: 14
            }),
            new Products(
                {
                    imagePath: 'https://images-na.ssl-images-amazon.com/images/I/91XGABFtSOL._SY679_.jpg',
                    title: 'Cake mix',
                    description: 'Is a dog food',
                    price: 18
                })
        ];
        for(var i=0;i< dogfood.length;i++){
            dogfood[i].save().then(function() {
                assert(!dogfood.isNew);
                done();
        });

         };

    });
  });
*/