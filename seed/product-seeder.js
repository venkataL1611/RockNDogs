var mocha=require('mocha');
var assert=require('assert');
var mongoose=require('mongoose');

var canine= require('../models/dogfood');

var diets = [
            new canine({
                imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543460079/Images/7e164e0f-c954-4c54-b0b1-4452e095095a_1.5afd7033e2652476d14f7fdb292b5a88.jpeg-ec507657aaec903c7d27c8cefe8f3d3b10690f01-optim-450x450.jpg',
                title: 'Pedigree',
                description: 'Pedigree is a dog food',
                Price: 14
            }),
            new canine({
                imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543458112/Images/93085_MAIN._AC_SL1500_V1517585140_.jpg',
                title: 'Victor',
                description: 'For your Loving Dogs',
                Price: 15
            }),
            new canine({
                imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543458113/Images/720238_01.jpg',
                title: 'Victor Plus',
                description: 'Dog Food',
                Price: 38
            }),

            new canine({
                imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543458112/Images/71dfImi0EbL._SL1300_.jpg',
                title: 'Milky Bone',
                description: 'Dog snack',
                Price: 40
            }),
            new canine({
                imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543458113/Images/101788_MAIN._AC_SL1500_V1523894614_.jpg',
                title: 'Victor Premium',
                description: 'Premium Quality Dog Food',
                Price: 35
            }),
            new canine({
                imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543458116/Images/dog-food-brands-petsmart.jpg',
                title: 'Drools',
                description: 'Rich in Protein',
                Price: 25
            }),
            new canine({
                imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543458112/Images/516TX9BDv-L._US500_.jpg',
                title: 'Sensitive Stomach',
                description: 'Lite Dog Food',
                Price: 28
            }),
            new canine({
                imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543458115/Images/Blue-Buffalo-1.jpg',
                title: 'Wilderness',
                description: 'Natural Evolutionary Diet',
                Price: 45
            }),
            new canine({
                imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543458112/Images/8Apmj912_400x400.jpg',
                title: 'Pup Peroni',
                description: 'Original Beef Flavour',
                Price: 10
            }),
            new canine({
                imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543458115/Images/alpo_vs_bfbcnchpb_r_325x493.png',
                title: 'Alpho Variety Snacks',
                description: 'Dog Snacks',
                Price: 30
            }),
            new canine({
                imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543458112/Images/91XGABFtSOL._SY679_.jpg',
                title: 'Cake Mix',
                description: 'Dog Cake',
                Price: 50
            }),
            new canine({
                imagepath: 'https://res.cloudinary.com/dcmgqkay2/image/upload/v1543458114/Images/0001901470090_A.jpg',
                title: 'IAMS',
                description: 'MINI CHUNKS',
                Price: 40
            })

    ];
    
    var done = 0;
    for(var k=0;k<diets.length;k++)
    {
        diets[k].save().then(function() {
            assert(!diets.isNew);
            done++;
            if(done === diets.length) {
                console.log('Dog food products seeded successfully!');
                mongoose.disconnect();
            }
        }).catch(function(err) {
            console.error('Error seeding products:', err);
            mongoose.disconnect();
        });
    }







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