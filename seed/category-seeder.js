var assert=require('assert');

var category=require('../models/category');

        var categories= [new category({
            title:'Dogfood Brands'
        }),
            new category({
                title:'Dog Supplies'
            })
        ];
        for(var k=0;k<categories.length;k++)
        {
            categories[k].save().then(function() {
                    assert(!categories.isNew);
                    //done();
                }
            )};

