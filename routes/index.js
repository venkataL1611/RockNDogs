const express = require('express');

const router = express.Router();
const { promisify } = require('util');
const redis = require('redis');
const canine = require('../models/dogfood');
const supplies = require('../models/supply');
const client = require('../ElasticSearch/connection');

const redisClient = redis.createClient();

const getAsync = promisify(redisClient.get).bind(redisClient);

/* GET home page - redirect to /home */
router.get('/', function (req, res) {
  res.redirect('/home');
});

/* GET /home - show landing page */
router.get('/home', function (req, res) {
  res.render('shop/home', { title: 'Welcome to Rock N Dogs' });
});

/* GET /browse - show all products (dogfoods + supplies) */
router.get('/browse', async function (req, res) {
  console.log('Browse route hit');
  try {
    const dogfoods = await canine.find().lean().exec();
    const suppliesList = await supplies.find().lean().exec();

    console.log('Found dogfoods:', dogfoods.length);
    console.log('Found supplies:', suppliesList.length);

    // normalize items with a type so Add-to-cart links can target the right route
    const products = [];
    dogfoods.forEach((d) => products.push({ ...d, _type: 'dogfood' }));
    suppliesList.forEach((s) => products.push({ ...s, _type: 'supply' }));

    // render a browse view which lists all products
    res.render('shop/browse', { title: 'Browse All Products', products });
  } catch (err) {
    console.error('Browse error', err);
    res.status(500).render('shop/browse', { title: 'Browse Products', products: [] });
  }
});

/* GET Dog Food Brands Page */
router.get('/shop/dogfoods', function (req, res) {
  console.log('Dog foods route hit');
  console.log('isAuthenticated in route:', req.isAuthenticated());
  console.log('res.locals.isAuthenticated:', res.locals.isAuthenticated);
  canine.find().exec(function (err, docs) {
    if (err) {
      console.error('Error fetching dogfoods:', err);
      return res.render('shop/index', { title: 'Dog Food Brands', diets: [] });
    }
    const productChunks = [];
    const chunkSize = 3;
    for (let i = 0; i < docs.length; i += chunkSize) {
      productChunks.push(docs.slice(i, i + chunkSize));
    }
    console.log('Rendering dogfoods, chunks:', productChunks.length);
    console.log('About to render with isAuthenticated:', res.locals.isAuthenticated);
    res.render('shop/index', { title: 'Dog Food Brands', diets: productChunks });
  });
});

/* GET product detail page */
router.get('/product/:type/:id', async function (req, res) {
  const { type, id } = req.params;
  console.log('Product detail route hit:', type, id);

  try {
    let product = null;
    const productType = type;

    if (type === 'dogfood') {
      product = await canine.findById(id).lean().exec();
    } else if (type === 'supply') {
      product = await supplies.findById(id).lean().exec();
    } else {
      return res.status(404).render('error', { message: 'Invalid product type' });
    }

    if (!product) {
      return res.status(404).render('error', { message: 'Product not found' });
    }

    console.log('Raw product fields:', Object.keys(product));
    console.log('product.title:', product.title);
    console.log('product.Title:', product.Title);

    // Normalize fields
    product._type = productType;
    product.displayTitle = product.title || product.Title;
    product.displayPrice = product.Price;

    // Use longDescription for detail page, shortDescription for listing preview
    product.displayDescription = product.longDescription || product.detailedDescription || product.description
            || (`${product.displayTitle} - High quality product for your beloved pets.`);

    console.log('Product loaded:', product.displayTitle);
    console.log('Display price:', product.displayPrice);
    console.log('Using long description:', !!product.longDescription);

    res.render('shop/product-detail', {
      title: product.displayTitle,
      product
    });
  } catch (err) {
    console.error('Product detail error:', err);
    res.status(500).render('error', { message: 'Error loading product' });
  }
});

/* Get Supply Page */
router.get('/shop/supply', function (req, res) {
  supplies.find().exec(function (err, docs) {
    const productChunks = [];
    const chunkSize = 3;
    for (let i = 0; i < docs.length; i += chunkSize) {
      productChunks.push(docs.slice(i, i + chunkSize));
    }
    res.render('shop/supply', { title: 'Express', supplies: productChunks });
  });
});

/* Get Search Page */
router.get('/shop/search-result', function (req, res) {
  const query = req.query.q;
  return getAsync(query).then(function (reply) {
    if (reply === '{}' || reply === null) {
      const body = {
        query: {
          fuzzy: { title: query }

        }
      };
      client.search({ index: 'dogfoods', body })
        .then(function (results) {
          console.log('No hits in Redis! Data from elasticsearch/mongo');
          const data = [];
          if (results.hits && results.hits.hits) {
            results.hits.hits.forEach(function (hit) {
              data.push(hit._source);
            });
            redisClient.set(query, JSON.stringify(results.hits.hits));
            console.log('Data Set in Redis!');
          } else if (results.body && results.body.hits && results.body.hits.hits) {
            results.body.hits.hits.forEach(function (hit) {
              data.push(hit._source);
            });
            redisClient.set(query, JSON.stringify(results.body.hits.hits));
            console.log('Data Set in Redis!');
          }
          console.log('Found', data.length, 'results');
          res.render('shop/search-result', {
            data
          });
        })
        .catch((err) => {
          console.log(err);
          res.send({ error: err });
        });
    } else {
      const data = [];
      JSON.parse(reply).forEach((o) => {
        data.push(o._source);
        console.log(data);
        console.log('Data Pulled from Redis!');
      });
      res.render('shop/search-result', {
        data

      });
    }
  }).catch(function (err) {
    console.log(err);
  });
});

module.exports = router;
