var express = require('express');
var router = express.Router();
var canine= require('../models/dogfood');
var supplies=require('../models/supply');
var client = require('../ElasticSearch/connection');

const {promisify} = require('util');
var redis = require("redis"),
    redisClient = redis.createClient();
const getAsync = promisify(redisClient.get).bind(redisClient);


/* GET home page. */
router.get('/', function(req, res, next) {
    canine.find(function(err,docs){
        var productChunks=[];
        var chunkSize=3;
        for(var i=0;i<docs.length;i += chunkSize){
            productChunks.push(docs.slice(i,i+chunkSize));
        }
        res.render('shop/index', { title: 'Express',diets:productChunks});
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
            client.search({index: 'canines', body: body, type: 'canine'})
                .then(function (results) {
                    console.log("No hits in Redis! Data from elasticsearch/mongo");
                    var data = [];
                    results.hits.hits.forEach(function (hit) {
                        data.push(hit._source);
                        console.log(data);
                    });
                    res.render('shop/search-result', {
                        data: data
                    });
                    redisClient.set(query, JSON.stringify(results.hits.hits));
                    console.log("Data Set in Redis!");
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
