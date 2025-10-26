var express = require('express');
var router = express.Router();
var Cart = require('../lib/cart');
var DogFood = require('../models/dogfood');
var Supply = require('../models/supply');

router.get('/cart', function(req, res) {
  var cart = new Cart(req.session.cart ? req.session.cart : {});
  res.render('cart/cart', {
    title: 'Your Cart',
    products: cart.generateArray(),
    totalPrice: cart.totalPrice,
    totalQty: cart.totalQty
  });
});

router.get('/cart/add/:type/:id', async function(req, res) {
  var productId = req.params.id;
  var type = req.params.type;
  var cart = new Cart(req.session.cart ? req.session.cart : {});
  try {
    let product;
    if (type === 'dogfood') {
      product = await DogFood.findById(productId).exec();
      if (!product) throw new Error('DogFood not found');
    } else if (type === 'supply') {
      const s = await Supply.findById(productId).exec();
      if (!s) throw new Error('Supply not found');
      // Normalize to match cart expectations (Price number)
      product = {
        _id: s._id,
        imagepath: s.imagepath,
        title: s.Title,
        description: s.Title,
        Price: parseFloat(s.Price)
      };
    } else {
      throw new Error('Invalid product type');
    }
    cart.add(product, product._id);
    req.session.cart = cart;
    res.redirect('back');
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});

module.exports = router;
