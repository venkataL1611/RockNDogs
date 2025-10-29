const express = require('express');

const router = express.Router();
const { promisify } = require('util');
const redis = require('redis');
const canine = require('../models/dogfood');
const supplies = require('../models/supply');
const client = require('../ElasticSearch/connection');

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

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
  req.log.info('Browse route hit');
  try {
    const dogfoods = await canine.find().lean().exec();
    const suppliesList = await supplies.find().lean().exec();

    req.log.debug({ dogfoods: dogfoods.length, supplies: suppliesList.length }, 'Browse counts');

    // normalize items with a type so Add-to-cart links can target the right route
    const products = [];
    dogfoods.forEach((d) => products.push({ ...d, _type: 'dogfood' }));
    suppliesList.forEach((s) => products.push({ ...s, _type: 'supply' }));

    // render a browse view which lists all products
    res.render('shop/browse', { title: 'Browse All Products', products });
  } catch (err) {
    req.log.error({ err }, 'Browse error');
    res.status(500).render('shop/browse', { title: 'Browse Products', products: [] });
  }
});

/* GET Dog Food Brands Page */
router.get('/shop/dogfoods', function (req, res) {
  req.log.info({ isAuthenticated: req.isAuthenticated() }, 'Dog foods route hit');
  canine.find().exec(function (err, docs) {
    if (err) {
      req.log.error({ err }, 'Error fetching dogfoods');
      return res.render('shop/index', { title: 'Dog Food Brands', diets: [] });
    }
    const productChunks = [];
    const chunkSize = 3;
    for (let i = 0; i < docs.length; i += chunkSize) {
      productChunks.push(docs.slice(i, i + chunkSize));
    }
    req.log.debug({ chunks: productChunks.length, isAuthenticated: res.locals.isAuthenticated }, 'Rendering dogfoods');
    res.render('shop/index', { title: 'Dog Food Brands', diets: productChunks });
  });
});

/* GET product detail page */
router.get('/product/:type/:id', async function (req, res) {
  const { type, id } = req.params;
  req.log.info({ type, id }, 'Product detail route hit');

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

    req.log.debug({ keys: Object.keys(product) }, 'Raw product fields');

    // Normalize fields
    product._type = productType;
    product.displayTitle = product.title || product.Title;
    product.displayPrice = product.Price;

    // Use longDescription for detail page, shortDescription for listing preview
    product.displayDescription = product.longDescription || product.detailedDescription || product.description
            || (`${product.displayTitle} - High quality product for your beloved pets.`);

    req.log.info({ title: product.displayTitle, price: product.displayPrice, hasLongDescription: !!product.longDescription }, 'Product loaded');

    res.render('shop/product-detail', {
      title: product.displayTitle,
      product
    });
  } catch (err) {
    req.log.error({ err }, 'Product detail error');
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
          req.log.debug('No hits in Redis! Data from elasticsearch/mongo');
          const data = [];
          if (results.hits && results.hits.hits) {
            results.hits.hits.forEach(function (hit) {
              const item = { ...hit._source };
              item._id = hit._id;
              item._type = 'dogfood';
              data.push(item);
            });
            redisClient.set(query, JSON.stringify(results.hits.hits));
            req.log.debug('Data Set in Redis!');
          } else if (results.body && results.body.hits && results.body.hits.hits) {
            results.body.hits.hits.forEach(function (hit) {
              const item = { ...hit._source };
              item._id = hit._id;
              item._type = 'dogfood';
              data.push(item);
            });
            redisClient.set(query, JSON.stringify(results.body.hits.hits));
            req.log.debug('Data Set in Redis!');
          }
          req.log.info({ count: data.length, query }, 'Search results');
          res.render('shop/search-result', {
            data
          });
        })
        .catch((err) => {
          req.log.error({ err, query }, 'Elasticsearch search error');
          res.send({ error: err });
        });
    } else {
      const data = [];
      JSON.parse(reply).forEach((o) => {
        const item = { ...o._source };
        item._id = o._id;
        item._type = 'dogfood';
        data.push(item);
        req.log.debug('Data Pulled from Redis!');
      });
      res.render('shop/search-result', {
        data

      });
    }
  }).catch(function (err) {
    req.log.error({ err, query }, 'Search route error');
  });
});

module.exports = router;
