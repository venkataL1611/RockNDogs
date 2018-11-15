var express = require('express');
var router = express.Router();
var csrf=require('csurf');
var passport=require('passport');
const canine= require('../models/dogfood');
var csrfProtection=csrf();
router.use(csrfProtection);

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

/* GET Search page. */

router.post('/search', function(req, res, next) {
    res.redirect('/search?q=' + req.body.q);
});

router.get('/search', function(req, res, next){
    if (req.query.q) {
        Canine.search({
            query_string: { query: req.query.q}
        }, function(err, results) {
            results:
                if (err) return next(err);
            var data = results.hits.hits.map(function(hit) {
                return hit;
            });
            res.render('shop/search-result', {
                query: req.query.q,
                data: data
            });
        });
    }
});


/* GET signup page. */
router.get('/user/signup',function(req,res,next){
    res.render('user/signup',{csrfToken:req.csrfToken()})
});
router.post('/user/signup',passport.authenticate('local.signup',{
  successRedirect:'./profile',
  failureRedirect:'./signup',
    successFlash:true,
    failureFlash:true
}));
/*router.post('/user/signup',
    passport.authenticate('local.signup', { successRedirect: './profile',
        failureRedirect: './signup' }));*/
router.get('/user/profile',function(req,res,next) {
    res.render('user/profile');
});
module.exports = router;
