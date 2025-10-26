var express = require('express');
var router = express.Router();
var passport = require('passport');

function ensureGuest(req, res, next){
  if(req.isAuthenticated()) return res.redirect('/');
  next();
}

function ensureAuth(req, res, next){
  if(req.isAuthenticated()) return next();
  res.redirect('/login');
}

router.get('/login', ensureGuest, function(req, res){
  res.render('auth/login', { title: 'Login' });
});

router.post('/login', ensureGuest, passport.authenticate('local-login', {
  successRedirect: '/',
  failureRedirect: '/login'
}));

router.get('/signup', ensureGuest, function(req, res){
  res.render('auth/signup', { title: 'Sign up' });
});

router.post('/signup', ensureGuest, passport.authenticate('local-signup', {
  successRedirect: '/',
  failureRedirect: '/signup'
}));

router.get('/logout', ensureAuth, function(req, res){
  req.logout(function(){
    res.redirect('/');
  });
});

module.exports = router;
