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

// GET logout - simplified version
router.get('/logout', function(req, res, next){
  console.log('Logout route hit, user:', req.user ? req.user.email : 'none');
  
  // Store session ID before destroying
  const sessionID = req.sessionID;
  
  // Simple logout without callback (older passport versions)
  try {
    req.logout();
    console.log('req.logout() called');
  } catch(e) {
    console.error('Logout error:', e);
  }
  
  // Destroy session
  if(req.session) {
    req.session.destroy(function(err){
      if(err) {
        console.error('Session destroy error:', err);
      }
      console.log('Session destroyed');
    });
  }
  
  // Clear cookie
  res.clearCookie('connect.sid', { path: '/' });
  console.log('Cookie cleared, redirecting to home');
  
  // Redirect immediately
  res.redirect('/home');
});

// POST logout (more secure, prevents CSRF)
router.post('/logout', function(req, res, next){
  if(!req.user) {
    return res.json({ success: true, redirect: '/home' });
  }
  
  req.logout(function(err){
    if(err) {
      console.error('Logout error:', err);
      return res.json({ success: false, error: 'Logout failed' });
    }
    
    req.session.destroy(function(destroyErr){
      if(destroyErr) {
        console.error('Session destroy error:', destroyErr);
      }
      res.clearCookie('connect.sid', { path: '/' });
      res.json({ success: true, redirect: '/home' });
    });
  });
});

module.exports = router;
