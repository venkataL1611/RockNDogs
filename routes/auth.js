var express = require('express');
var router = express.Router();
var passport = require('passport');

function ensureGuest(req, res, next){
  if(req.isAuthenticated()) {
    console.log('User already authenticated, redirecting to home');
    return res.redirect('/');
  }
  next();
}

function ensureAuth(req, res, next){
  if(req.isAuthenticated()) return next();
  req.session.returnTo = req.originalUrl;
  req.session.loginMessage = 'Please login to continue';
  res.redirect('/login');
}

router.get('/login', ensureGuest, function(req, res){
  const message = req.session.loginMessage;
  delete req.session.loginMessage;
  res.render('auth/login', { title: 'Login', message: message });
});

router.post('/login', ensureGuest, function(req, res, next) {
  passport.authenticate('local-login', function(err, user, info) {
    if (err) return next(err);
    if (!user) {
      console.log('Login failed - no user');
      return res.redirect('/login');
    }
    
    req.logIn(user, function(err) {
      if (err) {
        console.log('logIn error:', err);
        return next(err);
      }
      
      console.log('User logged in successfully:', user.email);
      console.log('Session ID:', req.sessionID);
      console.log('isAuthenticated:', req.isAuthenticated());
      
      // Redirect to returnTo URL if it exists, otherwise go to home
      const returnTo = req.session.returnTo || '/';
      delete req.session.returnTo;
      console.log('Redirecting to:', returnTo);
      return res.redirect(returnTo);
    });
  })(req, res, next);
});

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
