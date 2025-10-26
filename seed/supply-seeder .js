var mocha=require('mocha');
var assert=require('assert');
var mongoose=require('mongoose');

var Supplies= require('../models/supply');

var supplies = [new Supplies({
            imagepath : "https://res.cloudinary.com/dcmgqkay2/image/upload/v1543538654/Images/Bowl.jpg",
            Title : "Bowl",
            Price : "13"
        }),
            new Supplies({
                imagepath : "https://res.cloudinary.com/dcmgqkay2/image/upload/v1543538612/Images/41kGZSkgfcL._SL500_AC_SS350_.jpg",
                Title : "Dog Bed",
                Price : "25"
            }),
            new Supplies({
                imagepath : "https://res.cloudinary.com/dcmgqkay2/image/upload/v1543538452/Images/Dog_Bowl.jpg",
                Title : "Dog Bowl",
                Price : "14"
            }),
            new Supplies({
                imagepath : "https://res.cloudinary.com/dcmgqkay2/image/upload/v1543538654/Images/Dog_Harness.jpg",
                Title : "Dog Harness",
                Price : "21"
            }),
            new Supplies({
                imagepath : "https://res.cloudinary.com/dcmgqkay2/image/upload/v1543538660/Images/Round_Bowl.jpg",
                Title : "Round Bowl",
                Price : "31"
            }),
            new Supplies({
                imagepath : "https://res.cloudinary.com/dcmgqkay2/image/upload/v1543538655/Images/Large_Harness.jpg",
                Title : "Large Harness",
                Price : "19"
            }),
            new Supplies({
                imagepath : "https://res.cloudinary.com/dcmgqkay2/image/upload/v1543538656/Images/Net_Harness.jpg",
                Title : "Net Harness",
                Price : "24"
            }),
            new Supplies({
                imagepath : "https://res.cloudinary.com/dcmgqkay2/image/upload/v1543538654/Images/Dog_Frisbee.jpg",
                Title : "Dog Frisbee",
                Price : "34"
            }),
            new Supplies({
                imagepath : "https://res.cloudinary.com/dcmgqkay2/image/upload/v1543538655/Images/Harness.jpg",
                Title : "Harness",
                Price : "26"
            }),
            new Supplies({
                imagepath : "https://res.cloudinary.com/dcmgqkay2/image/upload/v1543538654/Images/Dog_Toy.jpg",
                Title : "Dog Toy",
                Price : "9"
            }),
            new Supplies({
                imagepath : "https://res.cloudinary.com/dcmgqkay2/image/upload/v1543538656/Images/Nerf_Dog.jpg",
                Title : "Nerf Dog",
            Price : "20"
        })
    ];
    
    var done = 0;
    for(var k=0;k<supplies.length;k++)
    {
        supplies[k].save().then(function() {
            assert(!supplies.isNew);
            done++;
            if(done === supplies.length) {
                console.log('Dog supplies seeded successfully!');
                mongoose.disconnect();
            }
        }).catch(function(err) {
            console.error('Error seeding supplies:', err);
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