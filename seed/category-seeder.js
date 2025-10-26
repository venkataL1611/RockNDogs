var assert=require('assert');
var mongoose=require('mongoose');

var category=require('../models/category');

var categories= [new category({
    title:'Dogfood Brands'
}),
    new category({
        title:'Dog Supplies'
    })
];

var done = 0;
for(var k=0;k<categories.length;k++)
{
    categories[k].save().then(function() {
        assert(!categories.isNew);
        done++;
        if(done === categories.length) {
            console.log('Categories seeded successfully!');
            mongoose.disconnect();
        }
    }).catch(function(err) {
        console.error('Error seeding categories:', err);
        mongoose.disconnect();
    });
}
