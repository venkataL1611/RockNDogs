var express = require('express');
var router = express.Router();
var canine= require('../models/dogfood');
var supplies=require('../models/supply');
var client = require('../ElasticSearch/connection');
var Category = require('../models/category');

const {promisify} = require('util');
var redis = require("redis"),
    redisClient = redis.createClient();
const getAsync = promisify(redisClient.get).bind(redisClient);


/* GET home page - redirect to /home */
router.get('/', function(req, res, next) {
    res.redirect('/home');
});

/* GET /home - show landing page */
router.get('/home', function(req, res, next) {
    res.render('shop/home', { title: 'Welcome to Rock N Dogs' });
});

/* GET /browse - show all products (dogfoods + supplies) */
router.get('/browse', async function(req, res, next) {
    console.log('Browse route hit');
    try {
        const dogfoods = await canine.find().lean().exec();
        const suppliesList = await supplies.find().lean().exec();
        
        console.log('Found dogfoods:', dogfoods.length);
        console.log('Found supplies:', suppliesList.length);

        // normalize items with a type so Add-to-cart links can target the right route
        const products = [];
        dogfoods.forEach(d => products.push(Object.assign({}, d, { _type: 'dogfood' })));
        suppliesList.forEach(s => products.push(Object.assign({}, s, { _type: 'supply' })));

        // render a browse view which lists all products
        res.render('shop/browse', { title: 'Browse All Products', products: products });
    } catch(err) {
        console.error('Browse error', err);
        res.status(500).render('shop/browse', { title: 'Browse Products', products: [] });
    }
});

/* GET Dog Food Brands Page */
router.get('/shop/dogfoods', function(req, res, next) {
    console.log('Dog foods route hit');
    canine.find(function(err,docs){
        if(err) {
            console.error('Error fetching dogfoods:', err);
            return res.render('shop/index', { title: 'Dog Food Brands', diets: [] });
        }
        var productChunks=[];
        var chunkSize=3;
        for(var i=0;i<docs.length;i += chunkSize){
            productChunks.push(docs.slice(i,i+chunkSize));
        }
        console.log('Rendering dogfoods, chunks:', productChunks.length);
        res.render('shop/index', { title: 'Dog Food Brands', diets: productChunks });
    });
});

/*Get Supply Page*/
router.get('/shop/supply', function(req, res, next) {
    supplies.find(function(err,docs){
        var productChunks=[];
        var chunkSize=3;
        for(var i=0;i<docs.length;i += chunkSize){
            productChunks.push(docs.slice(i,i+chunkSize));
        }
        res.render('shop/supply', { title: 'Express',supplies:productChunks});
    });
});

/* Get Search Page*/
router.get('/shop/search-result', function(req, res, next){
    var query = req.query['q'];
    return getAsync(query).then(function (reply) {
        if (reply === '{}' || reply === null) {
            let body = {
                query: {
                    fuzzy: {"title": query}

                }
            }
            client.search({index: 'dogfoods', body: body})
                .then(function (results) {
                    console.log("No hits in Redis! Data from elasticsearch/mongo");
                    var data = [];
                    if (results.hits && results.hits.hits) {
                        results.hits.hits.forEach(function (hit) {
                            data.push(hit._source);
                        });
                        redisClient.set(query, JSON.stringify(results.hits.hits));
                        console.log("Data Set in Redis!");
                    } else if (results.body && results.body.hits && results.body.hits.hits) {
                        results.body.hits.hits.forEach(function (hit) {
                            data.push(hit._source);
                        });
                        redisClient.set(query, JSON.stringify(results.body.hits.hits));
                        console.log("Data Set in Redis!");
                    }
                    console.log("Found", data.length, "results");
                    res.render('shop/search-result', {
                        data: data
                    });
                })
                .catch(err => {
                console.log(err);
            res.send({error: err});
        });
        } else {
            var data = [];
            JSON.parse(reply).forEach((o) => {
                data.push(o._source);
                console.log(data);
                console.log("Data Pulled from Redis!");
        });
            res.render('shop/search-result', {
                data: data

            });
        }
    }).catch(function(err) {
        console.log(err);
    });
});


module.exports = router;
