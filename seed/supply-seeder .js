var mocha=require('mocha');
var assert=require('assert');

//var Supplies= require('../models/supply');
var canine= require('../models/dogfood');
//var category=require('../models/category');

// Describe our tests
   /*describe('Saving products', function(){
    this.timeout(500);
    // Create tests
    it('Saves a record to the database', function(done){
        setTimeout(done, 300);*/
        var supplies = [new canine({
            imagepath : "https://res.cloudinary.com/dcmgqkay2/image/upload/v1543538654/Images/Bowl.jpg",
            description : "Stainless Steel dog bowl with rubber-base skid resistance",
            title : "Bowl",
            price : "13"
        }),
            new canine({
                imagepath : "https://res.cloudinary.com/dcmgqkay2/image/upload/v1543538612/Images/41kGZSkgfcL._SL500_AC_SS350_.jpg",
                description : "Engineered for large dogs",
                title : "Dog Bed",
                price : "$25"
            }),
            new canine({
                imagepath : "https://res.cloudinary.com/dcmgqkay2/image/upload/v1543538452/Images/Dog_Bowl.jpg",
                description : "Super Design melamine bowl",
                title : "Dog Bowl",
                price : "$14"
            }),
            new canine({
                imagepath : "https://res.cloudinary.com/dcmgqkay2/image/upload/v1543538654/Images/Dog_Harness.jpg",
                description : "Leash set for small puppies",
                title : "Dog Harness",
                price : "$21"
            }),
            new canine({
                imagepath : "https://res.cloudinary.com/dcmgqkay2/image/upload/v1543538660/Images/Round_Bowl.jpg",
                description : "Bone dry ceramic round pet bowl",
                title : "Round Bowl",
                price : "$31"
            }),
            new canine({
                imagepath : "https://res.cloudinary.com/dcmgqkay2/image/upload/v1543538655/Images/Large_Harness.jpg",
                description : "No-Pull Outdoor Pet Vest",
                title : "Large Harness",
                price : "$19"
            }),
            new canine({
                imagepath : "https://res.cloudinary.com/dcmgqkay2/image/upload/v1543538656/Images/Net_Harness.jpg",
                description : "Adjustable dog vest with net surface reflective material straps",
                title : "Net Harness",
                price : "$24"
            }),
            new canine({
                imagepath : "https://res.cloudinary.com/dcmgqkay2/image/upload/v1543538654/Images/Dog_Frisbee.jpg",
                description : "Flying disc, flying saucer assortment",
                title : "Dog Frisbee",
                price : "$34"
            }),
            new canine({
                imagepath : "https://res.cloudinary.com/dcmgqkay2/image/upload/v1543538655/Images/Harness.jpg",
                description : "Reflective No Pull Harness with Handle and Two Leash Attachments",
                title : "Harness",
                price : "$26"
            }),
            new canine({
                imagepath : "https://res.cloudinary.com/dcmgqkay2/image/upload/v1543538654/Images/Dog_Toy.jpg",
                description : "Rattle and chew-toy",
                title : "Dog Toy",
                price : "$9"
            }),
            new canine({
                imagepath : "https://res.cloudinary.com/dcmgqkay2/image/upload/v1543538656/Images/Nerf_Dog.jpg",
                description : "20inch Tennis Ball Blaster",
                title : "Nerf Dog"
            })
        ];
        //
        // var categories= [new category({
        //     title:'Dogfood Brands',
        //
        // })
        // ];
        for(var k=0;k<supplies.length;k++)
        {
            supplies[k].save().then(function() {
                    assert(!supplies.isNew);
                    //done();
                }
            )};







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